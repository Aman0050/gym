const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    // Run UPI settings migration
    const upiMigration = fs.readFileSync('./migrations/20260526_add_upi_settings.sql', 'utf8');
    await pool.query(upiMigration);
    console.log('UPI settings migration applied successfully');

    // Run bank transfer migration
    const bankMigration = fs.readFileSync('./migrations/20260526_add_bank_transfer.sql', 'utf8');
    await pool.query(bankMigration);
    console.log('Bank transfer migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
