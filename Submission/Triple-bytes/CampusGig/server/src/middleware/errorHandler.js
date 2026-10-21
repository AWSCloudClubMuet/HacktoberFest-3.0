import { AppError } from "../lib/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found.`));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must contain valid JSON.",
      },
    });
  }

  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const code = known ? error.code : "INTERNAL_ERROR";
  const message = known ? error.message : "Unexpected server error.";

  if (!known) console.error(error);
  else if (error.cause) console.error(error.cause);

  const body = { error: { code, message } };
  if (known && error.details !== undefined) body.error.details = error.details;
  res.status(status).json(body);
}
