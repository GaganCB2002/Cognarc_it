import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  pinNote,
} from '../controllers/noteController';

const router = Router();

router.get('/', authenticate, getNotes);
router.get('/:id', authenticate, getNoteById);
router.post('/', authenticate, createNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);
router.patch('/:id/pin', authenticate, pinNote);

export default router;
