import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { RegisterSchema, LoginSchema } from '../lib/validation';
import { conflictError, unauthorizedError, validationError } from '../lib/errors';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rate-limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── POST /auth/register ───────────────────────────────────────
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const { email, displayName, password, role, district, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflictError('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, displayName, passwordHash, role, district, phone },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        district: user.district,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw unauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw unauthorizedError('Invalid email or password');

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        district: user.district,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me ──────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, displayName: true,
        role: true, district: true, phone: true, createdAt: true,
      },
    });
    if (!user) throw unauthorizedError('User not found');
    res.json({ success: true, data: user, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/logout ─────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

export default router;
