const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

/**
 * Log a generic product event
 */
router.post('/log', protect, async (req, res, next) => {
  try {
    const { event, path, metadata } = req.body;
    
    // Log to structured file for ELK/Sentry processing
    logger.info(`[PRODUCT_INTEL] Event: ${event} | User: ${req.user.id} | Path: ${path}`, { metadata });

    // Optional: Store in DB for internal dashboards
    await db.query(
      'INSERT INTO audit_logs (gym_id, user_id, action, metadata) VALUES ($1, $2, $3, $4)',
      [req.user.gym_id, req.user.id, `EVENT_${event}`, JSON.stringify({ path, ...metadata })]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * Collect direct user feedback
 */
router.post('/feedback', protect, async (req, res, next) => {
  try {
    const { feedback, category, rating } = req.body;
    
    logger.info(`[USER_FEEDBACK] ${category}: ${feedback} (Rating: ${rating})`, { user: req.user.id });

    // Store in feedback table
    await db.query(
      'INSERT INTO audit_logs (gym_id, user_id, action, metadata) VALUES ($1, $2, $3, $4)',
      [req.user.gym_id, req.user.id, 'USER_FEEDBACK', JSON.stringify({ feedback, category, rating })]
    );

    res.status(201).json({ success: true, message: 'Intel captured. Thank you.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
