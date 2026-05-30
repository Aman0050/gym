const db = require('../config/db');
const logger = require('../utils/logger');

const getFAQs = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM faq_articles ORDER BY priority DESC, created_at ASC');
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch FAQs error:', err);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

const { broadcastToSuperAdmins } = require('../services/socketService');

const createTicket = async (req, res) => {
  const gymId = req.user.gym_id;
  const userId = req.user.id;
  const { title, issue_type, priority, description } = req.body;

  try {
    console.log("Ticket Received:", req.body);
    const gymRes = await db.query('SELECT name, address FROM gyms WHERE id = $1', [gymId]);
    const gymName = gymRes.rows[0]?.name || 'Unknown Gym';
    const branchName = gymRes.rows[0]?.address || 'Unknown Branch';

    const result = await db.query(
      `INSERT INTO support_tickets (gym_id, created_by, title, issue_type, priority, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [gymId, userId, title, issue_type, priority, description]
    );

    const ticket = result.rows[0];
    console.log("Ticket Saved:", ticket);

    // Log the creation
    await db.query(
      `INSERT INTO support_audit_logs (ticket_id, action, user_id) VALUES ($1, $2, $3)`,
      [ticket.id, 'Ticket Created', userId]
    );

    // Add admin notification
    const notifResult = await db.query(
      `INSERT INTO notifications (title, message, type, action_url) VALUES ($1, $2, 'IN_APP', $3) RETURNING *`,
      [`New Support Ticket: ${title}`, `Priority: ${priority} from ${gymName}`, `/super-admin/support/tickets/${ticket.id}`]
    );

    const notification = notifResult.rows[0];

    // Emit socket event to platform admins
    console.log("Emitting SUPPORT_TICKET_CREATED socket event to Super Admins...");
    broadcastToSuperAdmins('SUPPORT_TICKET_CREATED', {
      ticketId: ticket.id,
      gymId,
      gymName,
      branchName,
      issueTitle: title,
      priority,
      type: issue_type,
      createdAt: ticket.created_at
    });
    
    // Emit notification event for Intelligence Hub
    broadcastToSuperAdmins('NEW_NOTIFICATION', { notification });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    logger.error('Create ticket error:', err);
    res.status(500).json({ error: 'Failed to submit support ticket' });
  }
};

const getTickets = async (req, res) => {
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      'SELECT * FROM support_tickets WHERE gym_id = $1 ORDER BY created_at DESC',
      [gymId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

const adminGetTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT st.*, g.name as gym_name, g.address as location 
      FROM support_tickets st
      JOIN gyms g ON st.gym_id = g.id
      ORDER BY st.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Admin fetch tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch platform tickets' });
  }
};

const adminGetTicketDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const ticketRes = await db.query(`
      SELECT st.*, g.name as gym_name, g.address as location 
      FROM support_tickets st
      JOIN gyms g ON st.gym_id = g.id
      WHERE st.id = $1
    `, [id]);

    const logsRes = await db.query(`
      SELECT l.*, u.email as user_email, u.role as user_role
      FROM support_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.ticket_id = $1
      ORDER BY l.created_at ASC
    `, [id]);

    res.json({ ticket: ticketRes.rows[0], logs: logsRes.rows });
  } catch (err) {
    logger.error('Admin fetch ticket detail error:', err);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
};

const adminUpdateTicket = async (req, res) => {
  const { id } = req.params;
  const { status, assigned_to } = req.body;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `UPDATE support_tickets SET status = COALESCE($1, status), assigned_to = COALESCE($2, assigned_to), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, assigned_to, id]
    );

    let actionMsg = 'Ticket Updated';
    if (status) actionMsg = `Status changed to ${status}`;
    if (assigned_to) actionMsg = `Assigned to ${assigned_to}`;

    await db.query(
      `INSERT INTO support_audit_logs (ticket_id, action, user_id) VALUES ($1, $2, $3)`,
      [id, actionMsg, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Admin update ticket error:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

module.exports = { getFAQs, createTicket, getTickets, adminGetTickets, adminGetTicketDetails, adminUpdateTicket };
