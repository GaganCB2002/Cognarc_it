import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInsights,
  getLearningRoadmap,
  getInterviewQuestions,
} from '../controllers/insightsController';

const router = Router();

router.get('/productivity', authenticate, getInsights);
router.get('/roadmap', authenticate, getLearningRoadmap);
router.get('/interview-questions', authenticate, getInterviewQuestions);

export default router;
