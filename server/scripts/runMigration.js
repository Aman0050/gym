const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a migration file path');
    process.exit(1);
  }

  try {
    const sql = fs.readFileSync(path.resolve(filePath), 'utf8');
    await pool.query(sql);
    console.log(`Migration ${path.basename(filePath)} executed successfully`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

runMigration();
