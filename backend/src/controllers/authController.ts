import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../server';
import { generateToken } from '../utils/helpers';
import { getActiveSession, stopTrackingSession } from '../services/tracking.service';
import { generateOTP, verifyOTP, generateResetToken, verifyResetToken, markResetTokenUsed } from '../services/otp.service';
import { generateCaptcha, verifyCaptcha } from '../services/captcha.service';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/email.service';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, captchaKey, captchaAnswer } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }

    if (!captchaKey || captchaAnswer === undefined || !verifyCaptcha(captchaKey, Number(captchaAnswer))) {
      res.status(400).json({ message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      omit: { password: true },
    });

    const { otp, key } = generateOTP(user.id);
    await sendOTPEmail(user.email, otp);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      otpKey: key,
      userId: user.id,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { userId, otpKey, otp } = req.body;

    if (!userId || !otpKey || !otp) {
      res.status(400).json({ message: 'userId, otpKey, and otp are required' });
      return;
    }

    if (!verifyOTP(otpKey, otp, userId)) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });

    const token = generateToken(user!.id);

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('VerifyEmail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, captchaKey, captchaAnswer } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    if (!captchaKey || captchaAnswer === undefined || !verifyCaptcha(captchaKey, Number(captchaAnswer))) {
      res.status(400).json({ message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: 'Account uses OAuth. Please sign in with the appropriate provider.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const { otp, key } = generateOTP(user.id);
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      message: 'Password verified. OTP sent to your email.',
      otpKey: key,
      userId: user.id,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyLoginOTP(req: Request, res: Response): Promise<void> {
  try {
    const { userId, otpKey, otp } = req.body;

    if (!userId || !otpKey || !otp) {
      res.status(400).json({ message: 'userId, otpKey, and otp are required' });
      return;
    }

    if (!verifyOTP(otpKey, otp, userId)) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('VerifyLoginOTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: { profile: true, learningStreak: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, avatar, bio, targetRole, currentLevel, weeklyHours, timezone, skills, careerGoals, githubUrl, linkedinUrl, portfolioUrl } = req.body;

    const userUpdateData: Record<string, any> = {};
    if (name !== undefined) userUpdateData.name = name;
    if (avatar !== undefined) userUpdateData.avatar = avatar;

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

    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.profile.upsert({
        where: { userId },
        update: profileUpdateData,
        create: { userId, ...profileUpdateData },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: { profile: true },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { settings } = req.body;
    if (!settings) {
      res.status(400).json({ message: 'Settings payload is required' });
      return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const currentSettings = currentUser?.settings
      ? (typeof currentUser.settings === 'string' ? JSON.parse(currentUser.settings) : currentUser.settings)
      : {};

    const mergedSettings = { ...currentSettings, ...settings };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { settings: mergedSettings },
      omit: { password: true },
    });

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: updatedUser.settings,
    });
  } catch (error) {
    console.error('UpdateSettings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ settings: user.settings || {} });
  } catch (error) {
    console.error('GetSettings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new passwords are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: 'Account uses OAuth and does not have a password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid current password' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, captchaKey, captchaAnswer } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    if (!captchaKey || captchaAnswer === undefined || !verifyCaptcha(captchaKey, Number(captchaAnswer))) {
      res.status(400).json({ message: 'Invalid or expired captcha. Please try again.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
      return;
    }

    const token = generateResetToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      res.status(400).json({ message: 'Token, email, and new password are required' });
      return;
    }

    const userId = verifyResetToken(token);
    if (!userId) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== email) {
      res.status(400).json({ message: 'Invalid reset request' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    markResetTokenUsed(token);

    res.status(200).json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function requestCaptcha(req: Request, res: Response): Promise<void> {
  try {
    const captcha = generateCaptcha();
    res.status(200).json({
      key: captcha.key,
      question: captcha.question,
    });
  } catch (error) {
    console.error('Captcha error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { otp, key } = generateOTP(user.id);
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      message: 'OTP resent successfully',
      otpKey: key,
    });
  } catch (error) {
    console.error('ResendOTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
