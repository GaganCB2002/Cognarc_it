import { Pool } from "pg";
import { setDefaultResultOrder } from "dns";

// Prefer IPv4 when resolving hostnames (fixes ENETUNREACH on Render)
setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

export { pool };
