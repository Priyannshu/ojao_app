/**
 * Small server-side validation helpers.
 *
 * The API must validate every coordinate, radius, and pagination value
 * (ARCHITECTURE.md section 5). These return typed values or throw ApiError so
 * handlers stay declarative. No external dependency — the rules are simple and
 * explicit on purpose.
 */
const { badRequest } = require('./errors');

function num(value, field) {
  const n = typeof value === 'number' ? value : Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(n)) {
    throw badRequest(`${field} must be a number.`);
  }
  return n;
}

function latitude(value) {
  const n = num(value, 'latitude');
  if (n < -90 || n > 90) throw badRequest('latitude must be between -90 and 90.');
  return n;
}

function longitude(value) {
  const n = num(value, 'longitude');
  if (n < -180 || n > 180) throw badRequest('longitude must be between -180 and 180.');
  return n;
}

/** Radius clamped to [1, max]. Missing -> `fallback`. */
function radiusMeters(value, max, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = num(value, 'radiusMeters');
  if (n <= 0) throw badRequest('radiusMeters must be positive.');
  return Math.min(n, max);
}

/** Positive integer limit clamped to [1, max]. Missing -> `fallback`. */
function limit(value, max, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = num(value, 'limit');
  if (!Number.isInteger(n) || n < 1) throw badRequest('limit must be a positive integer.');
  return Math.min(n, max);
}

/** Non-negative integer offset. Missing -> 0. */
function offset(value) {
  if (value === undefined || value === '') return 0;
  const n = num(value, 'offset');
  if (!Number.isInteger(n) || n < 0) throw badRequest('offset must be a non-negative integer.');
  return n;
}

function requiredString(value, field, { min = 1, max = 2000 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw badRequest(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`${field} is too long.`);
  return trimmed;
}

function optionalString(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return null;
  return requiredString(value, field, { ...opts, min: 0 });
}

function phone(value, field = 'phone') {
  const raw = requiredString(value, field);
  let digits = raw.replace(/\D/g, '');
  // The product currently operates in India. Store local and +91 forms under
  // one identity so OTP, login, and reset cannot create duplicate accounts.
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (!/^\d{10,15}$/.test(digits)) {
    throw badRequest(`${field} must be 10–15 digits.`);
  }
  return digits;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function optionalEmail(value, field = 'email') {
  if (value === undefined || value === null || value === '') return null;
  const s = String(value).trim();
  if (!EMAIL_RE.test(s)) throw badRequest(`${field} is invalid.`);
  return s.toLowerCase();
}

module.exports = {
  num,
  latitude,
  longitude,
  radiusMeters,
  limit,
  offset,
  requiredString,
  optionalString,
  phone,
  optionalEmail,
};
