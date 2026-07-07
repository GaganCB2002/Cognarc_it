import { Request, Response } from 'express';
import {
  generateSessionReport,
  generatePeriodicReport,
  getReports,
  getReport,
} from '../services/report.service';

export async function createSessionReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sessionId = req.params.sessionId as string;
    if (!sessionId) { res.status(400).json({ message: 'Session ID is required' }); return; }

    const report = await generateSessionReport(sessionId, userId);
    res.status(201).json({ success: true, data: report });
  } catch (error: any) {
    console.error('createSessionReport error:', error);
    if (error.message === 'Session not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createPeriodicReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { type, from, to } = req.body;
    if (!type || !from || !to) {
      res.status(400).json({ message: 'type, from, and to are required' });
      return;
    }

    const validTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
      return;
    }

    const report = await generatePeriodicReport(userId, type, new Date(from), new Date(to));
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('createPeriodicReport error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;

    const result = await getReports(userId, { type, limit, offset });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('listReports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const reportId = req.params.reportId as string;
    if (!reportId) { res.status(400).json({ message: 'Report ID is required' }); return; }

    const report = await getReport(reportId, userId);
    if (!report) { res.status(404).json({ message: 'Report not found' }); return; }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('getReportById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
