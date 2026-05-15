const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT id, email, role, gym_id FROM users');
    console.log('Users found:', res.rows);
    
    const gyms = await pool.query('SELECT id, name, saas_subscription_status FROM gyms');
    console.log('Gyms found:', gyms.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
