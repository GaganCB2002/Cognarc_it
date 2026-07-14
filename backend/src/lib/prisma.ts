import { Pool } from "pg";

// Parse DATABASE_URL to get individual params, then use family: 4 explicitly
// This fixes ENETUNREACH on Render (Supabase IPv6 addresses)
const rawUrl = process.env.DATABASE_URL || "";
const url = new URL(rawUrl.replace("?sslmode=require", ""));

const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port, 10) || 5432,
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  family: 4,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
} as any);

pool.on("error", (err: Error) => {
  console.error("[db] Unexpected pool error:", err.message);
});

export { pool };
