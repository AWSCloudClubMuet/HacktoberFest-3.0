// ============================================================
// Custom AppError class and typed error utilities
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundError(resource: string, id?: string): AppError {
  const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
  return new AppError(msg, 404);
}

export function forbiddenError(message = 'Forbidden'): AppError {
  return new AppError(message, 403);
}

export function unauthorizedError(message = 'Unauthorized'): AppError {
  return new AppError(message, 401);
}

export function conflictError(message: string): AppError {
  return new AppError(message, 409);
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError(message, 400, details);
}
