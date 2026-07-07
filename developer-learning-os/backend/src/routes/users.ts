import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUsers, getUserById, deleteUser, getUserStats } from '../controllers/userController';

const router = Router();

router.get('/', authenticate, getUsers);
router.get('/stats', authenticate, getUserStats);
router.get('/:id', authenticate, getUserById);
router.delete('/:id', authenticate, deleteUser);

export default router;
