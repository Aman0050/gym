const db = require('./config/db');

async function applyIndexes() {
  console.log('Applying pg_trgm extension and indices...');
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    console.log('pg_trgm extension verified.');

    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_members_name_trgm ON members USING gin(name gin_trgm_ops);',
      'CREATE INDEX IF NOT EXISTS idx_members_phone_trgm ON members USING gin(phone gin_trgm_ops);',
      'CREATE INDEX IF NOT EXISTS idx_gyms_name_trgm ON gym_accounts USING gin(gym_id gin_trgm_ops);',
      'CREATE INDEX IF NOT EXISTS idx_plans_name_trgm ON plans USING gin(name gin_trgm_ops);'
    ];

    for (const q of queries) {
      console.log(`Executing: ${q}`);
      await db.query(q);
    }
    
    console.log('Indexes applied successfully!');
  } catch (err) {
    console.error('Error applying indexes:', err);
  } finally {
    process.exit(0);
  }
}

applyIndexes();
