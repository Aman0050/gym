require('dotenv').config({ path: './server/.env' });
const db = require('./server/config/db');

async function fixMembers() {
  try {
    const res = await db.query(`
      UPDATE members m
      SET status = 'ACTIVE'
      FROM (
        SELECT DISTINCT ON (member_id) member_id, valid_until
        FROM payments
        ORDER BY member_id, valid_until DESC
      ) p
      WHERE m.id = p.member_id 
      AND m.status = 'EXPIRED'
      AND p.valid_until >= CURRENT_DATE
      RETURNING m.name;
    `);
    console.log('Fixed members:', res.rows.map(r => r.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixMembers();
