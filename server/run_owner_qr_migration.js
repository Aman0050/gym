const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const migration = fs.readFileSync('./migrations/20260616_add_owner_qr_to_gyms.sql', 'utf8');
    await pool.query(migration);
    console.log('✅ Gym owner QR migration applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
