require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function t() {
  // Get all tables
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(r => r.table_name));
  
  // Check each Prisma model column
  for (const row of tables.rows) {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [row.table_name]);
    console.log(`\n${row.table_name}:`, cols.rows.map(r => r.column_name).join(', '));
  }
  await pool.end();
}
t().catch(e => console.error(e.message));
