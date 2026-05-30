const { Pool } = require('pg');
require('dotenv').config({path: './.env'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query(`
      UPDATE notifications 
      SET action_url = '/super-admin/support/tickets/' || st.id 
      FROM support_tickets st 
      WHERE notifications.type = 'IN_APP' 
      AND notifications.action_url IS NULL 
      AND notifications.title = 'New Support Ticket: ' || st.title
    `);
    console.log('Updated rows:', res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
