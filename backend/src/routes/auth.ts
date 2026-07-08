import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateSettings,
  getSettings,
  changePassword,
  forgotPassword,
  resetPassword,
  requestCaptcha,
  logout,
} from '../controllers/authController';

const router = Router();

router.get('/captcha', requestCaptcha);

router.post('/register', register);
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.put('/settings', authenticate, updateSettings);
router.get('/settings', authenticate, getSettings);
router.post('/logout', authenticate, logout);

export default router;
