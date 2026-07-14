import { Pool } from "pg";
import { promises as dns } from "dns";
import { URL } from "url";

let _pool: Pool | null = null;

const SUPABASE_POOLER_REGIONS = [
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
];

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
    } catch (err) {
      console.warn(`[db] DNS failed for ${hostname}: ${(err as Error).message}`);
    }
  }
  return null;
}

function poolConfig(host: string, port: number, db: string, user: string, pass: string, sslExtra: Record<string, any> = {}) {
  return {
    host,
    port,
    database: db,
    user,
    password: pass,
    ssl: { rejectUnauthorized: false, ...sslExtra },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  } as any;
}

async function tryConnect(name: string, pool: Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    console.log(`[db] ${name} connected successfully`);
    return true;
  } catch (e) {
    console.warn(`[db] ${name} failed: ${(e as Error).message}`);
    await pool.end().catch(() => {});
    return false;
  }
}

export async function initPool(): Promise<Pool> {
  if (_pool) return _pool;

  const rawUrl = process.env.DATABASE_URL || "";
  const dbUrl = new URL(rawUrl.replace("?sslmode=require", ""));
  const origHost = dbUrl.hostname;
  const origPort = parseInt(dbUrl.port, 10) || 5432;
  const database = dbUrl.pathname.slice(1);
  const user = decodeURIComponent(dbUrl.username);
  const password = decodeURIComponent(dbUrl.password);

  const ipv4 = await resolveIPv4(origHost);
  if (ipv4) {
    _pool = new Pool(poolConfig(ipv4, origPort, database, user, password));
    console.log(`[db] Direct IPv4: ${ipv4}:${origPort}`);
    _pool.on("error", (err: Error) => console.error("[db] Pool error:", err.message));
    return _pool;
  }

  console.log(`[db] ${origHost} has no IPv4, trying Supabase pooler strategies in parallel`);

  const poolerAttempts = await Promise.allSettled(
    SUPABASE_POOLER_REGIONS.map(async (region) => {
      const poolerHost = `aws-0-${region}.pooler.supabase.com`;
      const poolerIp = await resolveIPv4(poolerHost, 3000);
      if (!poolerIp) throw new Error(`No IPv4 for ${poolerHost}`);
      const p = new Pool(poolConfig(poolerIp, 6543, database, user, password, { servername: origHost }));
      await p.query("SELECT 1");
      return { region, pool: p };
    })
  );

  const succeeded = poolerAttempts.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ region: string; pool: Pool }> | undefined;
  if (succeeded) {
    const { region, pool: p } = succeeded.value;
    console.log(`[db] Connected via Supabase pooler ${region}`);
    _pool = p;
    poolerAttempts.forEach((r) => {
      if (r.status === "fulfilled" && r.value.region !== region) {
        r.value.pool.end().catch(() => {});
      }
    });
  } else {
    poolerAttempts.forEach((r) => {
      if (r.status === "fulfilled") r.value.pool.end().catch(() => {});
    });
    console.warn("[db] All pooler strategies failed, falling back to direct connection");
    _pool = new Pool(poolConfig(origHost, origPort, database, user, password));
  }

  _pool.on("error", (err: Error) => console.error("[db] Pool error:", err.message));
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
