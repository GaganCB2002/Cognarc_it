import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  verifyEmail,
  verifyLoginOTP,
  getMe,
  updateProfile,
  updateSettings,
  getSettings,
  changePassword,
  forgotPassword,
  resetPassword,
  requestCaptcha,
  resendOTP,
  logout,
} from '../controllers/authController';

const router = Router();

router.get('/captcha', requestCaptcha);

router.post('/register', register);
router.post('/register/verify', verifyEmail);
router.post('/login', login);
router.post('/login/verify', verifyLoginOTP);
router.post('/resend-otp', resendOTP);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.put('/settings', authenticate, updateSettings);
router.get('/settings', authenticate, getSettings);
router.post('/logout', authenticate, logout);

export default router;
