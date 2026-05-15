const db = require('../config/db');
const logger = require('../utils/logger');
const cache = require('./cacheService');

const getKPISummary = async (gymId) => {
  try {
    // 1. Check Cache First (Multi-tenant Key)
    const cachedData = await cache.get(gymId, 'analytics:kpi_summary');
    if (cachedData) {
      logger.info(`Cache Hit: Analytics for Gym ${gymId}`);
      return cachedData;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 2. Current Snapshot
    const snapshot = await db.query(
      `SELECT * FROM daily_stats WHERE gym_id = $1 AND date = $2`,
      [gymId, today]
    );

    // 3. Aggregate Totals
    const totals = await db.query(
      `SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_members,
        COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_members
       FROM members WHERE gym_id = $1`,
      [gymId]
    );

    const m = totals.rows[0];
    const active = parseInt(m.active_members);
    const total = parseInt(m.total_members);

    // KPI Calculations
    const retentionRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;
    const churnRate = total > 0 ? (((total - active) / total) * 100).toFixed(1) : 0;

    // 4. Revenue Trend
    const revenueStats = await db.query(
      `SELECT 
        SUM(CASE WHEN payment_date >= CURRENT_DATE THEN amount ELSE 0 END) as today_revenue,
        SUM(CASE WHEN payment_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END) as this_month,
        SUM(CASE WHEN payment_date >= date_trunc('month', CURRENT_DATE - interval '1 month') 
                 AND payment_date < date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END) as last_month
       FROM payments WHERE gym_id = $1`,
      [gymId]
    );

    const rev = revenueStats.rows[0];
    const growth = rev.last_month > 0 
      ? (((rev.this_month - rev.last_month) / rev.last_month) * 100).toFixed(1)
      : 100;

    // 5. Custom Pricing Metrics
    const pricingStats = await db.query(
      `SELECT 
        COUNT(CASE WHEN pricing_type = 'CUSTOM' THEN 1 END) as custom_count,
        SUM(original_price - amount) as total_discounts
       FROM payments WHERE gym_id = $1`,
      [gymId]
    );

    const p = pricingStats.rows[0];

    const result = {
      activeMembers: active,
      totalMembers: total,
      retentionRate: `${retentionRate}%`,
      churnRate: `${churnRate}%`,
      todayRevenue: parseFloat(rev.today_revenue || 0),
      monthlyRevenue: parseFloat(rev.this_month || 0),
      revenueGrowth: `${growth}%`,
      customPricingCount: parseInt(p.custom_count || 0),
      totalDiscountsGiven: parseFloat(p.total_discounts || 0),
      snapshot: snapshot.rows[0] || {}
    };

    // 6. Set Cache (TTL: 5 mins)
    await cache.set(gymId, 'analytics:kpi_summary', result, cache.CACHE_TTL.SHORT);

    return result;
  } catch (error) {
    logger.error('BI KPI calculation error:', error);
    throw error;
  }
};

module.exports = { getKPISummary };
