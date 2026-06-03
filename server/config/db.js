const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  ssl: {
    rejectUnauthorized: false
  }
});

// Production Error Handling for Pool
pool.on('error', (err) => {
  console.error('CRITICAL: Unexpected error on idle database client', err);
});

pool.connect()
  .then(() => console.log('Connected to Enterprise Database (Supabase)'))
  .catch(err => console.error('Database connection error', err.stack));

module.exports = {
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (
        err.message && (
          err.message.includes('timeout') ||
          err.message.includes('connection') ||
          err.message.includes('Pool') ||
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT'
        )
      ) {
        const dbErr = new Error('Database service temporarily unavailable due to connection timeout or pool starvation.');
        dbErr.statusCode = 503;
        dbErr.isOperational = true;
        throw dbErr;
      }
      throw err;
    }
  },
  pool
};
