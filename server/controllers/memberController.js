const db = require('../config/db');
const logger = require('../utils/logger');

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

    if (status) {
      whereClause += ` AND m.status = $${params.length + 1}`;
      params.push(status);
    }

    // 1. Efficient Count Query
    const countQuery = `SELECT COUNT(*) FROM members m ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // 2. Optimized Data Query with Pagination
    const query = `
      SELECT m.*, p.valid_until, p.amount as last_payment 
      FROM members m 
      LEFT JOIN (
        SELECT DISTINCT ON (member_id) member_id, valid_until, amount 
        FROM payments 
        ORDER BY member_id, valid_until DESC
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
  const gymId = req.user.gym_id;

  try {
    const result = await db.query(
      "UPDATE members SET status = 'FROZEN', frozen_at = NOW() WHERE id = $1 AND gym_id = $2 AND status = 'ACTIVE' RETURNING *",
      [id, gymId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Member not found or already frozen' });
    }
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
    // 1. Get member and their freeze date
    const memberResult = await db.query(
      "SELECT * FROM members WHERE id = $1 AND gym_id = $2 AND status = 'FROZEN'",
      [id, gymId]
    );
    if (memberResult.rows.length === 0) {
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
      "UPDATE members SET status = 'ACTIVE', frozen_at = NULL WHERE id = $1 RETURNING *",
      [id]
    );

    const { eventBus } = require('../events/eventBus');
    eventBus.emit('member.updated', { gymId, memberId: id, status: 'ACTIVE' });

    res.json({ 
      message: `Membership unfrozen. Extended by ${frozenDays} days.`, 
      member: result.rows[0] 
    });
  } catch (err) {
    logger.error('Unfreeze membership error:', err);
    res.status(500).json({ error: 'Server error during unfreeze' });
  }
};

const getMemberProfile = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;
  try {
    const member = await db.query('SELECT * FROM members WHERE id = $1 AND gym_id = $2', [id, gymId]);
    if (member.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    
    const payments = await db.query('SELECT * FROM payments WHERE member_id = $1 ORDER BY payment_date DESC', [id]);
    const attendance = await db.query('SELECT * FROM attendance WHERE member_id = $1 ORDER BY check_in_time DESC LIMIT 30', [id]);
    
    res.json({
      profile: member.rows[0],
      payments: payments.rows,
      attendance: attendance.rows
    });
  } catch (err) {
    logger.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

module.exports = { 
  getMembers, 
  createMember, 
  freezeMembership, 
  unfreezeMembership, 
  getMemberProfile 
};
