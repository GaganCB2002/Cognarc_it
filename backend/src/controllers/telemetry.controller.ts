import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { io } from "../server";
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

    const activeSession = await prisma.trackingSession.findFirst({
      where: { id: trackingSessionId, userId, status: "ACTIVE" }
    });

    if (!activeSession) {
      res.status(403).json({ success: false, message: "Tracking disabled: Session is not active." });
      return;
    }

    const event = await prisma.browserTelemetry.create({
      data: { 
        userId, 
        url, 
        title, 
        domain, 
        duration, 
        category,
        trackingSessionId: activeSession.id 
      },
    });

    try {
      io.to(`user_${userId}`).emit('live-tracking-update', { type: 'BROWSER', data: event });
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

    const activeSession = await prisma.trackingSession.findFirst({
      where: { id: trackingSessionId, userId, status: "ACTIVE" }
    });

    if (!activeSession) {
      res.status(403).json({ success: false, message: "Tracking disabled: Session is not active." });
      return;
    }

    const event = await prisma.desktopTelemetry.create({
      data: { 
        userId, 
        activeApp, 
        windowTitle, 
        processName, 
        duration, 
        isIdle, 
        category,
        trackingSessionId: activeSession.id
      },
    });

    try {
      io.to(`user_${userId}`).emit('live-tracking-update', { type: 'DESKTOP', data: event });
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
