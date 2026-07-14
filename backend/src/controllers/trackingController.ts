import { Request, Response } from 'express';
import { pool } from '../lib/prisma';
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

    (async () => {
      try {
        await generateSessionReport(sessionId, userId);
        
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
      else res.end();
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
    const validSessionsResult = await pool.query(
      'SELECT "id" FROM "TrackingSession" WHERE "id" = ANY($1) AND "userId" = $2',
      [sessionIds, userId]
    );
    const validSessionIds = new Set(validSessionsResult.rows.map((s: any) => s.id));
    const invalid = sessionIds.find((sid) => !validSessionIds.has(sid));
    if (invalid) {
      res.status(403).json({ success: false, message: `Session ${invalid} not found or does not belong to user` });
      return;
    }

    const BATCH_SIZE = 50;
    const allCreated: Array<any> = [];
    for (let i = 0; i < eventsArr.length; i += BATCH_SIZE) {
      const batch = eventsArr.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const ev of batch) {
        placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9})`);
        values.push(
          ev.trackingSessionId, userId, ev.eventType,
          validateCategory(ev.category), ev.module || null,
          ev.entityId || null, ev.entityType || null,
          ev.label || null, Math.max(0, ev.duration || 0),
          ev.metadata ? JSON.parse(JSON.stringify(ev.metadata)) : null
        );
        idx += 10;
      }
      const result = await pool.query(
        `INSERT INTO "ActivityEvent" ("trackingSessionId", "userId", "eventType", "category", "module", "entityId", "entityType", "label", "duration", "metadata") VALUES ${placeholders.join(', ')} RETURNING *`,
        values
      );
      allCreated.push(...result.rows);
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

    const result = await pool.query('SELECT * FROM "TrackingSession" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [sessionId, userId]);
    const session = result.rows[0];
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

    const activeSessionResult = await pool.query(
      'SELECT * FROM "TrackingSession" WHERE "userId" = $1 AND "status" = ANY($2) ORDER BY "startTime" DESC LIMIT 1',
      [userId, ["ACTIVE", "PAUSED"]]
    );
    const activeSession = activeSessionResult.rows[0];

    if (!activeSession) {
      res.json({ success: true, data: null });
      return;
    }

    const sessionId = activeSession.id;

    const [latestBrowserResult, latestDesktopResult] = await Promise.all([
      pool.query('SELECT * FROM "BrowserTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2 ORDER BY "timestamp" DESC LIMIT 1', [sessionId, userId]),
      pool.query('SELECT * FROM "DesktopTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2 ORDER BY "timestamp" DESC LIMIT 1', [sessionId, userId]),
    ]);

    const latestBrowser = latestBrowserResult.rows[0];
    const latestDesktop = latestDesktopResult.rows[0];

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

    const stats = await getAggregatedSessionStats(sessionId, userId);

    const [desktopAppsResult, browserDomainsResult, recentActivitiesResult] = await Promise.all([
      pool.query(
        'SELECT "processName", "category", COALESCE(SUM("duration"), 0)::int AS "_sum_duration" FROM "DesktopTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2 GROUP BY "processName", "category" ORDER BY SUM("duration") DESC LIMIT 10',
        [sessionId, userId]
      ),
      pool.query(
        'SELECT "domain", "category", COALESCE(SUM("duration"), 0)::int AS "_sum_duration" FROM "BrowserTelemetry" WHERE "trackingSessionId" = $1 AND "userId" = $2 GROUP BY "domain", "category" ORDER BY SUM("duration") DESC LIMIT 10',
        [sessionId, userId]
      ),
      pool.query(
        'SELECT * FROM "ActivityEvent" WHERE "trackingSessionId" = $1 AND "userId" = $2 ORDER BY "createdAt" DESC LIMIT 20',
        [sessionId, userId]
      ),
    ]);

    const desktopApps = desktopAppsResult.rows;
    const browserDomains = browserDomainsResult.rows;
    const recentActivities = recentActivitiesResult.rows;

    res.json({ 
      success: true, 
      data: {
        session: activeSession,
        stats,
        desktopApps: desktopApps.map((a: any) => ({ name: a.processName, category: a.category, duration: a._sum_duration || 0 })),
        browserDomains: browserDomains.map((b: any) => ({ name: b.domain, category: b.category, duration: b._sum_duration || 0 })),
        recentActivities
      } 
    });
  } catch (error) {
    console.error('[getDashboardData]', { userId: req.user?.userId, error: (error as Error).message });
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
