import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSessions,
  getTodaySessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController';

const router = Router();

router.get('/', authenticate, getSessions);
router.get('/today', authenticate, getTodaySessions);
router.get('/:id', authenticate, getSessionById);
router.post('/', authenticate, createSession);
router.put('/:id', authenticate, updateSession);
router.delete('/:id', authenticate, deleteSession);

export default router;
