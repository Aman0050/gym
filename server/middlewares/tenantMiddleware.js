const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Middleware to enforce tenant-level suspension checks.
 * This runs on EVERY authenticated request to ensure real-time enforcement.
 */
const checkTenantStatus = async (req, res, next) => {
  try {
    const gymId = req.user.gym_id;

    if (!gymId) return next();

    // Fetch the latest status directly from DB (bypassing any stale cache/token info)
    const result = await db.query(
      'SELECT saas_subscription_status, suspension_reason FROM gyms WHERE id = $1',
      [gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: 'Your gym account could not be found.'
      });
    }

    const gym = result.rows[0];

    if (gym.saas_subscription_status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'GYM_SUSPENDED',
        message: 'Your gym account has been suspended.',
        reason: gym.suspension_reason || 'Compliance or billing review in progress.'
      });
    }

    if (gym.saas_subscription_status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        code: 'GYM_DISABLED',
        message: 'Your gym account has been disabled.'
      });
    }

    next();
  } catch (err) {
    logger.error('Tenant status check failed:', err);
    res.status(500).json({ error: 'Internal security check failed' });
  }
};

module.exports = { checkTenantStatus };
