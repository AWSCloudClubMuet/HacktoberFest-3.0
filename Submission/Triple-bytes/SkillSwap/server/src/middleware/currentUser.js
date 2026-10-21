import { getSupabase } from "../config/supabaseClient.js";
import { AppError, databaseError } from "../lib/AppError.js";
import { verifyToken } from "../lib/token.js";
import { PUBLIC_USER_FIELDS } from "../services/authService.js";

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map();

function bearerToken(req) {
  const [scheme, token] = (req.get("Authorization") || "").split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export async function currentUser(req, _res, next) {
  try {
    const token = bearerToken(req);
    const userId = token ? await verifyToken(token) : null;
    if (!userId) throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");

    const hit = cache.get(userId);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      req.user = hit.user;
      return next();
    }

    const { data, error } = await getSupabase()
      .from("users")
      .select(`${PUBLIC_USER_FIELDS},email`)
      .eq("id", userId)
      .maybeSingle();

    if (error) throw databaseError(error);
    if (!data) throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");

    cache.set(userId, { at: Date.now(), user: data });
    req.user = data;
    next();
  } catch (error) {
    next(error);
  }
}
