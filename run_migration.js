const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({path: './server/.env'});

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const filename = process.argv[2];
    if (!filename) {
      console.error("Please provide a migration file path");
      process.exit(1);
    }
    const sql = fs.readFileSync(filename, 'utf8');
    await pool.query(sql);
    console.log(`Migration ${filename} applied successfully!`);
  } catch(e) {
    console.error("Migration error:", e);
  } finally {
    process.exit(0);
  }
}
run();
