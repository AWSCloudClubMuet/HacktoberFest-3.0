// ============================================================
// JWT helpers — sign / verify tokens
// ============================================================
import jwt from 'jsonwebtoken';
import { unauthorizedError } from './errors';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'farmer' | 'buyer';
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in environment');
  return s;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    throw unauthorizedError('Invalid or expired token');
  }
}
