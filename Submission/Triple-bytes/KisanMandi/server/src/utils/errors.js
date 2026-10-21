export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const validationError = (fields) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields', fields);

export const notFound = (resource = 'Resource') =>
  new ApiError(404, 'NOT_FOUND', `${resource} not found`);

export const databaseError = (error) => {
  const wrapped = new ApiError(500, 'SERVER_ERROR', 'Something went wrong on the server');
  wrapped.cause = error;
  return wrapped;
};
