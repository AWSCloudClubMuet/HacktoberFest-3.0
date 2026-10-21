import { z } from "zod";
import { AppError } from "../lib/AppError.js";

const uuid = z.guid();

export function validateId(param = "id") {
  return (req, _res, next) => {
    if (!uuid.safeParse(req.params[param]).success) {
      return next(new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid path parameter.",
        { fields: { [param]: "Must be a valid UUID." } },
      ));
    }
    next();
  };
}
