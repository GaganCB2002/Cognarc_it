import { Request, Response } from "express";
import { prisma } from "../server";
import { getAggregatedStats } from "../services/analytics.service";

// POST /api/telemetry/browser
export const logBrowserEvent = async (req: Request, res: Response) => {
  try {
    const { url, title, domain, duration, category } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const event = await prisma.browserTelemetry.create({
      data: { userId, url, title, domain, duration, category },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Browser telemetry error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// POST /api/telemetry/desktop
export const logDesktopEvent = async (req: Request, res: Response) => {
  try {
    const { activeApp, windowTitle, processName, duration, isIdle, category } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const event = await prisma.desktopTelemetry.create({
      data: { userId, activeApp, windowTitle, processName, duration, isIdle, category },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Desktop telemetry error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// GET /api/telemetry/stats
export const getTelemetryStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const stats = await getAggregatedStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
