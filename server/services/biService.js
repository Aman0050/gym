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

    const result = await db.query(
      `WITH member_stats AS (
         SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
           COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired
         FROM members WHERE gym_id = $1
       ),
       revenue_stats AS (
         SELECT 
           SUM(CASE WHEN payment_date >= CURRENT_DATE THEN amount ELSE 0 END) as today_revenue,
           SUM(CASE WHEN payment_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END) as this_month,
           SUM(CASE WHEN payment_date >= date_trunc('month', CURRENT_DATE - interval '1 month') 
                    AND payment_date < date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END) as last_month
         FROM payments WHERE gym_id = $1
       ),
       pricing_stats AS (
         SELECT 
           COUNT(CASE WHEN pricing_type = 'CUSTOM' THEN 1 END) as custom_count,
           SUM(original_price - amount) as total_discounts
         FROM payments WHERE gym_id = $1
       )
       SELECT * FROM member_stats, revenue_stats, pricing_stats`,
      [gymId]
    );

    const data = result.rows[0];
    const active = parseInt(data.active || 0);
    const total = parseInt(data.total || 0);
    const rev_this = parseFloat(data.this_month || 0);
    const rev_last = parseFloat(data.last_month || 0);

    const retentionRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;
    const growth = rev_last > 0 ? (((rev_this - rev_last) / rev_last) * 100).toFixed(1) : 100;

    const kpiSummary = {
      activeMembers: active,
      totalMembers: total,
      retentionRate: `${retentionRate}%`,
      todayRevenue: parseFloat(data.today_revenue || 0),
      monthlyRevenue: rev_this,
      revenueGrowth: `${growth}%`,
      customPricingCount: parseInt(data.custom_count || 0),
      totalDiscountsGiven: parseFloat(data.total_discounts || 0)
    };

    // 4. Set Cache (TTL: 5 mins)
    await cache.set(gymId, 'analytics:kpi_summary', kpiSummary, cache.CACHE_TTL.SHORT);

    return kpiSummary;

    // 6. Set Cache (TTL: 5 mins)
    await cache.set(gymId, 'analytics:kpi_summary', result, cache.CACHE_TTL.SHORT);

    return result;
  } catch (error) {
    logger.error('BI KPI calculation error:', error);
    throw error;
  }
};

module.exports = { getKPISummary };
