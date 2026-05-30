require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Drop FK constraint on refresh_tokens.user_id so gym_accounts can also use it
const sql = `
  ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
  ALTER TABLE refresh_tokens ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
`;

pool.query(sql)
  .then(() => { console.log('Migration SUCCESS: refresh_tokens FK constraint removed'); process.exit(0); })
  .catch(e => { console.error('Migration FAILED:', e.message); process.exit(1); });
