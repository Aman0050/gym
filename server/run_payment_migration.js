const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const migration = fs.readFileSync('./migrations/payment_flow_migration.sql', 'utf8');
    await pool.query(migration);
    console.log('✅ Payment flow migration applied successfully');
    console.log('   - payment_status column added (PENDING/PAID/FAILED)');
    console.log('   - transaction_reference column added');
    console.log('   - paid_at column added');
    console.log('   - activated_at column added');
    console.log('   - BANK_TRANSFER added to payment_mode constraint');
    console.log('   - Existing payments backfilled as PAID');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
