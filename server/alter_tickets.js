const { Pool } = require('pg');
require('dotenv').config({path: './.env'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    await pool.query("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL");
    console.log("Added assigned_to column");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
