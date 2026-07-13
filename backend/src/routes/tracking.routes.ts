import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  logActivity,
  batchLogActivities,
  getCurrentSession,
  getSessions,
  getSessionById,
  getSessionStats,
  getSessionActivitiesHandler,
  downloadSessionPdf,
  getDashboardData,
  getLiveTelemetry,
} from '../controllers/trackingController';

const router = Router();

router.post('/sessions/start', authenticate, startSession);
router.post('/sessions/:sessionId/pause', authenticate, pauseSession);
router.post('/sessions/:sessionId/resume', authenticate, resumeSession);
router.post('/sessions/:sessionId/stop', authenticate, stopSession);
router.post('/sessions/batch-activities', authenticate, batchLogActivities);
router.post('/sessions/:sessionId/activities', authenticate, logActivity);
router.get('/sessions/:sessionId/pdf', authenticate, downloadSessionPdf);
router.get('/sessions/dashboard', authenticate, getDashboardData);
router.get('/sessions/live', authenticate, getLiveTelemetry);
router.get('/sessions/current', authenticate, getCurrentSession);
router.get('/sessions', authenticate, getSessions);
router.get('/sessions/:sessionId', authenticate, getSessionById);
router.get('/sessions/:sessionId/stats', authenticate, getSessionStats);
router.get('/sessions/:sessionId/activities', authenticate, getSessionActivitiesHandler);

export default router;
