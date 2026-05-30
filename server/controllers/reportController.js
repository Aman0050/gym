const db = require('../config/db');
const logger = require('../utils/logger');
const biService = require('../services/biService');
const { getCachedDashboard, cacheDashboard } = require('../services/cacheService');

const getDashboardStats = async (req, res) => {
  try {
    const gymId = req.user.gym_id;
    const range = req.query.range || 'This Week';

    // 1. Try Cache First
    const { get, set, CACHE_TTL } = require('../services/cacheService');
    const cachedData = await get(gymId, `dashboard_data_${range.replace(/\s+/g, '_')}`);
    if (cachedData) {
      return res.json({ ...cachedData, _cached: true });
    }

    // 2. Core BI KPIs
    const kpis = await biService.getKPISummary(gymId);

    // 3 & 4. Dynamic Trends Based on Range
    let revenueQuery = '';
    let growthQuery = '';
    let queryParams = [gymId];

    if (range === 'Last 6 Months') {
      revenueQuery = `
        SELECT TO_CHAR(payment_date, 'Mon') as month, SUM(amount) as total, MIN(payment_date) as sort_date
        FROM payments WHERE gym_id = $1 AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY month ORDER BY sort_date ASC
      `;
      growthQuery = `
        SELECT TO_CHAR(join_date, 'Mon') as month, COUNT(*) as count, MIN(join_date) as sort_date
        FROM members WHERE gym_id = $1 AND join_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY month ORDER BY sort_date ASC
      `;
    } else if (range === 'This Month') {
      revenueQuery = `
        SELECT TO_CHAR(payment_date, 'DD Mon') as month, SUM(amount) as total, MIN(payment_date) as sort_date
        FROM payments WHERE gym_id = $1 AND date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
        GROUP BY TO_CHAR(payment_date, 'DD Mon') ORDER BY sort_date ASC
      `;
      growthQuery = `
        SELECT TO_CHAR(join_date, 'DD Mon') as month, COUNT(*) as count, MIN(join_date) as sort_date
        FROM members WHERE gym_id = $1 AND date_trunc('month', join_date) = date_trunc('month', CURRENT_DATE)
        GROUP BY TO_CHAR(join_date, 'DD Mon') ORDER BY sort_date ASC
      `;
    } else {
      // Default: This Week (Last 7 Days)
      revenueQuery = `
        SELECT TO_CHAR(payment_date, 'Dy') as month, SUM(amount) as total, MIN(payment_date) as sort_date
        FROM payments WHERE gym_id = $1 AND payment_date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY TO_CHAR(payment_date, 'Dy') ORDER BY sort_date ASC
      `;
      growthQuery = `
        SELECT TO_CHAR(join_date, 'Dy') as month, COUNT(*) as count, MIN(join_date) as sort_date
        FROM members WHERE gym_id = $1 AND join_date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY TO_CHAR(join_date, 'Dy') ORDER BY sort_date ASC
      `;
    }

    const revenueTrend = await db.query(revenueQuery, queryParams);
    const growthTrend = await db.query(growthQuery, queryParams);

    // 5. Expiring Soon Members (Next 7 Days + Past 30 Days)
    const expiringResult = await db.query(
      `SELECT m.id, m.name, m.phone, p.valid_until, pl.name AS plan_name
       FROM members m
       JOIN (
         SELECT DISTINCT ON (member_id) 
           member_id, valid_until, plan_id 
         FROM payments 
         ORDER BY member_id, valid_until DESC
       ) p ON p.member_id = m.id
       LEFT JOIN plans pl ON p.plan_id = pl.id
       WHERE m.gym_id = $1 
       AND (
         p.valid_until <= CURRENT_DATE + INTERVAL '7 days'
         AND p.valid_until >= CURRENT_DATE - INTERVAL '30 days'
       )
       ORDER BY p.valid_until ASC`,
      [gymId]
    );

    // 6. Recent Activity (Latest 5 payments)
    const recentActivity = await db.query(
      `SELECT p.*, m.name as member_name 
       FROM payments p 
       JOIN members m ON p.member_id = m.id 
       WHERE p.gym_id = $1 
       ORDER BY p.payment_date DESC LIMIT 5`,
      [gymId]
    );

    const dashboardData = {
      summary: kpis,
      trends: {
        revenue: revenueTrend.rows,
        growth: growthTrend.rows
      },
      expiringSoon: expiringResult.rows,
      recentActivity: recentActivity.rows
    };

    // 7. Save to Cache
    await set(gymId, `dashboard_data_${range.replace(/\s+/g, '_')}`, dashboardData, CACHE_TTL.SHORT);

    res.json(dashboardData);
  } catch (err) {
    logger.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced dashboard stats' });
  }
};

module.exports = { getDashboardStats };
