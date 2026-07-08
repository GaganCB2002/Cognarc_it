import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createSessionReport,
  createPeriodicReport,
  listReports,
  getReportById,
  downloadPeriodicPdf,
} from '../controllers/reportController';

const router = Router();

router.post('/sessions/:sessionId/generate', authenticate, createSessionReport);
router.post('/periodic', authenticate, createPeriodicReport);
router.get('/', authenticate, listReports);
router.get('/:reportId', authenticate, getReportById);
router.get('/:reportId/pdf', authenticate, downloadPeriodicPdf);

export default router;
