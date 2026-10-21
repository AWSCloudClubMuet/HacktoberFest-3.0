import { getSupabase } from "../config/supabaseClient.js";
import { AppError, databaseError } from "../lib/AppError.js";
import { hashPassword, hashPasswordSync, verifyPassword } from "../lib/password.js";
import { createRateLimiter } from "../lib/rateLimiter.js";
import { signToken } from "../lib/token.js";

export const PUBLIC_USER_FIELDS = "id,name,major,semester,bio,skills";

const loginLimiter = createRateLimiter({ max: 8, windowMs: 10 * 60_000 });
const signupLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60_000 });

const DUMMY_HASH = hashPasswordSync("not-a-real-password");

const emailTaken = () => new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.");

export async function signup(input, ip) {
  if (signupLimiter.isBlocked(ip)) {
    throw new AppError(429, "TOO_MANY_ATTEMPTS", "Too many attempts. Please try again later.");
  }
  signupLimiter.record(ip);

  const db = getSupabase();

  const { data: existing, error: lookupError } = await db
    .from("users").select("id").eq("email", input.email).maybeSingle();
  if (lookupError) throw databaseError(lookupError);
  if (existing) throw emailTaken();

  const { data: user, error } = await db.from("users").insert({
    name: input.name,
    email: input.email,
    password_hash: await hashPassword(input.password),
    major: input.major,
    semester: input.semester,
    bio: input.bio || null,
    skills: [...new Set(input.skills ?? [])],
  }).select(PUBLIC_USER_FIELDS).single();

  if (error?.code === "23505") throw emailTaken();
  if (error) throw databaseError(error);

  return { token: await signToken(user.id), user: { ...user, email: input.email } };
}

export async function login({ email, password }, ip) {
  const attemptKey = `${ip}|${email}`;
  if (loginLimiter.isBlocked(attemptKey)) {
    throw new AppError(429, "TOO_MANY_ATTEMPTS", "Too many attempts. Please try again in a few minutes.");
  }

  const { data: account, error } = await getSupabase()
    .from("users")
    .select(`${PUBLIC_USER_FIELDS},email,password_hash`)
    .eq("email", email)
    .maybeSingle();
  if (error) throw databaseError(error);

  const passwordMatches = await verifyPassword(password, account?.password_hash ?? DUMMY_HASH);
  if (!account?.password_hash || !passwordMatches) {
    loginLimiter.record(attemptKey);
    throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  loginLimiter.clear(attemptKey);
  const { password_hash: _hash, ...user } = account;
  return { token: await signToken(user.id), user };
}
