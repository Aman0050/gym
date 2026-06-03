const db = require('../config/db');
const logger = require('../utils/logger');
const exportService = require('../services/exportService');
const { get, set, del, CACHE_TTL } = require('../services/cacheService');

// Get all members with search, filter, sorting and pagination
const getMembers = async (req, res) => {
  const gymId = req.user.gym_id;
  const { search, status, page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  // Validate sorting inputs
  const allowedSortFields = ['name', 'created_at', 'status'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    let whereClause = 'WHERE m.gym_id = $1';
    const params = [gymId];

    if (search) {
      whereClause += ` AND (m.name ILIKE $${params.length + 1} OR m.phone ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (status && status !== 'ALL') {
      whereClause += ` AND m.status = $${params.length + 1}`;
      params.push(status);
    }

    // 1. Efficient Count Query
    const countQuery = `SELECT COUNT(*) FROM members m ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // 2. Optimized Data Query with Pagination
    const query = `
      SELECT m.*, p.valid_until, p.amount as last_payment, p.plan_name 
      FROM members m 
      LEFT JOIN (
        SELECT DISTINCT ON (member_id) 
          payments.member_id, payments.valid_until, payments.amount, pl.name AS plan_name 
        FROM payments 
        LEFT JOIN plans pl ON payments.plan_id = pl.id
        WHERE payments.gym_id = $1
        ORDER BY payments.member_id, payments.valid_until DESC
      ) p ON m.id = p.member_id 
      ${whereClause}
      ORDER BY m.${sortField} ${sortOrder} 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    res.json({
      members: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    logger.error('Fetch members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

const createMember = async (req, res) => {
  const { name, phone, emergency_contact, blood_group } = req.body;
  const gymId = req.user.gym_id;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Valid name is required' });
  }
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }

  try {
    const resMember = await db.query(
      'INSERT INTO members (name, phone, emergency_contact, blood_group, gym_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, emergency_contact, blood_group, gymId]
    );

    // Emit Event
    const { eventBus, EVENTS } = require('../events/eventBus');
    eventBus.emit(EVENTS.MEMBER_CREATED, { gymId, member: resMember.rows[0] });

    res.status(201).json(resMember.rows[0]);
  } catch (err) {
    logger.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to create member' });
  }
};

const freezeMembership = async (req, res) => {
  const { id } = req.params;
  const { reasonType, customReason, notes } = req.body;
  const gymId = req.user.gym_id;
  const adminId = req.user.id;

  try {
    const result = await db.query(
      `UPDATE members 
       SET status = 'FROZEN', 
           frozen_at = NOW(),
           freeze_reason_type = $1,
           freeze_custom_reason = $2,
           freeze_notes = $3,
           frozen_by = $4,
           freeze_date = NOW()
       WHERE id = $5 AND gym_id = $6 AND status != 'FROZEN' 
       RETURNING *`,
      [reasonType, customReason, notes, adminId, id, gymId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Member not found or already frozen' });
    }

    // Invalidate Cache
    await del(gymId, `member_profile:${id}`);

    res.json({ message: 'Membership frozen successfully', member: result.rows[0] });
  } catch (err) {
    logger.error('Freeze membership error:', err);
    res.status(500).json({ error: 'Server error during freeze' });
  }
};

const unfreezeMembership = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;

  try {
    await db.query('BEGIN');

    // 1. Get member and their freeze date
    const memberResult = await db.query(
      "SELECT * FROM members WHERE id = $1 AND gym_id = $2 AND status = 'FROZEN'",
      [id, gymId]
    );
    if (memberResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Member not found or not frozen' });
    }
    const member = memberResult.rows[0];

    // 2. Calculate frozen days
    const frozenAt = new Date(member.frozen_at);
    const now = new Date();
    const frozenDays = Math.ceil((now - frozenAt) / (1000 * 60 * 60 * 24));

    // 3. Extend valid_until for the latest payment
    await db.query(
      `UPDATE payments SET valid_until = valid_until + interval '${frozenDays} days' 
       WHERE member_id = $1 AND gym_id = $2 AND valid_until >= $3`,
      [id, gymId, member.frozen_at]
    );

    // 4. Reset member status
    const result = await db.query(
      `UPDATE members SET 
        status = 'ACTIVE', 
        frozen_at = NULL,
        freeze_reason_type = NULL,
        freeze_custom_reason = NULL,
        freeze_notes = NULL,
        frozen_by = NULL,
        freeze_date = NULL
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await db.query('COMMIT');

    // Invalidate Cache
    await del(gymId, `member_profile:${id}`);

    const { eventBus } = require('../events/eventBus');
    eventBus.emit('member.updated', { gymId, memberId: id, status: 'ACTIVE' });

    res.json({ 
      message: `Membership unfrozen. Extended by ${frozenDays} days.`, 
      member: result.rows[0] 
    });
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Unfreeze membership error:', err);
    res.status(500).json({ error: 'Server error during unfreeze' });
  }
};

const getMemberProfile = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;
  const bypassCache = req.query.bypassCache === 'true';

  try {
    if (!bypassCache) {
      const cachedProfile = await get(gymId, `member_profile:${id}`);
      if (cachedProfile) {
        return res.json(cachedProfile);
      }
    }

    const member = await db.query('SELECT * FROM members WHERE id = $1 AND gym_id = $2', [id, gymId]);
    if (member.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    
    const payments = await db.query('SELECT * FROM payments WHERE member_id = $1 ORDER BY payment_date DESC', [id]);
    const attendance = await db.query('SELECT * FROM attendance WHERE member_id = $1 ORDER BY check_in_time DESC LIMIT 30', [id]);
    
    const profileData = {
      profile: member.rows[0],
      payments: payments.rows,
      attendance: attendance.rows
    };

    // Cache profile for 60 seconds (Phase 11)
    await set(gymId, `member_profile:${id}`, profileData, CACHE_TTL.MEMBER);

    res.json(profileData);
  } catch (err) {
    logger.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const exportMembers = async (req, res) => {
  const gymId   = req.user.gym_id;
  const adminId = req.user.id;
  const { format = 'csv', status, planId, startDate, endDate } = req.query;

  try {
    // ── Build Filtered Query ──────────────────────────────────────────────
    let query = `
      SELECT 
        m.name        AS "Full Name",
        m.id          AS "Member ID",
        m.phone       AS "Phone Number",
        m.status      AS "Status",
        m.join_date   AS "Join Date",
        p.valid_until AS "Expiry Date",
        p.plan_name   AS "Membership Plan",
        p.amount      AS "Last Payment"
      FROM members m
      LEFT JOIN (
        SELECT DISTINCT ON (member_id)
          member_id, valid_until, amount, plan_id, pl.name AS plan_name
        FROM payments
        JOIN plans pl ON payments.plan_id = pl.id
        WHERE payments.gym_id = $1
        ORDER BY member_id, valid_until DESC
      ) p ON m.id = p.member_id
      WHERE m.gym_id = $1
    `;
    const params = [gymId];

    if (status && status !== 'ALL') {
      query += ` AND m.status = $${params.length + 1}`;
      params.push(status);
    }
    if (planId) {
      query += ` AND p.plan_id = $${params.length + 1}`;
      params.push(planId);
    }
    if (startDate) {
      query += ` AND m.join_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND m.join_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    query += ' ORDER BY m.name ASC';

    const result     = await db.query(query, params);
    const rawMembers = result.rows;

    // ── Gym / Admin Metadata ──────────────────────────────────────────────
    const gymResult = await db.query('SELECT name FROM gyms WHERE id = $1', [gymId]);
    const gymName   = gymResult.rows[0]?.name || 'FitNexo Gym';
    const adminName = req.user.name || req.user.email || 'Administrator';

    // ── Audit Log ─────────────────────────────────────────────────────────
    try {
      await db.query(
        `INSERT INTO export_logs (gym_id, exported_by, export_type, format, records_count, filters_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [gymId, adminId, 'MEMBERS', format.toUpperCase(), rawMembers.length, JSON.stringify(req.query)]
      );
    } catch (auditErr) {
      logger.warn('Audit logging skipped:', auditErr.message);
    }

    // ── Delegate to Export Service ────────────────────────────────────────
    const cleanMembers = exportService.buildMemberReportData(rawMembers);
    const meta         = exportService.buildMeta({ gymName, adminName, totalCount: rawMembers.length, filters: req.query });
    const filename     = exportService.buildFilename(format === 'xlsx' ? 'xlsx' : 'csv', gymName);

    if (cleanMembers.length === 0) {
      cleanMembers.push({
        'Member Name':            'No records matched the selected filters',
        'Member ID':              '—',
        'Contact Number':         '—',
        'Membership Status':      '—',
        'Membership Start Date':  '—',
        'Membership Expiry Date': '—',
        'Active Plan':            '—',
        'Last Payment Amount':    '—',
      });
    }

    // ── XLSX ──────────────────────────────────────────────────────────────
    if (format === 'xlsx') {
      const workbook = exportService.buildXLSXWorkbook(cleanMembers, meta);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // ── CSV ───────────────────────────────────────────────────────────────
    if (format === 'csv') {
      const csv = exportService.buildCSVReport(cleanMembers, meta);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send('\uFEFF' + csv); // BOM for Excel UTF-8 (₹ symbol)
    }

    res.json({ success: true, meta, members: cleanMembers });

  } catch (err) {
    logger.error('Export members error:', err);
    res.status(500).json({
      success: false,
      code: 'EXPORT_FAILED',
      message: 'Report generation failed. Please retry or contact your system administrator.',
    });
  }
};

const bulkAction = async (req, res) => {
  const { memberIds, action, data } = req.body;
  const gymId = req.user.gym_id;
  const adminId = req.user.id;

  if (!memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Invalid member IDs array' });
  }

  const { uuidRegex } = require('../middlewares/validateMiddleware');
  if (memberIds.some(id => !uuidRegex.test(id))) {
    return res.status(400).json({ error: 'One or more member IDs are invalid' });
  }

  try {
    await db.query('BEGIN');

    let result;
    switch (action) {
      case 'FREEZE':
        result = await db.query(
          `UPDATE members 
           SET status = 'FROZEN', 
               frozen_at = NOW(), 
               freeze_notes = $1,
               frozen_by = $2
           WHERE id = ANY($3) AND gym_id = $4 AND status != 'FROZEN'
           RETURNING id`,
          [data?.notes || 'Bulk Freeze', adminId, memberIds, gymId]
        );
        break;
      case 'UNFREEZE':
        result = await db.query(
          `UPDATE members 
           SET status = 'ACTIVE', 
               frozen_at = NULL,
               frozen_by = NULL
           WHERE id = ANY($1) AND gym_id = $2 AND status = 'FROZEN'
           RETURNING id`,
          [memberIds, gymId]
        );
        break;
      case 'DELETE':
        result = await db.query(
          'DELETE FROM members WHERE id = ANY($1) AND gym_id = $2 RETURNING id',
          [memberIds, gymId]
        );
        break;
      default:
        throw new Error('Unsupported bulk action');
    }

    await db.query('COMMIT');

    // Invalidate Cache for all modified members
    for (const mId of memberIds) {
      await del(gymId, `member_profile:${mId}`);
    }

    res.json({ 
      message: `Bulk ${(action || '').toLowerCase()} completed`, 
      count: result.rowCount,
      affectedIds: result.rows.map(r => r.id)
    });
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Bulk action error:', err);
    res.status(500).json({ error: 'Failed to process bulk operation' });
  }
};

const updateMember = async (req, res) => {
  const { id } = req.params;
  const { name, phone, emergency_contact, blood_group, status } = req.body;
  const gymId = req.user.gym_id;

  try {
    const result = await db.query(
      `UPDATE members 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           emergency_contact = COALESCE($3, emergency_contact), 
           blood_group = COALESCE($4, blood_group), 
           status = COALESCE($5, status)
       WHERE id = $6 AND gym_id = $7
       RETURNING *`,
      [name, phone, emergency_contact, blood_group, status, id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Invalidate Cache
    await del(gymId, `member_profile:${id}`);

    const { eventBus } = require('../events/eventBus');
    eventBus.emit('member.updated', { gymId, memberId: id, status: result.rows[0].status });

    res.json({ message: 'Member updated successfully', member: result.rows[0] });
  } catch (err) {
    logger.error('Update member error:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
};

const deleteMember = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;

  try {
    const result = await db.query(
      'DELETE FROM members WHERE id = $1 AND gym_id = $2 RETURNING id',
      [id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Invalidate Cache
    await del(gymId, `member_profile:${id}`);

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    logger.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
};

module.exports = { 
  getMembers, 
  createMember, 
  updateMember,
  freezeMembership, 
  unfreezeMembership, 
  getMemberProfile,
  exportMembers,
  bulkAction,
  deleteMember
};
