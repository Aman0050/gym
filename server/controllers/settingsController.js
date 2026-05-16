const db = require('../config/db');
const logger = require('../utils/logger');

const getSettings = async (req, res) => {
  const gymId = req.user.gym_id;
  try {
    const result = await db.query('SELECT * FROM gym_settings WHERE gym_id = $1', [gymId]);
    
    // If no settings exist yet, return defaults
    if (result.rows.length === 0) {
      return res.json({
        expiry_reminder_days: 3,
        auto_freeze_enabled: true,
        grace_period_days: 0,
        tax_percentage: 0,
        invoice_prefix: 'INV',
        currency: 'INR',
        whatsapp_enabled: false,
        email_enabled: false,
        realtime_alerts_enabled: true
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const updateSettings = async (req, res) => {
  const gymId = req.user.gym_id;
  const { 
    expiry_reminder_days, auto_freeze_enabled, grace_period_days,
    tax_percentage, invoice_prefix, currency,
    whatsapp_enabled, email_enabled, realtime_alerts_enabled 
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO gym_settings (
        gym_id, expiry_reminder_days, auto_freeze_enabled, grace_period_days,
        tax_percentage, invoice_prefix, currency,
        whatsapp_enabled, email_enabled, realtime_alerts_enabled, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (gym_id) DO UPDATE SET
        expiry_reminder_days = EXCLUDED.expiry_reminder_days,
        auto_freeze_enabled = EXCLUDED.auto_freeze_enabled,
        grace_period_days = EXCLUDED.grace_period_days,
        tax_percentage = EXCLUDED.tax_percentage,
        invoice_prefix = EXCLUDED.invoice_prefix,
        currency = EXCLUDED.currency,
        whatsapp_enabled = EXCLUDED.whatsapp_enabled,
        email_enabled = EXCLUDED.email_enabled,
        realtime_alerts_enabled = EXCLUDED.realtime_alerts_enabled,
        updated_at = NOW()
      RETURNING *`,
      [
        gymId, expiry_reminder_days, auto_freeze_enabled, grace_period_days,
        tax_percentage, invoice_prefix, currency,
        whatsapp_enabled, email_enabled, realtime_alerts_enabled
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = { getSettings, updateSettings };
