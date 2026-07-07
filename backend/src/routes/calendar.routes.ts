import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  searchCalendarEvents,
  getCalendarStats,
} from '../controllers/calendarController';

const router = Router();

router.post('/', authenticate, createCalendarEvent);
router.get('/', authenticate, listCalendarEvents);
router.get('/search/query', authenticate, searchCalendarEvents);
router.get('/stats/overview', authenticate, getCalendarStats);
router.get('/:eventId', authenticate, getCalendarEvent);
router.put('/:eventId', authenticate, updateCalendarEvent);
router.delete('/:eventId', authenticate, deleteCalendarEvent);

export default router;
