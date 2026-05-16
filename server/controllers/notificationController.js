const db = require('../config/db');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE gym_id = $1 ORDER BY created_at DESC LIMIT 50',
      [gymId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND gym_id = $2',
      [id, gymId]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

module.exports = { getNotifications, markAsRead };
