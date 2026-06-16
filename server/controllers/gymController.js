const db = require('../config/db');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

const deleteGym = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM gyms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gym not found' });
    
    // Note: Due to ON DELETE CASCADE on our DB schema, 
    // all related users, plans, members, payments, and attendance will also be deleted.
    
    logger.info(`Gym ${id} and all associated data deleted by Super Admin`);
    res.json({ success: true, message: 'Gym and all associated data deleted successfully' });
  } catch (err) {
    logger.error('Delete gym error:', err);
    res.status(500).json({ error: 'Failed to delete gym' });
  }
};

const getGyms = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.*, 
      (SELECT COUNT(*) FROM members WHERE gym_id = g.id) as total_members,
      (SELECT SUM(amount) FROM payments WHERE gym_id = g.id) as total_revenue,
      COALESCE(g.contact_person, (SELECT email FROM users WHERE gym_id = g.id AND role = 'ADMIN' LIMIT 1)) as contact_person
      FROM gyms g 
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch gyms error:', err);
    res.status(500).json({ error: 'Failed to fetch gyms' });
  }
};

const createGym = async (req, res) => {
  const { name, phone, address, saas_valid_until, owner_qr } = req.body;
  try {
    const validUntil = saas_valid_until ? saas_valid_until : null;
    const result = await db.query(
      'INSERT INTO gyms (name, phone, address, saas_valid_until, owner_qr) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, address, validUntil, owner_qr || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create gym error:', err);
    res.status(500).json({ error: 'Failed to create gym' });
  }
};

const updateGym = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, contact_person, login_id, password, owner_qr } = req.body;
  try {
    await db.query('BEGIN');
    const result = await db.query(
      'UPDATE gyms SET name = COALESCE($1, name), phone = COALESCE($2, phone), address = COALESCE($3, address), contact_person = COALESCE($4, contact_person), owner_qr = CASE WHEN $5::boolean = true THEN $6 ELSE owner_qr END WHERE id = $7 RETURNING *',
      [name, phone, address, contact_person, owner_qr !== undefined, owner_qr || null, id]
    );
    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (login_id || password) {
      let queryParts = [];
      let values = [];
      let idx = 1;
      
      if (login_id) {
        // Check uniqueness if changing
        const exists = await db.query('SELECT id FROM gym_accounts WHERE gym_id = $1 AND branch_id != $2', [login_id.trim().toLowerCase(), id]);
        if (exists.rows.length > 0) {
          await db.query('ROLLBACK');
          return res.status(409).json({ error: 'Login ID already taken by another branch.' });
        }
        queryParts.push(`gym_id = $${idx++}`);
        values.push(login_id.trim().toLowerCase());
      }
      
      if (password && password.length > 0) {
        queryParts.push(`password_hash = $${idx++}`);
        values.push(await bcrypt.hash(password, 12));
      }
      
      values.push(id);
      if (queryParts.length > 0) {
        await db.query(`UPDATE gym_accounts SET ${queryParts.join(', ')} WHERE branch_id = $${idx}`, values);
      }
    }

    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Update gym error:', err);
    res.status(500).json({ error: 'Failed to update gym profile and credentials' });
  }
};

const notifyGym = async (req, res) => {
  const { id } = req.params;
  const { title, message, type } = req.body;
  try {
    // Check if notification table exists or has gym_id
    await db.query(
      "INSERT INTO notifications (gym_id, title, message, type) VALUES ($1, $2, $3, $4)",
      [id, title, message, type || 'IN_APP']
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('Notify gym error:', err);
    res.status(500).json({ error: 'Failed to notify gym' });
  }
};

const updateGymStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body; // 'ACTIVE', 'SUSPENDED', 'DISABLED'
  const adminId = req.user.id;

  try {
    // 1. Update Gym Status and Metadata
    const result = await db.query(
      `UPDATE gyms 
       SET saas_subscription_status = $1::varchar, 
           suspension_reason = $2,
           suspended_at = CASE WHEN $1::varchar = 'SUSPENDED' THEN CURRENT_TIMESTAMP ELSE suspended_at END,
           suspended_by = CASE WHEN $1::varchar = 'SUSPENDED' THEN $3::uuid ELSE suspended_by END
       WHERE id = $4 RETURNING *`,
      [status, reason || null, adminId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Gym not found' });

    // 2. Record Audit Log
    await db.query(
      'INSERT INTO tenant_audit_logs (gym_id, action, reason, performed_by) VALUES ($1, $2, $3, $4)',
      [id, status === 'ACTIVE' ? 'REACTIVATION' : 'SUSPENSION', reason || null, adminId]
    );
    
    // 3. Trigger Real-time Lockout if Suspended
    if (status === 'SUSPENDED' || status === 'DISABLED') {
      eventBus.emit(EVENTS.GYM_SUSPENDED, { 
        gymId: id, 
        reason: reason || 'Account under review',
        performedBy: adminId
      });
    }

    logger.info(`Gym ${id} status updated to ${status} by Admin ${adminId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update gym status error:', err);
    res.status(500).json({ error: 'Failed to update gym status' });
  }
};

const getGlobalAnalytics = async (req, res) => {
  try {
    const [totalGyms, totalRevenue, totalMembers] = await Promise.all([
      db.query('SELECT COUNT(*) FROM gyms'),
      db.query('SELECT SUM(amount) FROM payments'),
      db.query('SELECT COUNT(*) FROM members')
    ]);

    const activeGyms = await db.query("SELECT COUNT(*) FROM gyms WHERE saas_subscription_status = 'ACTIVE'");

    res.json({
      totalGyms: parseInt(totalGyms.rows[0].count),
      activeGyms: parseInt(activeGyms.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
      totalMembers: parseInt(totalMembers.rows[0].count),
    });
  } catch (err) {
    logger.error('Global analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch global analytics' });
  }
};

const { uuidRegex } = require('../middlewares/validateMiddleware');

// POST /api/gym/create-account
const createGymAccount = async (req, res) => {
  const { branch_id, gym_id, password } = req.body;

  // Basic validation
  if (!branch_id || !gym_id || !password) {
    return res.status(400).json({ error: 'branch_id, gym_id, and password are required' });
  }
  if (!uuidRegex.test(branch_id)) {
    return res.status(400).json({ error: 'Invalid branch_id format' });
  }
  if (gym_id.trim().length < 3) {
    return res.status(400).json({ error: 'Gym ID must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check gym_id uniqueness
    const exists = await db.query('SELECT id FROM gym_accounts WHERE gym_id = $1', [(gym_id || '').trim().toLowerCase()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'This Gym ID is already taken. Please choose another.' });
    }

    // Verify branch exists
    const branch = await db.query('SELECT id FROM gyms WHERE id = $1', [branch_id]);
    if (branch.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Hash password securely
    const password_hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      'INSERT INTO gym_accounts (branch_id, gym_id, password_hash) VALUES ($1, $2, $3) RETURNING id, branch_id, gym_id, created_at',
      [branch_id, (gym_id || '').trim().toLowerCase(), password_hash]
    );

    logger.info(`Gym account created for branch ${branch_id} with gym_id: ${gym_id}`);
    res.status(201).json({ success: true, account: result.rows[0] });
  } catch (err) {
    logger.error('Create gym account error:', err);
    res.status(500).json({ error: 'Failed to create gym account' });
  }
};

// GET /api/gym/check-id?gym_id=xxx
const checkGymIdAvailability = async (req, res) => {
  const { gym_id } = req.query;
  if (!gym_id || gym_id.trim().length < 3) {
    return res.status(400).json({ error: 'gym_id must be at least 3 characters' });
  }
  try {
    const exists = await db.query('SELECT id FROM gym_accounts WHERE gym_id = $1', [(gym_id || '').trim().toLowerCase()]);
    res.json({ available: exists.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Check failed' });
  }
};

const assignManager = async (req, res) => {
  const { id } = req.params;
  const { contact_person } = req.body;
  try {
    const result = await db.query(
      'UPDATE gyms SET contact_person = $1 WHERE id = $2 RETURNING *',
      [contact_person || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gym not found' });
    logger.info(`Gym ${id} manager updated to ${contact_person}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update manager error:', err);
    res.status(500).json({ error: 'Failed to update manager' });
  }
};

const getGymDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const branchRes = await db.query(`
      SELECT g.*, ga.gym_id as login_id 
      FROM gyms g 
      LEFT JOIN gym_accounts ga ON g.id = ga.branch_id 
      WHERE g.id = $1
    `, [id]);
    if (branchRes.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    const branch = branchRes.rows[0];

    const revenueRes = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_revenue
      FROM payments WHERE gym_id = $1
    `, [id]);
    const revenueStats = revenueRes.rows[0];

    const memberStatsRes = await db.query('SELECT status, COUNT(*) as count FROM members WHERE gym_id = $1 GROUP BY status', [id]);
    let membershipStats = { active: 0, inactive: 0, frozen: 0, pending: 0, total: 0 };
    memberStatsRes.rows.forEach(r => {
      const s = r.status ? r.status.toLowerCase() : 'inactive';
      membershipStats[s] = (membershipStats[s] || 0) + parseInt(r.count);
      membershipStats.total += parseInt(r.count);
    });

    const attendanceRes = await db.query(`
      SELECT check_in_time FROM attendance 
      WHERE gym_id = $1 AND check_in_time >= NOW() - INTERVAL '30 days'
      ORDER BY check_in_time DESC
    `, [id]);
    
    const paymentsRes = await db.query(`
      SELECT p.*, m.name as member_name, pl.name as plan_name
      FROM payments p
      LEFT JOIN members m ON p.member_id = m.id
      LEFT JOIN plans pl ON p.plan_id = pl.id
      WHERE p.gym_id = $1
      ORDER BY p.payment_date DESC
      LIMIT 50
    `, [id]);

    res.json({
      branch,
      revenueStats,
      membershipStats,
      attendanceStats: attendanceRes.rows,
      payments: paymentsRes.rows,
      trainers: [],
      recentActivity: []
    });
  } catch (err) {
    logger.error('Fetch gym details error:', err);
    res.status(500).json({ error: 'Failed to fetch branch details' });
  }
};

module.exports = { getGyms, createGym, updateGymStatus, getGlobalAnalytics, createGymAccount, checkGymIdAvailability, assignManager, getGymDetails, updateGym, notifyGym, deleteGym };
