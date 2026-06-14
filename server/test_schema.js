require('dotenv').config();
const db = require('./config/db');

async function inspect() {
  const tables = ['payments', 'plans'];
  for (const table of tables) {
    try {
      const r = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
      console.log(`\n${table} columns:`, r.rows.map(x => x.column_name));
    } catch (e) {
      console.error(`${table} ERROR:`, e.message);
    }
  }
  process.exit(0);
}
inspect();
