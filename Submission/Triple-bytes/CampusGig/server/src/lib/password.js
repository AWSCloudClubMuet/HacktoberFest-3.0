import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const COST = { N: 16384, r: 8, p: 1 };

function encode(salt, hash) {
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, COST);
  return encode(salt, hash);
}

export function hashPasswordSync(password) {
  const salt = randomBytes(16);
  return encode(salt, scryptSync(password, salt, KEY_LENGTH, COST));
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;

  const [scheme, saltText, hashText] = stored.split(":");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;

  const expected = Buffer.from(hashText, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltText, "base64"), expected.length, COST);
  return timingSafeEqual(actual, expected);
}
