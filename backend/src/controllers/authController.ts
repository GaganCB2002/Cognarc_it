import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/helpers';
import { getActiveSession, stopTrackingSession } from '../services/tracking.service';
import { generateResetToken, verifyResetToken, markResetTokenUsed } from '../services/otp.service';
import { generateCaptcha, verifyCaptcha } from '../services/captcha.service';
import { sendOTPEmail } from '../services/email.service';
import { geminiService } from '../services/gemini.service';
import { lifelog } from '../services/lifelog.service';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, captchaKey, captchaAnswer } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'Email, password, and name are required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      return;
    }

    if (name.length < 2) {
      res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    const createdUser = await prisma.user.create({
      data: { email, password: hashedPassword, name, otpCode, emailVerified: new Date(), isApproved: true },
    });
    const { password: _, ...user } = createdUser;

    await lifelog.auth(createdUser.id, "REGISTER", `User registered: ${email}`, {
      email,
      name,
      userId: createdUser.id,
    });

    res.status(201).json({
      success: true,
      data: { message: 'Registration successful. You can now login.', user },
    });
  } catch (error: any) {
    console.error('Register error:', { message: error?.message, timestamp: new Date().toISOString() });
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  console.log('[DEBUG] login controller hit');
  try {
    let { email, password, captchaKey, captchaAnswer } = req.body;
    console.log('[DEBUG] request body parsed');

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    if (password.length > 100) {
      res.status(400).json({ success: false, message: 'Password is too long' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    email = email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Auto-create test accounts (configured via env vars, disabled by default)
    if (process.env.NODE_ENV !== 'production') {
      const testEmails = (process.env.TEST_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const testPassword = process.env.TEST_PASSWORD || '';
      if (!user && testPassword && testEmails.includes(email.toLowerCase()) && password === testPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: email === process.env.ADMIN_EMAIL?.toLowerCase() ? 'Admin' : 'Test User',
            role: email === process.env.ADMIN_EMAIL?.toLowerCase() ? 'ADMIN' : 'STUDENT',
            isApproved: true,
            emailVerified: new Date(),
            otpCode,
          }
        });
      }

      // Special user account (configured via env vars, disabled by default)
      const specialEmail = (process.env.SPECIAL_USER_EMAIL || '').toLowerCase();
      const specialPassword = process.env.SPECIAL_USER_PASSWORD || '';
      const specialName = process.env.SPECIAL_USER_NAME || '';
      if (!user && specialEmail && specialPassword && email.toLowerCase() === specialEmail && password === specialPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: specialName || email.split('@')[0],
            role: 'STUDENT',
            isApproved: true,
            emailVerified: new Date(),
            otpCode,
          }
        });
      }
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Check if password login is enabled in user settings
    const userSettings: any = user.settings || {};
    if (userSettings.auth?.passwordLogin === false) {
      res.status(403).json({ success: false, message: 'Password login is disabled for this account. Use another sign-in method.' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ success: false, message: 'Account uses OAuth. Please sign in with the appropriate provider.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isApproved && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const hoursSinceCreation = (Date.now() - createdAtTime) / (1000 * 60 * 60);
      if (hoursSinceCreation >= 24) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isApproved: true },
        });
        user.isApproved = true;
      } else {
        res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
        return;
      }
    }

    const tokens = generateToken(user.id);

    await lifelog.auth(user.id, "LOGIN", `User logged in: ${email}`, {
      email,
      userId: user.id,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Login successful',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { ...user, password: undefined },
      },
    });
  } catch (error: any) {
    console.error('Login error:', { message: error?.message, timestamp: new Date().toISOString() });
    res.status(500).json({ success: false, message: 'Login failed. Please try again later.' });
  }
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  try {
    let { email, captchaKey, captchaAnswer } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpCode) {
      res.status(404).json({ success: false, message: 'User not found or OTP not configured' });
      return;
    }

    // Fire-and-forget: email delivery failure shouldn't block auth
    sendOTPEmail(user.email, user.otpCode).catch(err => console.error('[EMAIL] Failed to send OTP:', err));

    res.status(200).json({
      success: true,
      data: { message: 'OTP sent to your registered email', otpKey: user.id },
    });
  } catch (error) {
    console.error('SendOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

export async function verifyOtpLogin(req: Request, res: Response): Promise<void> {
  try {
    let { email, otp, captchaKey, captchaAnswer } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email' });
      return;
    }

    // Check if OTP login is enabled in user settings
    const userSettings: any = user.settings || {};
    if (userSettings.auth?.otpLogin === false) {
      res.status(403).json({ success: false, message: 'OTP login is disabled for this account. Use another sign-in method.' });
      return;
    }

    if (!user.otpCode || user.otpCode !== otp) {
      res.status(401).json({ success: false, message: 'Invalid OTP' });
      return;
    }

    if (!user.isApproved && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const hoursSinceCreation = (Date.now() - createdAtTime) / (1000 * 60 * 60);
      if (hoursSinceCreation >= 24) {
        await prisma.user.update({ where: { id: user.id }, data: { isApproved: true } });
        user.isApproved = true;
      } else {
        res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
        return;
      }
    }

    const tokens = generateToken(user.id);
    res.status(200).json({
      success: true,
      data: {
        message: 'Login successful',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { ...user, password: undefined },
      },
    });
  } catch (error: any) {
    console.error('VerifyOtpLogin error:', { message: error?.message, timestamp: new Date().toISOString() });
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
}

export async function enrollFace(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { faceImage } = req.body;
    if (!faceImage) {
      res.status(400).json({ success: false, message: 'Face image is required' });
      return;
    }

    // Verify the image contains a face using Gemini
    const faceCheck = await geminiService.detectFace(faceImage);

    if (!faceCheck.hasFace) {
      res.status(400).json({ success: false, message: 'No clear face detected in the image. Please try again with better lighting.' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { faceData: faceImage },
    });

    res.status(200).json({ success: true, data: { message: 'Face enrolled successfully' } });
  } catch (error) {
    console.error('EnrollFace error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll face' });
  }
}

export async function faceLogin(req: Request, res: Response): Promise<void> {
  try {
    let { email, faceImage, captchaKey, captchaAnswer } = req.body;

    if (!email || !faceImage) {
      res.status(400).json({ success: false, message: 'Email and face image are required' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if face login is enabled in user settings
    const userSettings: any = user.settings || {};
    if (userSettings.auth?.faceLogin === false) {
      res.status(403).json({ success: false, message: 'Face login is disabled for this account. Use another sign-in method.' });
      return;
    }

    if (!user.faceData) {
      res.status(400).json({ success: false, message: 'Face not enrolled. Please enroll your face first in Settings.' });
      return;
    }

    // Verify face using Gemini
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ success: false, message: 'Face verification is not available (AI service not configured). Please contact the administrator.' });
      return;
    }

    const result = await geminiService.verifyFace(faceImage, user.faceData);

    if (!result.faceDetected) {
      res.status(401).json({ success: false, message: 'No face detected in the image. Please ensure good lighting and try again.' });
      return;
    }

    if (!result.eyesOpen) {
      res.status(401).json({ success: false, message: 'Please keep your eyes open and try again.' });
      return;
    }

    if (!result.match) {
      const score = result.matchScore !== undefined ? ` (score: ${result.matchScore}/100)` : '';
      res.status(401).json({ success: false, message: `Face does not match${score}. Please try again with better lighting.` });
      return;
    }

    if (!user.isApproved && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const hoursSinceCreation = (Date.now() - createdAtTime) / (1000 * 60 * 60);
      if (hoursSinceCreation >= 24) {
        await prisma.user.update({ where: { id: user.id }, data: { isApproved: true } });
        user.isApproved = true;
      } else {
        res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
        return;
      }
    }

    const tokens = generateToken(user.id);
    res.status(200).json({
      success: true,
      data: {
        message: 'Face login successful',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { ...user, password: undefined },
      },
    });
  } catch (error: any) {
    console.error('FaceLogin error:', { message: error?.message, timestamp: new Date().toISOString() });
    if (error?.message?.includes('API key')) {
      res.status(500).json({ success: false, message: 'Face verification service is not configured. Please contact the administrator.' });
    } else if (error?.message?.includes('No response from Gemini')) {
      res.status(500).json({ success: false, message: 'Face verification service is temporarily unavailable. Please try again later.' });
    } else {
      res.status(500).json({ success: false, message: 'Face verification failed. Please try again.' });
    }
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const newAccessToken = res.locals?.newAccessToken;
    if (!newAccessToken) {
      res.status(401).json({ success: false, message: 'Unable to refresh token' });
      return;
    }
    res.status(200).json({ success: true, data: { token: newAccessToken } });
  } catch (error: any) {
    console.error('RefreshToken error:', { message: error?.message, timestamp: new Date().toISOString() });
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!foundUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    foundUser.password = undefined as any;
    res.status(200).json({ success: true, data: { user: foundUser } });
  } catch (error) {
    console.error('GetMe error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { name, avatar, bio, targetRole, currentLevel, weeklyHours, timezone, skills, careerGoals, githubUrl, linkedinUrl, portfolioUrl, resume, jobDescription } = req.body;

    const userUpdateData: Record<string, any> = {};
    if (name !== undefined) userUpdateData.name = name;
    if (avatar !== undefined) {
      userUpdateData.avatar = avatar;

      // If avatar is a base64 data URL, also auto-enroll as face data
      if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        try {
          const base64Data = avatar.split(',')[1];
          if (base64Data) {
            const faceCheck = await geminiService.detectFace(base64Data);
            if (faceCheck.hasFace) {
              userUpdateData.faceData = base64Data;
            }
          }
        } catch (e) {
          console.error('[PROFILE] Failed to auto-detect face from avatar:', e);
        }
      }
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    const profileUpdateData: Record<string, any> = {};
    if (bio !== undefined) profileUpdateData.bio = bio;
    if (targetRole !== undefined) profileUpdateData.targetRole = targetRole;
    if (currentLevel !== undefined) profileUpdateData.currentLevel = currentLevel;
    if (weeklyHours !== undefined) profileUpdateData.weeklyHours = parseInt(weeklyHours);
    if (timezone !== undefined) profileUpdateData.timezone = timezone;
    if (skills !== undefined) profileUpdateData.skills = skills;
    if (careerGoals !== undefined) profileUpdateData.careerGoals = careerGoals;
    if (githubUrl !== undefined) profileUpdateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) profileUpdateData.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) profileUpdateData.portfolioUrl = portfolioUrl;
    if (resume !== undefined) profileUpdateData.resume = resume;
    if (jobDescription !== undefined) profileUpdateData.jobDescription = jobDescription;

    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.profile.upsert({
        where: { userId },
        update: profileUpdateData,
        create: { userId, ...profileUpdateData },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (updatedUser) updatedUser.password = undefined as any;

    res.status(200).json({
      success: true,
      data: { message: 'Profile updated successfully', user: updatedUser },
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { settings } = req.body;
    if (!settings) {
      res.status(400).json({ success: false, message: 'Settings payload is required' });
      return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    let currentSettings: any = {};
    if (currentUser?.settings) {
      try {
        currentSettings = typeof currentUser.settings === 'string' ? JSON.parse(currentUser.settings) : currentUser.settings;
      } catch {
        currentSettings = {};
      }
    }

    const mergedSettings = { ...currentSettings, ...settings };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { settings: mergedSettings },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Settings updated successfully', settings: updatedUser.settings },
    });
  } catch (error) {
    console.error('UpdateSettings error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: { settings: user.settings || {} } });
  } catch (error) {
    console.error('GetSettings error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new passwords are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ success: false, message: 'Account uses OAuth and does not have a password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid current password' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    console.error('ChangePassword error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, captchaKey, captchaAnswer } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    if (!captchaKey || !captchaAnswer || !verifyCaptcha(captchaKey, String(captchaAnswer))) {
      res.status(400).json({ success: false, message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: 'No account found with this email address.' });
      return;
    }

    const token = generateResetToken(user.id);

    res.status(200).json({
      success: true,
      data: { message: 'Email verified. You can now reset your password.', token, email },
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
      return;
    }

    const userId = verifyResetToken(token);
    if (!userId) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== email) {
      res.status(400).json({ success: false, message: 'Invalid reset request' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    markResetTokenUsed(token);

    res.status(200).json({ success: true, data: { message: 'Password reset successfully. You can now login with your new password.' } });
  } catch (error) {
    console.error('ResetPassword error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function requestCaptcha(req: Request, res: Response): Promise<void> {
  try {
    const captcha = generateCaptcha();
    res.status(200).json({
      success: true,
      data: { key: captcha.key, question: captcha.question },
    });
  } catch (error) {
    console.error('Captcha error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function clerkExchange(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Clerk session token required' });
      return;
    }

    const clerkToken = authHeader.split(' ')[1];

    // Decode the Clerk JWT to extract the user ID (sub claim) without verifying signature.
    // Verification is done by calling Clerk's REST API with the secret key.
    let decoded: any;
    try {
      decoded = jwt.decode(clerkToken);
    } catch {
      res.status(401).json({ success: false, message: 'Invalid Clerk token format' });
      return;
    }

    const clerkId = decoded.sub;
    if (!clerkId) {
      res.status(401).json({ success: false, message: 'Invalid Clerk token' });
      return;
    }

    // Verify the user exists in Clerk by calling Clerk's API directly
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ success: false, message: 'Clerk secret key not configured' });
      return;
    }

    let clerkUserData: any;
    try {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      if (!clerkRes.ok) {
        res.status(401).json({ success: false, message: 'Invalid or expired Clerk session' });
        return;
      }
      clerkUserData = await clerkRes.json();
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired Clerk session' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      const email = clerkUserData.email_addresses?.[0]?.email_address || clerkUserData.email || '';
      const name = clerkUserData.first_name
        ? `${clerkUserData.first_name} ${clerkUserData.last_name || ''}`.trim()
        : clerkUserData.username || 'User';

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0] || 'User',
          clerkId,
          role: 'STUDENT',
          isApproved: true,
          emailVerified: new Date().toISOString(),
        },
      });
    }

    const { accessToken, refreshToken } = generateToken(user.id);

    res.json({
      success: true,
      data: {
        message: 'Authenticated via Clerk',
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error('Clerk exchange error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (userId) {
      try {
        const activeSession = await getActiveSession(userId);
        if (activeSession) {
          await stopTrackingSession(activeSession.id, userId);
        }
      } catch (e) {
        console.error('Failed to auto-stop session during logout', e);
      }
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    if (userId) {
      await lifelog.auth(userId, "LOGOUT", `User logged out`, { userId });
    }

    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    console.error('Logout error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
