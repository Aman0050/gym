const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '../migrations/20260603_backup_logs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running migration...');
    await db.query(sql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigration();
