// Throw this from any service; the error middleware turns it into a JSON response
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details);
export const forbidden = (msg) => new ApiError(403, msg);
export const notFound = (msg) => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);
export const unauthorized = (msg) => new ApiError(401, msg);