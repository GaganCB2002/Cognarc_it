require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function t() {
  await pool.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT FALSE');
  console.log('Added isApproved column');
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'User'");
  console.log('User columns:', res.rows.map(r => r.column_name));
  await pool.end();
}
t().catch(e => console.error(e.message));
