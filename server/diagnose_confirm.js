const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const r1 = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position`
  );
  console.log('notifications columns:', r1.rows.map(r => r.column_name).join(', '));

  const r2 = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position`
  );
  console.log('invoices columns:', r2.rows.map(r => r.column_name).join(', '));

  // Try a test confirm to see what crashes
  const payRes = await pool.query(
    `SELECT id, member_id, payment_status FROM payments WHERE payment_status = 'PENDING' LIMIT 1`
  );
  if (payRes.rows.length > 0) {
    console.log('Found PENDING payment:', payRes.rows[0]);
    // Test the exact query from confirmPayment
    const fetchResult = await pool.query(
      `SELECT p.*, m.name as member_name, pl.name as plan_name
       FROM payments p
       JOIN members m ON p.member_id = m.id
       LEFT JOIN plans pl ON p.plan_id = pl.id
       WHERE p.id = $1`,
      [payRes.rows[0].id]
    );
    console.log('Fetch result OK:', fetchResult.rows[0]?.id);
    // Test the UPDATE
    // Actually let's just test the notifications INSERT which is the likely crash
    const notifTest = await pool.query(
      `INSERT INTO notifications (gym_id, type, title, message, priority, action_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [fetchResult.rows[0].gym_id, 'PAYMENT_SUCCESS', 'Test', 'Test message', 'NORMAL', '/payments']
    );
    console.log('Notification insert OK:', notifTest.rows[0]?.id);
    // Clean up test notification
    await pool.query('DELETE FROM notifications WHERE id = $1', [notifTest.rows[0].id]);
  } else {
    console.log('No PENDING payments found - using most recent payment for test');
    const recent = await pool.query(`SELECT id, gym_id, member_id FROM payments ORDER BY created_at DESC LIMIT 1`);
    console.log('Recent payment:', recent.rows[0]);
  }

  await pool.end();
}
check().catch(e => { console.error('CRASH:', e.message); pool.end(); });
