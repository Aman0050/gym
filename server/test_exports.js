require('dotenv').config();
const db = require('./config/db');

async function test() {
  try {
    console.log('\n--- Testing Payments Export Query (FIXED) ---');
    const payments = await db.query(`
      SELECT p.id, p.amount, p.payment_status, p.payment_mode, p.payment_date,
             m.name as member_name, pl.name as plan_name, g.name as gym_name
      FROM payments p
      JOIN members m ON p.member_id = m.id
      JOIN plans pl ON p.plan_id = pl.id
      JOIN gyms g ON p.gym_id = g.id
      ORDER BY p.payment_date DESC LIMIT 5
    `);
    console.log('✅ Payments OK, rows:', payments.rows.length);
  } catch (e) {
    console.error('❌ Payments FAILED:', e.message);
  }

  try {
    console.log('\n--- Testing Subscriptions Export Query (FIXED) ---');
    const subs = await db.query(`
      SELECT name, duration_days, price, gym_id FROM plans ORDER BY price DESC LIMIT 5
    `);
    console.log('✅ Subscriptions OK, rows:', subs.rows.length, '| Sample:', subs.rows[0]);
  } catch (e) {
    console.error('❌ Subscriptions FAILED:', e.message);
  }

  try {
    console.log('\n--- Testing Members Export Query ---');
    const members = await db.query(`SELECT * FROM members LIMIT 3`);
    console.log('✅ Members OK, count:', members.rows.length);
  } catch (e) {
    console.error('❌ Members FAILED:', e.message);
  }

  try {
    console.log('\n--- Testing Attendance Export Query ---');
    const att = await db.query(`
      SELECT a.check_in_time, m.name as member_name, m.phone as member_phone, g.name as gym_name
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      JOIN gyms g ON a.gym_id = g.id
      ORDER BY a.check_in_time DESC LIMIT 5
    `);
    console.log('✅ Attendance OK, rows:', att.rows.length);
  } catch (e) {
    console.error('❌ Attendance FAILED:', e.message);
  }

  process.exit(0);
}

test();
