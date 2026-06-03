const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({path: './.env'});

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const q1 = fs.readFileSync('./migrations/20260603_search_optimization.sql', 'utf8');
    await pool.query(q1);
    console.log("Search optimization migration applied!");

    // For CONCURRENTLY, run queries individually
    const q2 = fs.readFileSync('./migrations/20260603_db_performance_indices.sql', 'utf8');
    const queries = q2.split(';').filter(q => q.trim().length > 0);
    for (let q of queries) {
      if (q.trim()) {
        console.log('Running:', q.trim());
        await pool.query(q);
      }
    }
    console.log("Performance indices migration applied!");
  } catch(e) {
    console.error("Migration error:", e);
  } finally {
    process.exit(0);
  }
}
run();
