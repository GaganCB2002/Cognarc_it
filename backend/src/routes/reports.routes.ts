import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createSessionReport,
  createPeriodicReport,
  listReports,
  getReportById,
  downloadPeriodicPdf,
  getDailySummary,
  triggerDailySummary,
} from '../controllers/reportController';

const router = Router();

router.get('/daily-ai-summary', authenticate, getDailySummary);
router.post('/daily-ai-summary/trigger', authenticate, triggerDailySummary);

router.post('/sessions/:sessionId/generate', authenticate, createSessionReport);
router.post('/periodic', authenticate, createPeriodicReport);
router.get('/', authenticate, listReports);
router.get('/:reportId', authenticate, getReportById);
router.get('/:reportId/pdf', authenticate, downloadPeriodicPdf);

export default router;
