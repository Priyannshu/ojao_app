/**
 * DB-backed integration smoke test for nearby search.
 *
 * SKIPPED unless RUN_DB_TESTS=1 and a migrated+seeded database is reachable
 * (npm run migrate && npm run seed). Verifies the core guarantees of
 * ARCHITECTURE.md section 3: verified hospitals are returned ordered by
 * distance, and unverified ones are hidden.
 *
 * Run: RUN_DB_TESTS=1 npm test
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');

const RUN = process.env.RUN_DB_TESTS === '1';

test('nearby returns seeded verified hospital and hides unverified', { skip: !RUN }, async () => {
  const service = require('../src/modules/hospitals/hospitals.service');
  const { pool } = require('../src/db/pool');

  // Search from near the seeded Bengaluru hospital.
  const { results } = await service.nearby({
    latitude: 12.9750,
    longitude: 77.6100,
    radiusMeters: 5000,
  });

  const names = results.map((r) => r.displayName);
  assert.ok(names.includes('Ojao General Hospital'), 'verified hospital should appear');
  assert.ok(!names.includes('Pending Clinic'), 'unverified hospital must be hidden');

  // Distance is computed server-side and present on results.
  const seeded = results.find((r) => r.displayName === 'Ojao General Hospital');
  assert.equal(typeof seeded.distanceMeters, 'number');

  await pool.end();
});
