import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-hs256";

const { hashPassword, verifyPassword } = await import("../src/lib/password.js");
const { signToken, verifyToken } = await import("../src/lib/token.js");
const { createRateLimiter } = await import("../src/lib/rateLimiter.js");
const { loginSchema, signupSchema } = await import("../src/schemas/authSchemas.js");

const validSignup = {
  name: "Nadia Khan",
  email: "Nadia@Campus.edu ",
  password: "Strong#Pass1",
  major: "Computer Science",
  semester: 3,
};

test("a password verifies only against its own hash", async () => {
  const hash = await hashPassword("Campus@123");
  assert.equal(await verifyPassword("Campus@123", hash), true);
  assert.equal(await verifyPassword("Campus@124", hash), false);
  assert.notEqual(hash, await hashPassword("Campus@123"));
});

test("a malformed stored hash never verifies", async () => {
  assert.equal(await verifyPassword("anything", null), false);
  assert.equal(await verifyPassword("anything", "plain-text"), false);
});

test("a signed token returns its user id and rejects tampering", async () => {
  const token = await signToken("user-1");
  assert.equal(await verifyToken(token), "user-1");
  assert.equal(await verifyToken(`${token}x`), null);
  assert.equal(await verifyToken("not-a-token"), null);
});

test("signup normalises the email and accepts valid input", () => {
  const result = signupSchema.safeParse(validSignup);
  assert.equal(result.success, true);
  assert.equal(result.data.email, "nadia@campus.edu");
});

test("signup rejects weak or invalid fields", () => {
  const fields = (patch) => {
    const result = signupSchema.safeParse({ ...validSignup, ...patch });
    return result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
  };
  assert.deepEqual(fields({ password: "short" }), ["password"]);
  assert.deepEqual(fields({ email: "not-an-email" }), ["email"]);
  assert.deepEqual(fields({ semester: 13 }), ["semester"]);
  assert.deepEqual(fields({ name: "A" }), ["name"]);
  assert.deepEqual(fields({ skills: Array(11).fill("React") }), ["skills"]);
});

test("signup rejects unknown fields so nobody can set their own id", () => {
  assert.equal(signupSchema.safeParse({ ...validSignup, id: "x" }).success, false);
});

test("login requires an email and a password", () => {
  assert.equal(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "", password: "x" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "a@b.co" }).success, false);
});

test("the rate limiter blocks after the limit and can be cleared", () => {
  const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
  limiter.record("a");
  assert.equal(limiter.isBlocked("a"), false);
  limiter.record("a");
  assert.equal(limiter.isBlocked("a"), true);
  assert.equal(limiter.isBlocked("b"), false);
  limiter.clear("a");
  assert.equal(limiter.isBlocked("a"), false);
});
