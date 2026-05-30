const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Global Batch Refresh (Cron Job)
 * Re-calculates state-heavy metrics (active members) once a day
 */
const refreshDailyStats = async () => {
  try {
    logger.info('Starting Global Analytics Refresh Job...');
    
    const query = `
      INSERT INTO daily_stats (gym_id, date, total_revenue, total_active_members, new_members)
      SELECT 
        g.id as gym_id,
        CURRENT_DATE as date,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        (SELECT COUNT(*) FROM members WHERE gym_id = g.id AND status = 'ACTIVE') as total_active_members,
        (SELECT COUNT(*) FROM members WHERE gym_id = g.id AND join_date = CURRENT_DATE) as new_members
      FROM gyms g
      LEFT JOIN payments p ON g.id = p.gym_id AND p.payment_date::date = CURRENT_DATE
      GROUP BY g.id
      ON CONFLICT (gym_id, date) DO UPDATE SET
        total_active_members = EXCLUDED.total_active_members,
        new_members = EXCLUDED.new_members,
        created_at = NOW()
    `;

    const result = await db.query(query);
    logger.info(`Analytics Refresh: ${result.rowCount} gyms updated.`);
    return result.rowCount;
  } catch (error) {
    logger.error(`Analytics Refresh Failed: ${error.message}`);
  }
};

/**
 * Real-time Incremental Aggregator
 * Updates counters instantly as events happen
 */
const incrementStats = async (gymId, fields) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const setClause = Object.keys(fields)
      .map((key) => `${key} = COALESCE(${key}, 0) + EXCLUDED.${key}`)
      .join(', ');

    const query = `
      INSERT INTO daily_stats (gym_id, date, ${Object.keys(fields).join(', ')})
      VALUES ($1, $2, ${Object.keys(fields).map((_, i) => `$${i + 3}`).join(', ')})
      ON CONFLICT (gym_id, date)
      DO UPDATE SET ${setClause}, created_at = NOW()
    `;

    await db.query(query, [gymId, today, ...Object.values(fields)]);
  } catch (err) {
    logger.error('Incremental Analytics Error:', err);
  }
};

module.exports = { refreshDailyStats, incrementStats };
