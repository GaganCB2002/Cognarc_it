import { pool } from "../lib/prisma";

export interface StartSessionInput {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  projectName?: string;
}

export interface LogActivityInput {
  trackingSessionId: string;
  userId: string;
  eventType: string;
  category?: string;
  module?: string;
  entityId?: string;
  entityType?: string;
  label?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export const startTrackingSession = async (input: StartSessionInput) => {
  await pool.query(
    `UPDATE "TrackingSession" SET status = 'COMPLETED', "endTime" = $2, "lastActivity" = $2 WHERE "userId" = $1 AND status IN ('ACTIVE', 'PAUSED')`,
    [input.userId, new Date()]
  );

  const { rows } = await pool.query(
    `INSERT INTO "TrackingSession" ("userId", "deviceId", "deviceName", "projectName", status, "startTime", "lastActivity") VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $5) RETURNING *`,
    [input.userId, input.deviceId || null, input.deviceName || null, input.projectName || null, new Date()]
  );
  return rows[0];
};

export const pauseTrackingSession = async (sessionId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE id = $1 AND "userId" = $2 AND status = 'ACTIVE' LIMIT 1`,
    [sessionId, userId]
  );
  if (rows.length === 0) throw new Error("Active session not found");
  const { rows: updated } = await pool.query(
    `UPDATE "TrackingSession" SET status = 'PAUSED', "pausedAt" = $2 WHERE id = $1 RETURNING *`,
    [sessionId, new Date()]
  );
  return updated[0];
};

export const resumeTrackingSession = async (sessionId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE id = $1 AND "userId" = $2 AND status = 'PAUSED' LIMIT 1`,
    [sessionId, userId]
  );
  if (rows.length === 0 || !rows[0].pausedAt) throw new Error("Paused session not found");
  const pauseDuration = Date.now() - new Date(rows[0].pausedAt).getTime();
  const { rows: updated } = await pool.query(
    `UPDATE "TrackingSession" SET status = 'ACTIVE', "pausedAt" = NULL, "totalPauseMs" = "totalPauseMs" + $2, "lastActivity" = $3 WHERE id = $1 RETURNING *`,
    [sessionId, pauseDuration, new Date()]
  );
  return updated[0];
};

export const stopTrackingSession = async (sessionId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [sessionId, userId]
  );
  if (rows.length === 0) throw new Error("Session not found");
  if (rows[0].status === "COMPLETED") return rows[0];
  const endTime = new Date();
  const { rows: updated } = await pool.query(
    `UPDATE "TrackingSession" SET status = 'COMPLETED', "endTime" = $2, "lastActivity" = $2 WHERE id = $1 RETURNING *`,
    [sessionId, endTime]
  );
  return updated[0];
};

const VALID_CATEGORIES = ["LEARNING", "CODING", "READING", "VIDEO", "QUIZ", "TASK", "NOTE", "AI_ASSISTANT", "DOCUMENT", "RESOURCE", "CALENDAR", "MEETING", "BREAK", "IDLE", "OTHER"];

export function validateCategory(cat: string | undefined): string {
  if (!cat) return "OTHER";
  const upper = cat.toUpperCase();
  return VALID_CATEGORIES.includes(upper) ? upper : "OTHER";
}

export const logActivityEvent = async (input: LogActivityInput) => {
  const { rows } = await pool.query(
    `INSERT INTO "ActivityEvent" ("trackingSessionId", "userId", "eventType", category, module, "entityId", "entityType", label, duration, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      input.trackingSessionId,
      input.userId,
      input.eventType,
      validateCategory(input.category),
      input.module || null,
      input.entityId || null,
      input.entityType || null,
      input.label || null,
      Math.max(0, input.duration || 0),
      input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
    ]
  );
  return rows[0];
};

export const getActiveSession = async (userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE "userId" = $1 AND status IN ('ACTIVE', 'PAUSED') ORDER BY "startTime" DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

export const getSessionHistory = async (
  userId: string,
  options: { limit?: number; offset?: number; from?: Date; to?: Date } = {}
) => {
  const params: any[] = [userId];
  let dateClause = "";
  if (options.from || options.to) {
    const clauses: string[] = [];
    if (options.from) { clauses.push(`"startTime" >= $${params.length + 1}`); params.push(options.from); }
    if (options.to) { clauses.push(`"startTime" <= $${params.length + 1}`); params.push(options.to); }
    dateClause = " AND " + clauses.join(" AND ");
  }
  const limit = Math.min(Math.max(1, options.limit || 50), 200);
  const offset = Math.max(0, options.offset || 0);

  const { rows: sessions } = await pool.query(
    `SELECT ts.*, (SELECT COUNT(*) FROM "ActivityEvent" ae WHERE ae."trackingSessionId" = ts.id) as activity_count FROM "TrackingSession" ts WHERE "userId" = $1${dateClause} ORDER BY "startTime" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM "TrackingSession" WHERE "userId" = $1${dateClause}`,
    params
  );

  return { sessions, total: parseInt(count, 10) };
};

export const getSessionActivities = async (
  sessionId: string,
  userId: string,
  options: { category?: string; limit?: number } = {}
) => {
  const params: any[] = [sessionId, userId];
  let categoryClause = "";
  if (options.category) {
    categoryClause = ` AND category = $3`;
    params.push(options.category);
  }
  const { rows } = await pool.query(
    `SELECT * FROM "ActivityEvent" WHERE "trackingSessionId" = $1 AND "userId" = $2${categoryClause} ORDER BY "createdAt" DESC LIMIT ${Math.min(Math.max(1, options.limit || 500), 1000)}`,
    params
  );
  return rows;
};

export const getAggregatedSessionStats = async (sessionId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [sessionId, userId]
  );
  if (rows.length === 0) throw new Error("Session not found");
  const session = rows[0];

  const [activitiesRes, browserRes, desktopRes] = await Promise.all([
    pool.query(`SELECT * FROM "ActivityEvent" WHERE "trackingSessionId" = $1 AND "userId" = $2`, [sessionId, userId]),
    pool.query(`SELECT * FROM "BrowserTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2`, [sessionId, userId]),
    pool.query(`SELECT * FROM "DesktopTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2`, [sessionId, userId]),
  ]);
  const activities = activitiesRes.rows;
  const browserTelemetries = browserRes.rows;
  const desktopTelemetries = desktopRes.rows;

  const totalDuration = session.endTime
    ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime() - session.totalPauseMs) / 1000
    : (Date.now() - new Date(session.startTime).getTime() - session.totalPauseMs) / 1000;

  const byCategory: Record<string, number> = {};
  let totalEventDuration = 0;

  for (const a of activities) {
    byCategory[a.category] = (byCategory[a.category] || 0) + a.duration;
    totalEventDuration += a.duration;
  }

  let autoLearningDuration = 0;
  for (const b of browserTelemetries) {
    const cat = b.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + b.duration;
    totalEventDuration += b.duration;
    if (cat === "Programming" || cat === "Documentation" || cat === "AI Tools") {
      autoLearningDuration += b.duration;
    }
  }

  let autoCodingDuration = 0;
  let autoCommDuration = 0;
  for (const d of desktopTelemetries) {
    const cat = d.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + d.duration;
    totalEventDuration += d.duration;
    if (cat === "IDE" || cat === "Terminal") {
      autoCodingDuration += d.duration;
    } else if (cat === "Communication") {
      autoCommDuration += d.duration;
    }
  }

  const idleEstimate = Math.max(0, totalDuration - totalEventDuration);
  const learningTime = (byCategory["LEARNING"] || 0) + (byCategory["READING"] || 0) + autoLearningDuration;
  const codingTime = (byCategory["CODING"] || 0) + autoCodingDuration;
  const taskTime = byCategory["TASK"] || 0;
  const aiTime = (byCategory["AI_ASSISTANT"] || 0) + (byCategory["AI Tools"] || 0);
  const productiveTime = learningTime + codingTime + taskTime;

  const productivityScore = totalDuration > 0 ? Math.round((productiveTime / totalDuration) * 100) : 0;
  const distractionDuration = byCategory["Social Media"] || 0;
  const focusScore = Math.max(0, Math.min(100, 100 - Math.round(((idleEstimate + distractionDuration) / Math.max(totalDuration, 1)) * 100)));

  return {
    sessionId,
    totalDurationSeconds: Math.round(totalDuration),
    totalPauseMs: session.totalPauseMs,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    byCategory,
    learningTime: Math.round(learningTime),
    codingTime: Math.round(codingTime),
    taskTime: Math.round(taskTime),
    aiTime: Math.round(aiTime),
    idleTime: Math.round(idleEstimate),
    meetingTime: Math.round(autoCommDuration),
    productiveTime: Math.round(productiveTime),
    productivityScore: Math.min(100, productivityScore),
    focusScore,
    eventCount: activities.length + browserTelemetries.length + desktopTelemetries.length,
  };
};
