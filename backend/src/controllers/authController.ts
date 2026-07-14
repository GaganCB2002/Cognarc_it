import { Request, Response } from 'express';

export async function register(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Please use Clerk for registration' });
}

export async function login(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Please use Clerk for login' });
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'OTP is handled by Clerk' });
}

export async function verifyOtpLogin(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'OTP is handled by Clerk' });
}

export async function enrollFace(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Face login not supported' });
}

export async function faceLogin(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Face login not supported' });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Token refresh handled by Clerk' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: userId,
        role: "STUDENT",
        isApproved: true
      }
    }
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Profile update successful (Handled via Clerk)' } });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Settings updated' } });
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { settings: {} } });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Password changes handled by Clerk' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Password reset handled by Clerk' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Password reset handled by Clerk' });
}

export async function requestCaptcha(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { key: 'clerk', question: 'Use Clerk' } });
}

export async function clerkExchange(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Handled natively via Clerk middleware' } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'Logout handled by Clerk' });
}
