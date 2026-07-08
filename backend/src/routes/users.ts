import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUsers, getUserById, deleteUser, getUserStats, getPendingUsers, approveUser, rejectUser, getAdminDashboardStats } from '../controllers/userController';

const router = Router();

router.get('/admin/stats', authenticate, getAdminDashboardStats);
router.get('/pending', authenticate, getPendingUsers);
router.get('/', authenticate, getUsers);
router.get('/stats', authenticate, getUserStats);
router.get('/:id', authenticate, getUserById);
router.post('/:id/approve', authenticate, approveUser);
router.post('/:id/reject', authenticate, rejectUser);
router.delete('/:id', authenticate, deleteUser);

export default router;
