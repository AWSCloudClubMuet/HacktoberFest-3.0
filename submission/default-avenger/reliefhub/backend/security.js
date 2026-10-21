const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(scryptCallback);

const ROLES = Object.freeze([
  'system_administrator',
  'relief_coordinator',
  'warehouse_manager',
  'field_volunteer',
  'finance_audit_officer',
]);

async function hashPassword(password, { minimumLength = 12 } = {}) {
  if (typeof password !== 'string' || password.length < minimumLength || password.length > 1024) {
    throw new Error(`Password must be between ${minimumLength} and 1024 characters.`);
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false;
  const [algorithm, saltText, keyText, extra] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !keyText || extra !== undefined) return false;
  try {
    const expected = Buffer.from(keyText, 'base64url');
    if (expected.length !== 64) return false;
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function createSessionToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') };
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

module.exports = { ROLES, hashPassword, verifyPassword, createSessionToken, tokenHash };
