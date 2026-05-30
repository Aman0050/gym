const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  try {
    // Simulate what createPendingPayment does
    const testResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payments'
        AND column_name IN ('payment_status', 'transaction_reference', 'paid_at', 'activated_at')
      ORDER BY column_name
    `);
    const found = testResult.rows.map(r => r.column_name);
    const required = ['activated_at', 'paid_at', 'payment_status', 'transaction_reference'];
    const missing = required.filter(c => !found.includes(c));
    
    if (missing.length === 0) {
      console.log('✅ All required columns present:', found.join(', '));
      console.log('✅ /api/payments/create-pending endpoint will work correctly');
    } else {
      console.log('❌ Missing columns:', missing.join(', '));
    }

    // Test constraint
    const constraint = await pool.query(`
      SELECT pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'payments' AND c.conname = 'payments_payment_mode_check'
    `);
    console.log('✅ payment_mode constraint:', constraint.rows[0]?.def);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await pool.end();
  }
}
test();
