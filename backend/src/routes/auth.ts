import { Router } from 'express';
import { authenticate, refreshTokenMiddleware } from '../middleware/auth';
import {
  register,
  login,
  sendOtp,
  verifyOtpLogin,
  enrollFace,
  faceLogin,
  getMe,
  updateProfile,
  updateSettings,
  getSettings,
  changePassword,
  forgotPassword,
  resetPassword,
  requestCaptcha,
  logout,
  refreshToken,
  clerkExchange,
} from '../controllers/authController';

const router = Router();

router.get('/captcha', requestCaptcha);

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpLogin);
router.post('/face-login', faceLogin);
router.put('/enroll-face', authenticate, enrollFace);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/clerk', clerkExchange);
router.post('/refresh-token', refreshTokenMiddleware, refreshToken);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.put('/settings', authenticate, updateSettings);
router.get('/settings', authenticate, getSettings);
router.post('/logout', authenticate, logout);

export default router;
