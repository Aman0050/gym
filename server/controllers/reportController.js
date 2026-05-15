const db = require('../config/db');
const logger = require('../utils/logger');
const biService = require('../services/biService');
const { getCachedDashboard, cacheDashboard } = require('../services/cacheService');

const getDashboardStats = async (req, res) => {
  try {
    const gymId = req.user.gym_id;

    // 1. Try Cache First
    const cachedData = await getCachedDashboard(gymId);
    if (cachedData) {
      return res.json({ ...cachedData, _cached: true });
    }

    // 2. Core BI KPIs
    const kpis = await biService.getKPISummary(gymId);

    // 3. Monthly Revenue Trend (Last 6 Months)
    const revenueTrend = await db.query(
      `SELECT 
         TO_CHAR(payment_date, 'Mon') as month,
         SUM(amount) as total,
         MIN(payment_date) as sort_date
       FROM payments 
       WHERE gym_id = $1 AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY month
       ORDER BY sort_date ASC`,
      [gymId]
    );

    // 4. Member Growth Trend (Last 6 Months)
    const growthTrend = await db.query(
      `SELECT 
         TO_CHAR(join_date, 'Mon') as month,
         COUNT(*) as count,
         MIN(join_date) as sort_date
       FROM members 
       WHERE gym_id = $1 AND join_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY month
       ORDER BY sort_date ASC`,
      [gymId]
    );

    // 5. Expiring Soon Members (Next 7 Days)
    const expiringResult = await db.query(
      `SELECT m.id, m.name, m.phone, p.valid_until, pl.name as plan_name
       FROM payments p
       JOIN members m ON p.member_id = m.id
       LEFT JOIN plans pl ON p.plan_id = pl.id
       WHERE p.gym_id = $1 
       AND p.valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
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
    await cacheDashboard(gymId, dashboardData);

    res.json(dashboardData);
  } catch (err) {
    logger.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced dashboard stats' });
  }
};

module.exports = { getDashboardStats };
