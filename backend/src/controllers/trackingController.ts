import { Request, Response } from 'express';
import { prisma } from '../server';
import { generateSessionReport } from '../services/report.service';
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
    console.error('startSession error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    } catch (reportError) {
      console.error('Report generation failed:', reportError);
    }

    res.json({ success: true, data: { session, report } });
  } catch (error: any) {
    console.error('stopSession error:', error);
    if (error.message === 'Active or paused session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function logActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { trackingSessionId, eventType, category, module, entityId, entityType, label, duration, metadata } = req.body;
    if (!trackingSessionId || !eventType) {
      res.status(400).json({ message: 'trackingSessionId and eventType are required' });
      return;
    }

    const event = await logActivityEvent({
      trackingSessionId,
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getCurrentSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const session = await getActiveSession(userId);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('getCurrentSession error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
