export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function databaseError(error) {
  const wrapped = new AppError(500, "INTERNAL_ERROR", "Unexpected server error.");
  wrapped.cause = error;
  return wrapped;
}
