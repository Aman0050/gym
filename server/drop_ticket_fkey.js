require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    await db.query(`ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_created_by_fkey;`);
    await db.query(`ALTER TABLE support_audit_logs DROP CONSTRAINT IF EXISTS support_audit_logs_user_id_fkey;`);
    console.log('Dropped support_tickets foreign key constraints');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
