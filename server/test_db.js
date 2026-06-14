require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

pool.query('SELECT NOW()')
  .then(r => {
    console.log('DB CONNECTED OK:', r.rows[0].now);
    process.exit(0);
  })
  .catch(e => {
    console.error('DB ERROR:', e.message);
    process.exit(1);
  });
