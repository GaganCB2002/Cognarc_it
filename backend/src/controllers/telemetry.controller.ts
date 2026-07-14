import { Request, Response } from "express";
import { pool } from "../lib/prisma";
import { getIO } from "../lib/socket";
import { getAggregatedStats } from "../services/analytics.service";

// POST /api/telemetry/browser
export const logBrowserEvent = async (req: Request, res: Response) => {
  try {
    const { url, title, domain, duration, category, trackingSessionId } = req.body;
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!trackingSessionId) {
      res.status(403).json({ success: false, message: "Tracking disabled: No active session provided." });
      return;
    }

    const activeSessionResult = await pool.query(
      'SELECT * FROM "TrackingSession" WHERE "id" = $1 AND "userId" = $2 AND "status" = $3 LIMIT 1',
      [trackingSessionId, userId, "ACTIVE"]
    );
    const activeSession = activeSessionResult.rows[0];

    if (!activeSession) {
      res.status(403).json({ success: false, message: "Tracking disabled: Session is not active." });
      return;
    }

    const result = await pool.query(
      'INSERT INTO "BrowserTelemetry" ("userId", "url", "title", "domain", "duration", "category", "trackingSessionId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, url, title, domain, duration, category, activeSession.id]
    );
    const event = result.rows[0];

    try {
      getIO().to(`user_${userId}`).emit('live-tracking-update', { type: 'BROWSER', data: event });
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Browser telemetry error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/telemetry/desktop
export const logDesktopEvent = async (req: Request, res: Response) => {
  try {
    const { activeApp, windowTitle, processName, duration, isIdle, category, trackingSessionId } = req.body;
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!trackingSessionId) {
      res.status(403).json({ success: false, message: "Tracking disabled: No active session provided." });
      return;
    }

    const activeSessionResult = await pool.query(
      'SELECT * FROM "TrackingSession" WHERE "id" = $1 AND "userId" = $2 AND "status" = $3 LIMIT 1',
      [trackingSessionId, userId, "ACTIVE"]
    );
    const activeSession = activeSessionResult.rows[0];

    if (!activeSession) {
      res.status(403).json({ success: false, message: "Tracking disabled: Session is not active." });
      return;
    }

    const result = await pool.query(
      'INSERT INTO "DesktopTelemetry" ("userId", "activeApp", "windowTitle", "processName", "duration", "isIdle", "category", "trackingSessionId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, activeApp, windowTitle, processName, duration, isIdle, category, activeSession.id]
    );
    const event = result.rows[0];

    try {
      getIO().to(`user_${userId}`).emit('live-tracking-update', { type: 'DESKTOP', data: event });
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Desktop telemetry error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/telemetry/stats
export const getTelemetryStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const stats = await getAggregatedStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
