import { Pool } from "pg";
import { promises as dns } from "dns";
import { URL } from "url";

let _pool: Pool | null = null;

async function resolveHostnameToIPv4(hostname: string, timeoutMs = 5000): Promise<string | null> {
  // Try multiple DNS resolution methods
  const methods: Array<() => Promise<string | null>> = [
    async () => {
      const { address } = await dns.lookup(hostname, { family: 4 });
      return address;
    },
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
  return null;
}

function parseDbUrl(rawUrl: string) {
  return new URL(rawUrl.replace("?sslmode=require", ""));
}

function createPoolConfig(url: URL) {
  return {
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  } as any;
}

export async function initPool(): Promise<Pool> {
  if (_pool) return _pool;

  const rawUrl = process.env.DATABASE_URL || "";
  const url = parseDbUrl(rawUrl);

  // Step 1: Try to resolve hostname to IPv4 address
  const ipv4 = await resolveHostnameToIPv4(url.hostname);
  if (ipv4) {
    url.hostname = ipv4;
    _pool = new Pool(createPoolConfig(url));
  } else {
    // Step 2: If hostname is IPv6-only (like Supabase), try connection pooler on port 6543
    console.log(`[db] No IPv4 for ${url.hostname}, trying Supabase pooler on port 6543`);
    url.port = "6543";
    _pool = new Pool(createPoolConfig(url));
  }

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
