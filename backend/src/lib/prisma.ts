import { Pool } from "pg";
import { setDefaultResultOrder } from "dns";

// Force IPv4 DNS resolution for Render compatibility (Supabase IPv6 ENETUNREACH fix)
setDefaultResultOrder("ipv4first");

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
