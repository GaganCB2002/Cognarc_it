import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Server cannot start.');
  }
  return secret;
}

const ACCESS_TOKEN_EXPIRY = '7d';

export function generateToken(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
}

export function verifyToken(token: string): { userId: string; type: string } {
  return jwt.verify(token, getJwtSecret()) as { userId: string; type: string };
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; type: string };
    if (decoded.type !== 'access') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; type: string };
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
