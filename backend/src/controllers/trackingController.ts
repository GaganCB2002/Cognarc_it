import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateSessionReport } from '../services/report.service';
import { generateSessionPdfReport } from '../services/pdfReport.service';
import fs from 'fs';
import path from 'path';
import {
  startTrackingSession,
  pauseTrackingSession,
  resumeTrackingSession,
  stopTrackingSession,
  logActivityEvent,
  getActiveSession,
  getSessionHistory,
  getSessionActivities,
  getAggregatedSessionStats,
} from '../services/tracking.service';

export async function startSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const existing = await getActiveSession(userId);
    if (existing) {
      res.status(409).json({ message: 'An active session already exists. Stop it first.', session: existing });
      return;
    }

    const { deviceId, deviceName, projectName } = req.body;
    const session = await startTrackingSession({ userId, deviceId, deviceName, projectName });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    console.error('startSession error:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function pauseSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const session = await pauseTrackingSession(sessionId, userId);
    res.json({ success: true, data: session });
  } catch (error: any) {
    console.error('pauseSession error:', error);
    if (error.message === 'Active session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message });
  }
}

export async function resumeSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const session = await resumeTrackingSession(sessionId, userId);
    res.json({ success: true, data: session });
  } catch (error: any) {
    console.error('resumeSession error:', error);
    if (error.message === 'Paused session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message });
  }
}

export async function stopSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const session = await stopTrackingSession(sessionId, userId);

    let report = null;
    try {
      report = await generateSessionReport(sessionId, userId);
      
      // Auto-generate and cache PDF file in uploads
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const pdfPath = path.join(uploadsDir, `report-${sessionId}.pdf`);
      await generateSessionPdfReport(sessionId, userId, { outputPath: pdfPath });
    } catch (reportError) {
      console.error('Report generation failed:', reportError);
    }

    res.json({ success: true, data: { session, report } });
  } catch (error: any) {
    console.error('stopSession error:', error);
    if (error.message === 'Session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message });
  }
}

export async function downloadSessionPdf(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const pdfPath = path.join(__dirname, '..', '..', 'uploads', `report-${sessionId}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      try {
        const buffer = await generateSessionPdfReport(sessionId, userId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="session-report-${sessionId}.pdf"`);
        res.send(buffer);
        return;
      } catch (err) {
        res.status(404).json({ success: false, message: 'Report PDF could not be generated' });
        return;
      }
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="session-report-${sessionId}.pdf"`);
    const pdfStream = fs.createReadStream(pdfPath);
    pdfStream.on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming PDF' });
    });
    pdfStream.pipe(res);
  } catch (error) {
    console.error('downloadSessionPdf error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function logActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    const { eventType, category, module, entityId, entityType, label, duration, metadata } = req.body;
    if (!sessionId || !eventType) {
      res.status(400).json({ message: 'sessionId and eventType are required' });
      return;
    }

    const event = await logActivityEvent({
      trackingSessionId: sessionId,
      userId,
      eventType,
      category,
      module,
      entityId,
      entityType,
      label,
      duration,
      metadata,
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('logActivity error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function batchLogActivities(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ message: 'events array is required' });
      return;
    }

    // Validate session ownership for all events
    const sessionIds = [...new Set(events.map((e: any) => e.trackingSessionId).filter((id: any) => typeof id === 'string' && id.trim() !== ''))];
    if (sessionIds.length === 0) {
      res.status(400).json({ message: 'No valid trackingSessionId found in events' });
      return;
    }
    const validSessions = await prisma.trackingSession.findMany({
      where: { id: { in: sessionIds }, userId },
      select: { id: true },
    });
    const validSessionIds = new Set(validSessions.map((s: any) => s.id));
    const invalid = sessionIds.find((sid: string) => !validSessionIds.has(sid));
    if (invalid) {
      res.status(403).json({ message: `Session ${invalid} not found or does not belong to user` });
      return;
    }

    const created = await prisma.$transaction(
      events.map((ev: any) =>
        prisma.activityEvent.create({
          data: {
            trackingSessionId: ev.trackingSessionId,
            userId,
            eventType: ev.eventType,
            category: (ev.category as any) || 'OTHER',
            module: ev.module || null,
            entityId: ev.entityId || null,
            entityType: ev.entityType || null,
            label: ev.label || null,
            duration: ev.duration || 0,
            metadata: ev.metadata ? JSON.parse(JSON.stringify(ev.metadata)) : null,
          },
        })
      )
    );

    res.status(201).json({ success: true, data: created, count: created.length });
  } catch (error) {
    console.error('batchLogActivities error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCurrentSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const session = await getActiveSession(userId);
    res.json({ success: true, data: session });
  } catch (error) {
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    console.error('getCurrentSession error:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const result = await getSessionHistory(userId, { limit, offset, from, to });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('getSessions error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const session = await prisma.trackingSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) { res.status(404).json({ message: 'Session not found' }); return; }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('getSessionById error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessionStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const stats = await getAggregatedSessionStats(sessionId, userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('getSessionStats error:', error);
    if (error.message === 'Session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message });
  }
}

export async function getSessionActivitiesHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const category = req.query.category as string;
    const activities = await getSessionActivities(sessionId, userId, { category });
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('getSessionActivities error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getLiveTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const activeSession = await prisma.trackingSession.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { startTime: "desc" },
    });

    if (!activeSession) {
      res.json({ success: true, data: null });
      return;
    }

    const sessionId = activeSession.id;

    const [latestBrowser, latestDesktop] = await Promise.all([
      prisma.browserTelemetry.findFirst({
        where: { trackingSessionId: sessionId, userId },
        orderBy: { timestamp: "desc" },
      }),
      prisma.desktopTelemetry.findFirst({
        where: { trackingSessionId: sessionId, userId },
        orderBy: { timestamp: "desc" },
      }),
    ]);

    // Add estimated running seconds for the current live item
    const now = Date.now();
    const liveTab = latestBrowser
      ? {
          ...latestBrowser,
          liveDuration: Math.floor((now - latestBrowser.timestamp.getTime()) / 1000) + latestBrowser.duration,
        }
      : null;

    const liveApp = latestDesktop
      ? {
          ...latestDesktop,
          liveDuration: Math.floor((now - latestDesktop.timestamp.getTime()) / 1000) + latestDesktop.duration,
        }
      : null;

    res.json({
      success: true,
      data: {
        session: activeSession,
        liveTab,
        liveApp,
      },
    });
  } catch (error) {
    console.error('getLiveTelemetry error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const activeSession = await getActiveSession(userId);
    
    if (!activeSession) {
      res.json({ success: true, data: null });
      return;
    }

    const sessionId = activeSession.id;

    // 1. Get session stats
    const stats = await getAggregatedSessionStats(sessionId, userId);

    // 2. Get top desktop apps for this session
    const desktopApps = await prisma.desktopTelemetry.groupBy({
      by: ['processName', 'category'],
      where: { trackingSessionId: sessionId, userId },
      _sum: { duration: true },
      orderBy: { _sum: { duration: 'desc' } },
      take: 10
    });

    // 3. Get top browser domains for this session
    const browserDomains = await prisma.browserTelemetry.groupBy({
      by: ['domain', 'category'],
      where: { trackingSessionId: sessionId, userId },
      _sum: { duration: true },
      orderBy: { _sum: { duration: 'desc' } },
      take: 10
    });

    // 4. Get recent activities
    const recentActivities = await prisma.activityEvent.findMany({
      where: { trackingSessionId: sessionId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ 
      success: true, 
      data: {
        session: activeSession,
        stats,
        desktopApps: desktopApps.map(a => ({ name: a.processName, category: a.category, duration: a._sum.duration || 0 })),
        browserDomains: browserDomains.map(b => ({ name: b.domain, category: b.category, duration: b._sum.duration || 0 })),
        recentActivities
      } 
    });
  } catch (error) {
    console.error('getDashboardData error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
