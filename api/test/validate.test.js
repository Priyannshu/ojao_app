/**
 * Unit tests for the validation layer (no database required).
 * Run: npm test
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const validate = require('../src/lib/validate');

test('latitude accepts in-range and rejects out-of-range', () => {
  assert.equal(validate.latitude(12.97), 12.97);
  assert.equal(validate.latitude('-89.9'), -89.9);
  assert.throws(() => validate.latitude(91), /latitude/);
  assert.throws(() => validate.latitude(-90.1), /latitude/);
  assert.throws(() => validate.latitude('abc'), /number/);
});

test('longitude bounds enforced at +/-180', () => {
  assert.equal(validate.longitude(77.61), 77.61);
  assert.throws(() => validate.longitude(180.5), /longitude/);
  assert.throws(() => validate.longitude(-181), /longitude/);
});

test('radiusMeters clamps to max and falls back when missing', () => {
  assert.equal(validate.radiusMeters(undefined, 50000, 50000), 50000);
  assert.equal(validate.radiusMeters(999999, 50000, 50000), 50000); // clamped
  assert.equal(validate.radiusMeters(1500, 50000, 50000), 1500);
  assert.throws(() => validate.radiusMeters(0, 50000, 50000), /positive/);
});

test('limit clamps to max, requires positive integer', () => {
  assert.equal(validate.limit(undefined, 100, 20), 20);
  assert.equal(validate.limit(500, 100, 20), 100); // clamped
  assert.equal(validate.limit('10', 100, 20), 10);
  assert.throws(() => validate.limit(0, 100, 20), /positive integer/);
  assert.throws(() => validate.limit(1.5, 100, 20), /positive integer/);
});

test('offset defaults to 0 and rejects negatives', () => {
  assert.equal(validate.offset(undefined), 0);
  assert.equal(validate.offset('40'), 40);
  assert.throws(() => validate.offset(-1), /non-negative/);
});

test('phone accepts 10-15 digits with optional +', () => {
  assert.equal(validate.phone('9000000001'), '9000000001');
  assert.equal(validate.phone('+91 90000 00001'), '9000000001');
  assert.equal(validate.phone('919000000001'), '9000000001');
  assert.throws(() => validate.phone('123'), /10.15 digits/);
});

test('optionalEmail validates and lowercases, allows empty', () => {
  assert.equal(validate.optionalEmail(''), null);
  assert.equal(validate.optionalEmail('User@Example.COM'), 'user@example.com');
  assert.throws(() => validate.optionalEmail('nope'), /email/);
});
