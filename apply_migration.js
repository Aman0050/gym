const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({path: './server/.env'});

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const sql = fs.readFileSync('./server/migrations/20260527_add_contact_person.sql', 'utf8');
    await pool.query(sql);
    console.log("Migration applied successfully!");
  } catch(e) {
    console.error("Migration error:", e);
  } finally {
    process.exit(0);
  }
}
run();
