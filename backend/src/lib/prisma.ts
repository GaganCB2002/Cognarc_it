import { Pool } from "pg";
// Removed IPv4 forced resolution since Supabase deprecates IPv4 for direct connections

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace("?sslmode=require", ""),
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err: Error) => {
  console.error("[db] Unexpected pool error:", err.message);
});

export { pool };
