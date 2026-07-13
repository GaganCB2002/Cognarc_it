import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateSessionReport } from '../services/report.service';
import { generateSessionPdfReport } from '../services/pdfReport.service';
import { lifelog } from '../services/lifelog.service';
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
  validateCategory,
} from '../services/tracking.service';

export async function startSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { deviceId, deviceName, projectName } = req.body;
    const session = await startTrackingSession({ userId, deviceId, deviceName, projectName });
    await lifelog.tracking(userId, "SESSION_START", `Tracking session started: ${projectName || "General"}`, {
      sessionId: session.id,
      projectName: projectName || null,
      deviceName: deviceName || null,
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    console.error('[startSession]', { userId: req.user?.userId, error: (error as Error).message });
    res.status(500).json({ success: false, message: msg });
  }
}

export async function pauseSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const session = await pauseTrackingSession(sessionId, userId);
    await lifelog.tracking(userId, "SESSION_PAUSE", `Session paused: ${sessionId.substring(0, 8)}...`, { sessionId });
    res.json({ success: true, data: session });
    } catch (error: any) {
    console.error('[pauseSession]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: error.message });
    if (error.message === 'Active session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
}

export async function resumeSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const session = await resumeTrackingSession(sessionId, userId);
    await lifelog.tracking(userId, "SESSION_RESUME", `Session resumed: ${sessionId.substring(0, 8)}...`, { sessionId });
    res.json({ success: true, data: session });
  } catch (error: any) {
    console.error('[resumeSession]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: error.message });
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
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const session = await stopTrackingSession(sessionId, userId);

    // Run report and PDF generation in the background to prevent blocking the API response
    (async () => {
      try {
        await generateSessionReport(sessionId, userId);
        
        // Auto-generate and cache PDF file in uploads
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const pdfPath = path.join(uploadsDir, `report-${sessionId}.pdf`);
        await generateSessionPdfReport(sessionId, userId, { outputPath: pdfPath });
      } catch (reportError) {
        console.error('Background report generation failed:', reportError);
      }
    })();

    await lifelog.tracking(userId, "SESSION_STOP", `Session stopped: ${sessionId.substring(0, 8)}... (${Math.round((session.endTime ? (session.endTime.getTime() - session.startTime.getTime() - session.totalPauseMs) : 0) / 1000 / 60)} min)`, {
      sessionId,
      durationMs: session.endTime ? session.endTime.getTime() - session.startTime.getTime() - session.totalPauseMs : 0,
      projectName: session.projectName,
      hasReport: true,
    });
    
    // We return immediately with report: null. The UI will fetch the report when it's ready.
    res.json({ success: true, data: { session, report: null } });
  } catch (error: any) {
    console.error('[stopSession]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: error.message });
    if (error.message === 'Session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
}

export async function downloadSessionPdf(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

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
      console.error('[downloadSessionPdf:stream]', { sessionId: req.params.sessionId, error: err.message });
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming PDF' });
    });
    pdfStream.pipe(res);
  } catch (error) {
    console.error('[downloadSessionPdf]', { sessionId: req.params.sessionId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function logActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    const { eventType, category, module, entityId, entityType, label, duration, metadata } = req.body;
    if (!sessionId || !eventType) {
      res.status(400).json({ success: false, message: 'sessionId and eventType are required' });
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
    console.error('[logActivity]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function batchLogActivities(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array is required' });
      return;
    }

    const eventsArr: Array<{ trackingSessionId: string; eventType: string; category?: string; module?: string; entityId?: string; entityType?: string; label?: string; duration?: number; metadata?: Record<string, unknown> }> = events;

    const sessionIds = [...new Set(eventsArr.map((e) => e.trackingSessionId).filter((id): id is string => typeof id === 'string' && id.trim() !== ''))];
    if (sessionIds.length === 0) {
      res.status(400).json({ success: false, message: 'No valid trackingSessionId found in events' });
      return;
    }
    const validSessions = await prisma.trackingSession.findMany({
      where: { id: { in: sessionIds }, userId },
      select: { id: true },
    });
    const validSessionIds = new Set(validSessions.map((s) => s.id));
    const invalid = sessionIds.find((sid) => !validSessionIds.has(sid));
    if (invalid) {
      res.status(403).json({ success: false, message: `Session ${invalid} not found or does not belong to user` });
      return;
    }

    const BATCH_SIZE = 50;
    const allCreated: Array<any> = [];
    for (let i = 0; i < eventsArr.length; i += BATCH_SIZE) {
      const batch = eventsArr.slice(i, i + BATCH_SIZE);
      const batchResult = await prisma.$transaction(
        batch.map((ev) =>
          prisma.activityEvent.create({
            data: {
              trackingSessionId: ev.trackingSessionId,
              userId,
              eventType: ev.eventType,
              category: validateCategory(ev.category) as any,
              module: ev.module || null,
              entityId: ev.entityId || null,
              entityType: ev.entityType || null,
              label: ev.label || null,
              duration: Math.max(0, ev.duration || 0),
              metadata: ev.metadata ? JSON.parse(JSON.stringify(ev.metadata)) : null,
            },
          })
        )
      );
      allCreated.push(...batchResult);
    }

    res.status(201).json({ success: true, data: allCreated, count: allCreated.length });
  } catch (error) {
    console.error('[batchLogActivities]', { userId: req.user?.userId, count: req.body?.events?.length || 0, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCurrentSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const session = await getActiveSession(userId);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[getCurrentSession]', { userId: req.user?.userId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const result = await getSessionHistory(userId, { limit, offset, from, to });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[getSessions]', { userId: req.user?.userId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const session = await prisma.trackingSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[getSessionById]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessionStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const stats = await getAggregatedSessionStats(sessionId, userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[getSessionStats]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: error.message });
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
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ success: false, message: 'Session ID is required' }); return; }

    const category = req.query.category as string;
    const activities = await getSessionActivities(sessionId, userId, { category });
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('[getSessionActivitiesHandler]', { userId: req.user?.userId, sessionId: req.params.sessionId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getLiveTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

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
    console.error('[getLiveTelemetry]', { userId: req.user?.userId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

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
    console.error('[getDashboardData]', { userId: req.user?.userId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
