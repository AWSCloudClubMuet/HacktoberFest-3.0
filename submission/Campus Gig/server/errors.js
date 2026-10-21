// Every API error is returned as JSON: { error: { code, message, fields? } }.

const HTTP_STATUS = {
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  UNAUTHENTICATED: 401,
  UNKNOWN_USER: 401,
  NOT_OWNER: 403,
  NOT_PARTICIPANT: 403,
  FORBIDDEN: 403,
  OWN_GIG: 403,
  NOT_FOUND: 404,
  DUPLICATE_APPLICATION: 409,
  GIG_CLOSED: 409,
  INVALID_TRANSITION: 409,
  GIG_NOT_COMPLETED: 409,
  ALREADY_REVIEWED: 409,
};

export class ApiError extends Error {
  constructor(code, message, fields) {
    super(message);
    this.code = code;
    this.status = HTTP_STATUS[code] ?? 500;
    this.fields = fields;
  }
}

export const notFound = (what, id) => new ApiError('NOT_FOUND', `${what} "${id}" was not found.`);

/** Throws the failed check from shared/rules.js as an API error. */
export function enforce(check) {
  if (!check.ok) throw new ApiError(check.code, check.message);
  return check;
}

/** Throws a 400 listing every invalid field, or returns the cleaned value. */
export function validOrThrow({ value, errors }) {
  if (Object.keys(errors).length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Please fix the highlighted fields.', errors);
  }
  return value;
}
