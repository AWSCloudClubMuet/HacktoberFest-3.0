const test = require('node:test');
const assert = require('node:assert/strict');
const { ApiError, positiveInteger, requiredText } = require('./operations');

test('numeric API values must be positive safe integers', () => {
  assert.equal(positiveInteger('12', 'Quantity'), 12);
  for (const value of ['0', '-1', '1.5', 'not-a-number', '9007199254740992']) {
    assert.throws(() => positiveInteger(value, 'Quantity'), ApiError);
  }
  assert.equal(positiveInteger(0, 'Received quantity', 0), 0);
});

test('required strings are trimmed and bounded', () => {
  assert.equal(requiredText('  Sukkur warehouse  ', 'Source warehouse'), 'Sukkur warehouse');
  assert.throws(() => requiredText(' ', 'Driver'), /is required/);
  assert.throws(() => requiredText('x'.repeat(161), 'Driver'), /must not exceed/);
});
