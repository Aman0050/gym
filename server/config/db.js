const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // High-performance pool size for enterprise concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
});

// Production Error Handling for Pool
pool.on('error', (err) => {
  console.error('CRITICAL: Unexpected error on idle database client', err);
  // Do not exit process, let pooling recover
});

pool.connect()
  .then(() => console.log('Connected to Enterprise Database (Supabase)'))
  .catch(err => console.error('Database connection error', err.stack));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Export raw pool for advanced transaction management
};
