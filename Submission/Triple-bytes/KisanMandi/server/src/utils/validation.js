import { validationError } from './errors.js';

const PHONE_RE = /^03\d{9}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

export function parsePositiveInteger(value, field) {
  if (!isPositiveInteger(value)) throw validationError({ [field]: 'Must be a positive integer' });
  return Number(value);
}

export function todayDate() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isValidDate(value) {
  if (!DATE_RE.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateUser(body = {}) {
  const fields = {};
  if (!String(body.name ?? '').trim()) fields.name = 'Name is required';
  if (!PHONE_RE.test(String(body.phone ?? ''))) fields.phone = 'Must be 11 digits starting with 03';
  if (!String(body.district ?? '').trim()) fields.district = 'District is required';
  if (!['Farmer', 'Buyer'].includes(body.role)) fields.role = 'Must be Farmer or Buyer';
  if (Object.keys(fields).length) throw validationError(fields);
  return {
    name: String(body.name).trim(),
    phone: String(body.phone),
    district: String(body.district).trim(),
    role: body.role,
  };
}

export function validateListing(body = {}) {
  const fields = {};
  if (!(Number(body.quantity) > 0)) fields.quantity = 'Must be greater than 0';
  if (!(Number(body.asking_price) > 0)) fields.asking_price = 'Must be greater than 0';
  if (!['A', 'B', 'C'].includes(body.grade)) fields.grade = 'Must be A, B or C';
  if (!isValidDate(body.available_from)) fields.available_from = 'Must be a valid date';
  else if (body.available_from < todayDate()) fields.available_from = 'Cannot be in the past';
  if (!PHONE_RE.test(String(body.contact_phone ?? ''))) fields.contact_phone = 'Must be 11 digits starting with 03';
  if (!isPositiveInteger(body.crop_id)) fields.crop_id = 'A valid crop is required';
  if (!String(body.district ?? '').trim()) fields.district = 'District is required';
  if (Object.keys(fields).length) throw validationError(fields);
  return {
    crop_id: Number(body.crop_id),
    quantity: Number(body.quantity),
    asking_price: Number(body.asking_price),
    district: String(body.district).trim(),
    grade: body.grade,
    available_from: body.available_from,
    contact_phone: String(body.contact_phone),
  };
}

export function validateAlert(body = {}) {
  const fields = {};
  if (!isPositiveInteger(body.crop_id)) fields.crop_id = 'A valid crop is required';
  if (!isPositiveInteger(body.market_id)) fields.market_id = 'A valid market is required';
  if (!['Above', 'Below'].includes(body.condition)) fields.condition = 'Must be Above or Below';
  if (!(Number(body.target_price) > 0)) fields.target_price = 'Must be greater than 0';
  if (Object.keys(fields).length) throw validationError(fields);
  return {
    crop_id: Number(body.crop_id),
    market_id: Number(body.market_id),
    condition: body.condition,
    target_price: Number(body.target_price),
  };
}
