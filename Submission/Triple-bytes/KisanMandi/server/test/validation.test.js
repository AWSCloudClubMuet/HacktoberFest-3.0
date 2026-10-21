import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAlert, validateListing, validateUser } from '../src/utils/validation.js';

test('accepts a valid user', () => {
  assert.deepEqual(validateUser({ name: ' Ali ', phone: '03001234567', district: ' Hyderabad ', role: 'Farmer' }), {
    name: 'Ali', phone: '03001234567', district: 'Hyderabad', role: 'Farmer',
  });
});

test('rejects an invalid phone number', () => {
  assert.throws(() => validateUser({ name: 'Ali', phone: '123', district: 'Hyderabad', role: 'Farmer' }),
    (error) => error.status === 400 && Boolean(error.fields.phone));
});

test('accepts valid listing and alert payloads', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  assert.equal(validateListing({ crop_id: 1, quantity: 5, asking_price: 4000, district: 'Sukkur', grade: 'A', available_from: tomorrow, contact_phone: '03111234567' }).crop_id, 1);
  assert.equal(validateAlert({ crop_id: 1, market_id: 2, condition: 'Above', target_price: 5000 }).condition, 'Above');
});
