const bcrypt = require('bcrypt');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.vaemnsuanlbtrjniwfda:Aman_qureshi_0@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    const hash = await bcrypt.hash('password', 10);
    
    // Check if exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', ['superadmin@gymsaas.com']);
    
    if (existing.rows.length > 0) {
      console.log('Superadmin already exists!');
      await client.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, 'SUPER_ADMIN', 'superadmin@gymsaas.com']);
      console.log('Updated existing superadmin.');
    } else {
      await client.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', ['superadmin@gymsaas.com', hash, 'SUPER_ADMIN']);
      console.log('Superadmin created!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
