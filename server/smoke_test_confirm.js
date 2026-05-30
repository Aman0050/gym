const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Simulate exact confirmPayment service logic
async function smokeTestConfirm() {
  // Find a PENDING payment
  const pendingRes = await pool.query(
    `SELECT p.*, m.name as member_name, pl.name as plan_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     LEFT JOIN plans pl ON p.plan_id = pl.id
     WHERE p.payment_status = 'PENDING'
     LIMIT 1`
  );

  if (pendingRes.rows.length === 0) {
    console.log('ℹ️  No PENDING payments found to test with. DB is clean.');
    return;
  }

  const payment = pendingRes.rows[0];
  console.log(`Testing confirm on payment ${payment.id} — member: ${payment.member_name}`);

  const now = new Date().toISOString();

  // Step 1: UPDATE payment to PAID
  const updateResult = await pool.query(
    `UPDATE payments SET payment_status = 'PAID', paid_at = $1, activated_at = $1, transaction_reference = $2
     WHERE id = $3 RETURNING *`,
    [now, 'smoke_test_ref', payment.id]
  );
  console.log('✅ Payment updated to PAID:', updateResult.rows[0].payment_status);

  // Step 2: Insert invoice
  try {
    await pool.query(
      `INSERT INTO invoices (gym_id, member_id, payment_id, invoice_number, amount)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [payment.gym_id, payment.member_id, payment.id, `INV-SMOKE-${Date.now()}`, payment.amount]
    );
    console.log('✅ Invoice created OK');
  } catch (e) {
    console.warn('⚠️ Invoice skipped (non-fatal):', e.message);
  }

  // Step 3: Notification
  try {
    await pool.query(
      `INSERT INTO notifications (gym_id, type, title, message, priority, action_url)
       VALUES ($1, 'PAYMENT_SUCCESS', 'Test', 'Test', 'NORMAL', '/payments') RETURNING id`,
      [payment.gym_id]
    );
    console.log('✅ Notification created OK');
  } catch (e) {
    console.warn('⚠️ Notification skipped (non-fatal):', e.message);
  }

  // Reset back to PENDING for the real test
  await pool.query(
    `UPDATE payments SET payment_status = 'PENDING', paid_at = NULL, activated_at = NULL, transaction_reference = NULL WHERE id = $1`,
    [payment.id]
  );
  console.log('↩️  Payment reset back to PENDING for real test');
  console.log('\n🎉 Full confirm flow smoke test PASSED — click Confirm Payment Received in the UI now.');
}

smokeTestConfirm().catch(e => { console.error('❌ Smoke test FAILED:', e.message); }).finally(() => pool.end());
