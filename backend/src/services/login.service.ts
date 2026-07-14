import { randomBytes, createHash } from "crypto";
import { pool } from "../lib/prisma";

export function generateLoginHash(userId: string): string {
  const raw = `${userId}:${Date.now()}:${randomBytes(16).toString("hex")}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function recordLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ loginHash: string; loginCount: number }> {
  const loginHash = generateLoginHash(userId);

  // Upsert user login stats
  await pool.query(
    `INSERT INTO "UserLoginStats" ("userId", "totalLogins", "lastLoginAt", "lastIpAddress") VALUES ($1, 1, now(), $2)
     ON CONFLICT ("userId") DO UPDATE SET "totalLogins" = "UserLoginStats"."totalLogins" + 1, "lastLoginAt" = now(), "lastIpAddress" = $2, "updatedAt" = now()`,
    [userId, ipAddress || null]
  );

  // Get updated count
  const { rows } = await pool.query(
    `SELECT "totalLogins" FROM "UserLoginStats" WHERE "userId" = $1 LIMIT 1`,
    [userId]
  );
  const loginCount = rows.length > 0 ? rows[0].totalLogins : 1;

  // Create login log entry
  await pool.query(
    `INSERT INTO "UserLogin" ("userId", "loginHash", "loginCount", "ipAddress", "userAgent") VALUES ($1, $2, $3, $4, $5)`,
    [userId, loginHash, loginCount, ipAddress || null, userAgent || null]
  );

  return { loginHash, loginCount };
}

export async function getLoginStats(userId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM "UserLoginStats" WHERE "userId" = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getLoginHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  const { rows } = await pool.query(
    `SELECT * FROM "UserLogin" WHERE "userId" = $1 ORDER BY "loggedInAt" DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM "UserLogin" WHERE "userId" = $1`,
    [userId]
  );
  return { logins: rows, total: parseInt(countRows[0].count, 10) };
}
