const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

const getGyms = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.*, 
      (SELECT COUNT(*) FROM members WHERE gym_id = g.id) as total_members,
      (SELECT SUM(amount) FROM payments WHERE gym_id = g.id) as total_revenue
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
  const { name, location, contact_person, phone, email } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO gyms (name, location, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, location, contact_person, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create gym error:', err);
    res.status(500).json({ error: 'Failed to create gym' });
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
       SET saas_subscription_status = $1, 
           suspension_reason = $2,
           suspended_at = CASE WHEN $1 = 'SUSPENDED' THEN CURRENT_TIMESTAMP ELSE suspended_at END,
           suspended_by = CASE WHEN $1 = 'SUSPENDED' THEN $3 ELSE suspended_by END
       WHERE id = $4 RETURNING *`,
      [status, reason || null, adminId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Gym not found' });

    // 2. Record Audit Log
    await db.query(
      'INSERT INTO tenant_audit_logs (gym_id, action, reason, performed_by) VALUES ($1, $2, $3, $4)',
      [id, status === 'ACTIVE' ? 'REACTIVATION' : 'SUSPENSION', reason, adminId]
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

module.exports = { getGyms, createGym, updateGymStatus, getGlobalAnalytics };
