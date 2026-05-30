require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const sql = `
  CREATE TABLE IF NOT EXISTS gym_accounts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    gym_id        VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_accounts_gym_id ON gym_accounts(gym_id);
`;

pool.query(sql)
  .then(() => { console.log('Migration SUCCESS: gym_accounts table created'); process.exit(0); })
  .catch(e => { console.error('Migration FAILED:', e.message); process.exit(1); });
