import { Pool } from "pg";
import { promises as dns } from "dns";

let _pool: Pool | null = null;

async function resolveHostnameToIPv4(hostname: string, timeoutMs = 5000): Promise<string | null> {
  // Try multiple DNS resolution methods — Render may restrict some
  const methods: Array<() => Promise<string | null>> = [
    // Method 1: dns.lookup — uses OS getaddrinfo (most reliable)
    async () => {
      const { address } = await dns.lookup(hostname, { family: 4 });
      return address;
    },
    // Method 2: dns.resolve4 — uses network DNS servers
    async () => {
      const addresses = await dns.resolve4(hostname);
      return addresses[0] || null;
    },
  ];

  for (const method of methods) {
    try {
      const result = await Promise.race([
        method(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("DNS resolution timed out")), timeoutMs)
        ),
      ]);
      if (result) {
        console.log(`[db] Resolved ${hostname} -> ${result}`);
        return result;
      }
    } catch (err) {
      console.warn(`[db] DNS method failed for ${hostname}: ${(err as Error).message}`);
    }
  }

  // Last resort: try to connect with family: 4 directly (pg will do dns.lookup internally)
  console.warn(`[db] All DNS resolution methods failed for ${hostname}, using family:4 fallback`);
  return null;
}

export async function initPool(): Promise<Pool> {
  if (_pool) return _pool;

  const rawUrl = process.env.DATABASE_URL || "";
  const url = new URL(rawUrl.replace("?sslmode=require", ""));

  const ipv4 = await resolveHostnameToIPv4(url.hostname);
  if (ipv4) {
    url.hostname = ipv4;
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
