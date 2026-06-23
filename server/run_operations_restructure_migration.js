const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    console.log('Reading restructure migration file...');
    const sql = fs.readFileSync('./migrations/20260621_operations_hub_restructure.sql', 'utf8');
    
    const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
    
    console.log(`Executing ${queries.length} queries...`);
    for (let q of queries) {
      console.log('Running:', q.substring(0, 50) + '...');
      await pool.query(q);
    }
    
    console.log('Operations Hub Restructure migration applied successfully!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
