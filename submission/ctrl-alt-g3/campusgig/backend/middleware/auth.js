import { findUser } from "../services/userService.js";
import { unauthorized } from "../services/errors.js";

// Reads the acting user from the x-user-id header and attaches it to req.user
export function requireUser(req, res, next) {
  const id = req.header("x-user-id");
  if (!id) throw unauthorized("Missing x-user-id header (choose a user first)");

  const user = findUser(id);
  if (!user) throw unauthorized("x-user-id does not match any user");

  req.user = user;
  next();
}