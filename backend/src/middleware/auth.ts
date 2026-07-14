import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth, StrictAuthProp, LooseAuthProp } from '@clerk/clerk-sdk-node';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '../utils/helpers';

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {
      user?: { userId: string };
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const queryToken = req.query.token;
  if (queryToken && typeof queryToken === 'string') {
    return queryToken;
  }
  return null;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // First try using Clerk authentication
  ClerkExpressRequireAuth()(req, res, (err: any) => {
    // If Clerk successfully authenticated the user
    if (!err && req.auth && req.auth.userId) {
      req.user = { userId: req.auth.userId };
      return next();
    }

    // Fallback: Try custom JWT for backward compatibility or API keys
    const token = extractToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = { userId: decoded.userId };
        return next();
      }
    }

    // If both fail, return 401
    return res.status(401).json({ success: false, message: 'Authentication required' });
  });
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  ClerkExpressWithAuth()(req, res, (err: any) => {
    // If Clerk authenticated
    if (!err && req.auth && req.auth.userId) {
      req.user = { userId: req.auth.userId };
    } else {
      // Fallback
      const token = extractToken(req);
      if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          req.user = { userId: decoded.userId };
        }
      }
    }
    next();
  });
};

export const refreshTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    req.user = { userId: decoded.userId };
    res.locals.newAccessToken = newAccessToken;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};
