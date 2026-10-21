// ============================================================
// Centralized error-handling middleware
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors we created
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with this value already exists.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found.' });
      return;
    }
  }

  // Validation errors from Zod
  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ZodError'
  ) {
    const zodErr = err as unknown as { issues?: unknown[]; errors?: unknown[] };
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: zodErr.issues || zodErr.errors,
    });
    return;
  }

  // Unknown errors — don't leak internals
  console.error('[Unhandled error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
