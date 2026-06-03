require('dotenv').config();
const db = require('./config/db');

async function fixStats() {
  try {
    await db.query(`
      ALTER TABLE daily_stats 
      ADD COLUMN IF NOT EXISTS new_members INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS check_ins INTEGER DEFAULT 0;
    `);
    console.log('Fixed daily_stats table');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing daily_stats:', err);
    process.exit(1);
  }
}

fixStats();
