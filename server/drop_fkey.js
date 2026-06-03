require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    await db.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_admin_id_fkey;`);
    console.log('Dropped foreign key constraint');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
