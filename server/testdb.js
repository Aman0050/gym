const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.vaemnsuanlbtrjniwfda:Aman_qureshi_0@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function test() {
  const q3 = await pool.query(`SELECT p.gym_id, m.gym_id as m_gym_id FROM payments p JOIN members m ON p.member_id = m.id LIMIT 10`);
  console.log('GYM IDS:', q3.rows);
  
  process.exit();
}
test();
