const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    // Check the current type constraint
    const constraintRes = await pool.query(`
      SELECT pg_get_constraintdef(c.oid) as def, c.conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'notifications' AND c.contype = 'c'
    `);
    console.log('Current constraints:');
    constraintRes.rows.forEach(r => console.log(' ', r.conname, ':', r.def));

    // Drop old restrictive type constraint and replace with permissive one
    for (const row of constraintRes.rows) {
      if (row.conname.includes('type')) {
        await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS "${row.conname}"`);
        console.log(`✅ Dropped constraint: ${row.conname}`);
      }
    }

    // Add new permissive constraint that matches notificationService NOTIFICATION_TYPES
    await pool.query(`
      ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
        CHECK (type IN (
          'EMAIL', 'WHATSAPP', 'IN_APP',
          'PAYMENT_SUCCESS', 'PLAN_EXPIRING', 'MEMBER_FROZEN',
          'ATTENDANCE_ALERT', 'STAFF_ACTIVITY', 'SYSTEM_WARNING', 'SYNC_FAILURE'
        ))
    `);
    console.log('✅ New type constraint applied');

    // Run smoke test
    const testGymId = await pool.query(`SELECT id FROM gyms LIMIT 1`);
    if (testGymId.rows.length > 0) {
      const ins = await pool.query(
        `INSERT INTO notifications (gym_id, type, title, message, priority, action_url)
         VALUES ($1, 'PAYMENT_SUCCESS', 'Schema Test', 'OK', 'NORMAL', '/payments')
         RETURNING id`,
        [testGymId.rows[0].id]
      );
      await pool.query('DELETE FROM notifications WHERE id = $1', [ins.rows[0].id]);
      console.log('✅ Notification smoke test: PASSED');
    }

    console.log('\n🎉 All fixes done. /api/payments/confirm/:id will work now.');
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
