const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, createSessionToken, tokenHash, ROLES } = require('./security');

test('passwords are stored as salted scrypt hashes and verified safely', async () => {
  const password = 'A-long-test-password-2026';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.match(first, /^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect password', first), false);
  assert.equal(await verifyPassword(password, 'not-a-password-hash'), false);
  await assert.rejects(hashPassword('short'), /between 12 and 1024/);
});

test('session bearer tokens are random and only their hashes are stored', () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first.token, second.token);
  assert.equal(tokenHash(first.token), first.tokenHash);
  assert.notEqual(first.token, first.tokenHash);
  assert.equal(ROLES.length, 5);
  assert.ok(ROLES.includes('finance_audit_officer'));
});
