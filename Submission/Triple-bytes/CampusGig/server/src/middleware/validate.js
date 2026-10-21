import { AppError } from "../lib/AppError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join(".") || "request"] = issue.message;
      }
      return next(new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid request data.",
        { fields },
      ));
    }
    req.validated = result.data;
    next();
  };
}
