const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMembers() {
  try {
    const res = await pool.query("SELECT id, name, phone, status FROM members LIMIT 10");
    console.log('Members found:', res.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkMembers();
