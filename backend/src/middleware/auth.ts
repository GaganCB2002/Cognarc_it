import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '../utils/helpers';

declare global {
  namespace Express {
    interface Request {
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
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = { userId: decoded.userId };
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = { userId: decoded.userId };
      }
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};

export const refreshTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    req.user = { userId: decoded.userId };
    res.locals.newAccessToken = newAccessToken;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};
