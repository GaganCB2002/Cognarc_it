import { Request, Response } from 'express';
import {
  generateSessionReport,
  generatePeriodicReport,
  getReports,
  getReport,
} from '../services/report.service';
import { generatePeriodicPdfReport } from '../services/pdfReport.service';
import path from 'path';
import fs from 'fs';

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

    const validTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
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

export async function downloadPeriodicPdf(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const reportId = req.params.reportId as string;
    if (!reportId) { res.status(400).json({ message: 'Report ID is required' }); return; }

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const pdfPath = path.join(uploadsDir, `periodic-report-${reportId}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      try {
        const buffer = await generatePeriodicPdfReport(reportId, userId, { outputPath: pdfPath });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="periodic-report-${reportId}.pdf"`);
        res.send(buffer);
        return;
      } catch (err) {
        console.error('downloadPeriodicPdf generation error:', err);
        res.status(404).json({ success: false, message: 'Report PDF could not be generated' });
        return;
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="periodic-report-${reportId}.pdf"`);
    const readStream = fs.createReadStream(pdfPath);
    readStream.on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming PDF' });
    });
    readStream.pipe(res);
  } catch (error) {
    console.error('downloadPeriodicPdf error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
