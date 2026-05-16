const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Global Omnisearch - Search across Members, Plans, and Payments
 */
const globalSearch = async (req, res) => {
  const { q } = req.query;
  const gymId = req.user.gym_id;

  if (!q || q.length < 2) {
    return res.json({ results: [] });
  }

  try {
    const searchTerm = `%${q}%`;
    
    // 1. Search Members
    const membersQuery = `
      SELECT id, name, phone, status, 'MEMBER' as type 
      FROM members 
      WHERE gym_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)
      LIMIT 5
    `;
    
    // 2. Search Plans
    const plansQuery = `
      SELECT id, name, price::text as info, 'PLAN' as type 
      FROM plans 
      WHERE gym_id = $1 AND name ILIKE $2
      LIMIT 3
    `;

    // 3. Search Payments (by ID or Amount)
    const paymentsQuery = `
      SELECT p.id, m.name as info, p.amount::text as title, 'PAYMENT' as type 
      FROM payments p
      JOIN members m ON p.member_id = m.id
      WHERE p.gym_id = $1 AND (p.id::text ILIKE $2 OR m.name ILIKE $2)
      LIMIT 3
    `;

    const [members, plans, payments] = await Promise.all([
      db.query(membersQuery, [gymId, searchTerm]),
      db.query(plansQuery, [gymId, searchTerm]),
      db.query(paymentsQuery, [gymId, searchTerm])
    ]);

    const results = [
      ...members.rows.map(m => ({ ...m, title: m.name, subtitle: m.phone, icon: 'User' })),
      ...plans.rows.map(p => ({ ...p, title: p.name, subtitle: `₹${p.info}`, icon: 'Activity' })),
      ...payments.rows.map(py => ({ ...py, title: `Payment: ₹${py.title}`, subtitle: py.info, icon: 'CreditCard' }))
    ];

    res.json({ results });
  } catch (err) {
    logger.error('Global search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};

module.exports = { globalSearch };
