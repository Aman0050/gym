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

    // 2. Define Query Strings & Parameters
    let revenueQuery = '';
    let growthQuery = '';
    let queryParams = [gymId];

    if (range === 'Last 6 Months') {
      revenueQuery = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          )::date AS m
        )
        SELECT TO_CHAR(months.m, 'Mon') as month, COALESCE(SUM(p.amount), 0) as total, MIN(months.m) as sort_date
        FROM months
        LEFT JOIN payments p ON p.gym_id = $1 
          AND p.payment_date >= months.m 
          AND p.payment_date < months.m + interval '1 month'
          AND (p.payment_status IS NULL OR p.payment_status = 'PAID')
        GROUP BY months.m
        ORDER BY months.m ASC
      `;
      growthQuery = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          )::date AS m
        )
        SELECT TO_CHAR(months.m, 'Mon') as month, COUNT(m.id) as count, MIN(months.m) as sort_date
        FROM months
        LEFT JOIN members m ON m.gym_id = $1 
          AND m.join_date >= months.m 
          AND m.join_date < months.m + interval '1 month'
        GROUP BY months.m
        ORDER BY months.m ASC
      `;
    } else if (range === 'This Month') {
      revenueQuery = `
        WITH dates AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE),
            (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
            '1 day'::interval
          )::date AS d
        )
        SELECT TO_CHAR(dates.d, 'DD Mon') as month, COALESCE(SUM(p.amount), 0) as total, MIN(dates.d) as sort_date
        FROM dates
        LEFT JOIN payments p ON p.gym_id = $1 
          AND p.payment_date >= dates.d 
          AND p.payment_date < dates.d + interval '1 day'
          AND (p.payment_status IS NULL OR p.payment_status = 'PAID')
        GROUP BY dates.d
        ORDER BY dates.d ASC
      `;
      growthQuery = `
        WITH dates AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE),
            (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
            '1 day'::interval
          )::date AS d
        )
        SELECT TO_CHAR(dates.d, 'DD Mon') as month, COUNT(m.id) as count, MIN(dates.d) as sort_date
        FROM dates
        LEFT JOIN members m ON m.gym_id = $1 
          AND m.join_date >= dates.d 
          AND m.join_date < dates.d + interval '1 day'
        GROUP BY dates.d
        ORDER BY dates.d ASC
      `;
    } else {
      // Default: This Week (Last 7 Days)
      revenueQuery = `
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS d
        )
        SELECT TO_CHAR(dates.d, 'Dy') as month, COALESCE(SUM(p.amount), 0) as total, MIN(dates.d) as sort_date
        FROM dates
        LEFT JOIN payments p ON p.gym_id = $1 
          AND p.payment_date >= dates.d 
          AND p.payment_date < dates.d + interval '1 day'
          AND (p.payment_status IS NULL OR p.payment_status = 'PAID')
        GROUP BY dates.d
        ORDER BY dates.d ASC
      `;
      growthQuery = `
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS d
        )
        SELECT TO_CHAR(dates.d, 'Dy') as month, COUNT(m.id) as count, MIN(dates.d) as sort_date
        FROM dates
        LEFT JOIN members m ON m.gym_id = $1 
          AND m.join_date >= dates.d 
          AND m.join_date < dates.d + interval '1 day'
        GROUP BY dates.d
        ORDER BY dates.d ASC
      `;
    }

    const expiringQuery = `
      SELECT m.id, m.name, m.phone, p.valid_until, pl.name AS plan_name
      FROM members m
      JOIN (
        SELECT DISTINCT ON (member_id) 
          member_id, valid_until, plan_id 
        FROM payments 
        WHERE gym_id = $1
        ORDER BY member_id, valid_until DESC
      ) p ON p.member_id = m.id
      LEFT JOIN plans pl ON p.plan_id = pl.id
      WHERE m.gym_id = $1 
      AND (
        p.valid_until <= CURRENT_DATE + INTERVAL '7 days'
        AND p.valid_until >= CURRENT_DATE - INTERVAL '30 days'
      )
      ORDER BY p.valid_until ASC
    `;

    const recentActivityQuery = `
      SELECT p.*, m.name as member_name 
      FROM payments p 
      JOIN members m ON p.member_id = m.id 
      WHERE p.gym_id = $1 
      ORDER BY p.payment_date DESC LIMIT 5
    `;

    // 3. Execute all queries CONCURRENTLY to eliminate API Waterfall
    const [
      kpis,
      revenueTrend,
      growthTrend,
      expiringResult,
      recentActivityResult
    ] = await Promise.all([
      biService.getKPISummary(gymId),
      db.query(revenueQuery, queryParams),
      db.query(growthQuery, queryParams),
      db.query(expiringQuery, [gymId]),
      db.query(recentActivityQuery, [gymId])
    ]);

    const dashboardData = {
      summary: kpis,
      trends: {
        revenue: revenueTrend.rows,
        growth: growthTrend.rows
      },
      expiringSoon: expiringResult.rows,
      recentActivity: recentActivityResult.rows
    };

    // 4. Save to Cache
    await set(gymId, `dashboard_data_${range.replace(/\s+/g, '_')}`, dashboardData, CACHE_TTL.DASHBOARD);

    res.json(dashboardData);
  } catch (err) {
    logger.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced dashboard stats' });
  }
};

module.exports = { getDashboardStats };
