const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.vaemnsuanlbtrjniwfda:Aman_qureshi_0@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function test() {
  const result = await pool.query("SELECT m.id, m.name, p.valid_until FROM members m JOIN payments p ON p.member_id = m.id");
  console.log('ALL PAYMENTS:', result.rows);
  
  const q2 = await pool.query("SELECT CURRENT_DATE - INTERVAL '30 days' as start, CURRENT_DATE + INTERVAL '7 days' as end");
  console.log('DATES:', q2.rows);
  
  process.exit();
}
test();
