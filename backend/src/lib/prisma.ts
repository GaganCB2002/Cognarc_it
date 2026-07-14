import { Pool } from "pg";
import { resolve4 } from "dns/promises";

let _pool: Pool | null = null;

/**
 * Initialize the database pool with IPv4-forced connection.
 * Must be called once at server startup before any route handlers run.
 *
 * Resolves the DATABASE_URL hostname to an IPv4 address and uses it directly,
 * bypassing IPv6 entirely to avoid ENETUNREACH on Render.
 */
export async function initPool(): Promise<Pool> {
  if (_pool) return _pool;

  const rawUrl = process.env.DATABASE_URL || "";
  const url = new URL(rawUrl.replace("?sslmode=require", ""));

  // Resolve hostname to IPv4 — the critical fix for Render ENETUNREACH
  try {
    const addresses = await resolve4(url.hostname);
    if (addresses.length > 0) {
      console.log(`[db] Resolved ${url.hostname} -> ${addresses[0]}`);
      url.hostname = addresses[0];
    }
  } catch (err) {
    console.warn(`[db] IPv4 resolution failed for ${url.hostname}, falling back to hostname`);
  }

  _pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
    family: 4,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  } as any);

  _pool.on("error", (err: Error) => {
    console.error("[db] Unexpected pool error:", err.message, err.stack);
  });

  return _pool;
}

/**
 * Get the initialized pool. Throws if initPool() has not been called.
 */
export function getPool(): Pool {
  if (!_pool) throw new Error("Database pool not initialized. Call initPool() first.");
  return _pool;
}

/**
 * Backward-compatible `pool` export for all existing imports.
 * Uses a Proxy to live-bind methods to the underlying _pool instance,
 * so 23 files importing `pool` work without changes after initPool().
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_, prop: string | symbol) {
    if (!_pool) throw new Error("Database pool not initialized. Call initPool() first.");
    const val = Reflect.get(_pool!, prop, _pool!);
    return typeof val === "function" ? val.bind(_pool!) : val;
  },
});
