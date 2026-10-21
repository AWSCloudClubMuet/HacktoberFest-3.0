// ============================================================
// Authentication middleware — verifies JWT from Authorization
// header or httpOnly cookie and attaches user to req
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { unauthorizedError, forbiddenError } from '../lib/errors';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // 2. Fallback to httpOnly cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token as string;
    }

    if (!token) {
      throw unauthorizedError('Authentication required');
    }

    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: ('farmer' | 'buyer')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbiddenError(`This action requires role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}
