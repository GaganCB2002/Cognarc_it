import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardStats,
  getWeeklyTrends,
  getCategoryBreakdown,
  getProductivityTrend,
} from '../controllers/analyticsController';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/weekly-trends', authenticate, getWeeklyTrends);
router.get('/category-breakdown', authenticate, getCategoryBreakdown);
router.get('/productivity-trend', authenticate, getProductivityTrend);

export default router;
