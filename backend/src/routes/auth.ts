import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;
