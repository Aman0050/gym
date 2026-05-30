const db = require('../config/db');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  const gymId = req.user.gym_id;
  const role = req.user.role;
  try {
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await db.query(
        'SELECT * FROM notifications WHERE gym_id IS NULL ORDER BY created_at DESC LIMIT 50'
      );
    } else {
      result = await db.query(
        'SELECT * FROM notifications WHERE gym_id = $1 ORDER BY created_at DESC LIMIT 50',
        [gymId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;
  const role = req.user.role;
  try {
    if (role === 'SUPER_ADMIN') {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND gym_id IS NULL',
        [id]
      );
    } else {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND gym_id = $2',
        [id, gymId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

const markAllAsRead = async (req, res) => {
  const gymId = req.user.gym_id;
  const role = req.user.role;
  try {
    if (role === 'SUPER_ADMIN') {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE gym_id IS NULL AND is_read = false'
      );
    } else {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE gym_id = $1 AND is_read = false',
        [gymId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
