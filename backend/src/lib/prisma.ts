import { Pool } from "pg";
import { promises as dns } from "dns";
import { URL } from "url";

let _pool: Pool | null = null;

async function resolveIPv4(hostname: string, timeoutMs = 5000): Promise<string | null> {
  const methods: Array<() => Promise<string | null>> = [
    async () => { const { address } = await dns.lookup(hostname, { family: 4 }); return address; },
    async () => { const addrs = await dns.resolve4(hostname); return addrs[0] || null; },
  ];
  for (const method of methods) {
    try {
      const result = await Promise.race([
        method(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("DNS timeout")), timeoutMs)),
      ]);
      if (result) return result;
    } catch {
      // try next method silently
    }
  }
  return null;
}

function makePool(host: string, port: number, db: string, user: string, pass: string, sslExtra: Record<string, any> = {}) {
  return new Pool({
    host,
    port,
    database: db,
    user,
    password: pass,
    ssl: { rejectUnauthorized: false, ...sslExtra },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  } as any);
}

function parseDbUrl(raw: string) {
  const u = new URL(raw.replace("?sslmode=require", ""));
  return {
    host: u.hostname,
    port: parseInt(u.port, 10) || 5432,
    db: u.pathname.slice(1),
    user: decodeURIComponent(u.username),
    pass: decodeURIComponent(u.password),
  };
}

export async function initPool(): Promise<Pool> {
  if (_pool) return _pool;

  const rawUrl = process.env.DATABASE_URL || "";
  const { host, port, db, user, pass } = parseDbUrl(rawUrl);

  // Strategy 1: Direct connection via IPv4 address
  const ipv4 = await resolveIPv4(host);
  if (ipv4) {
    console.log(`[db] Connecting via IPv4: ${ipv4}:${port}`);
    _pool = makePool(ipv4, port, db, user, pass);
    _pool.on("error", (e) => console.error("[db] Pool error:", e.message));
    return _pool;
  }

  // Strategy 2: Try Supabase connection pooler on port 6543
  // (same hostname, some Supabase infra gives port 6543 different routing)
  console.log(`[db] ${host} has no IPv4 (IPv6-only). Trying pooler port 6543...`);
  try {
    const testPool = makePool(host, 6543, db, user, pass);
    await testPool.query("SELECT 1");
    console.log("[db] Pooler on port 6543 works!");
    _pool = testPool;
    _pool.on("error", (e) => console.error("[db] Pool error:", e.message));
    return _pool;
  } catch (e) {
    console.warn(`[db] Pooler port 6543 failed: ${(e as Error).message}`);
  }

  // Strategy 3: Fallback to direct connection (works from IPv6-enabled hosts)
  console.warn("[db] Falling back to direct connection (requires IPv6)");
  _pool = makePool(host, port, db, user, pass);
  _pool.on("error", (e) => {
    console.error("[db] Pool error:", e.message);
    console.warn("[db] On Render: This is likely an IPv6 routing issue.");
    console.warn("[db] Fix: Switch DATABASE_URL to Render PostgreSQL or enable Supabase IPv4.");
  });
  return _pool;
}

export function getPool(): Pool {
  if (!_pool) throw new Error("Database pool not initialized. Call initPool() first.");
  return _pool;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_, prop: string | symbol) {
    if (!_pool) throw new Error("Database pool not initialized. Call initPool() first.");
    const val = Reflect.get(_pool!, prop, _pool!);
    return typeof val === "function" ? val.bind(_pool!) : val;
  },
});
