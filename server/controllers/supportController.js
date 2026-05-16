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

const createTicket = async (req, res) => {
  const gymId = req.user.gym_id;
  const userId = req.user.id;
  const { title, issue_type, priority, description } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO support_tickets (gym_id, created_by, title, issue_type, priority, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [gymId, userId, title, issue_type, priority, description]
    );
    res.json(result.rows[0]);
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

module.exports = { getFAQs, createTicket, getTickets };
