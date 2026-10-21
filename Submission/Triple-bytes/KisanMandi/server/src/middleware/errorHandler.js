import { ApiError } from '../utils/errors.js';

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found'));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body must contain valid JSON' },
    });
  }
  if (!(error instanceof ApiError)) console.error(error);
  const status = error.status ?? 500;
  const payload = {
    code: error.code ?? 'SERVER_ERROR',
    message: status === 500 ? 'Something went wrong on the server' : error.message,
  };
  if (error.fields) payload.fields = error.fields;
  res.status(status).json({ error: payload });
}
