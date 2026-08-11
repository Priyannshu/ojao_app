/**
 * Backfill: mirror existing verified Postgres hospitals into Firestore.
 *
 * Run once after enabling the hybrid bridge so hospitals approved before the
 * sync existed also appear in the mobile app. Idempotent (merge writes; only
 * missing default departments are seeded).
 *
 *   FIRESTORE_SYNC_ENABLED=true FIREBASE_CREDENTIALS=/path/sa.json \
 *     npm run backfill:firestore
 */
const { pool, query } = require('../db/pool');
const firebase = require('../lib/firebase');
const firestoreSync = require('../lib/firestoreSync');

async function main() {
  if (!firebase.isEnabled()) {
    console.error('Firestore sync is disabled. Set FIRESTORE_SYNC_ENABLED=true and FIREBASE_CREDENTIALS.');
    process.exitCode = 1;
    return;
  }

  const { rows } = await query(
    `SELECT id, legal_name, display_name, phone, address_line_1, address_line_2,
            city, state, is_active,
            ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude
       FROM hospitals
      WHERE is_verified = true
      ORDER BY created_at ASC`,
  );
  console.log(`Backfilling ${rows.length} verified hospital(s) to Firestore...`);

  let ok = 0;
  let failed = 0;
  for (const hospital of rows) {
    const res = await firestoreSync.upsertFacility(hospital);
    if (res.ok) {
      ok += 1;
      console.log(`  ✓ ${hospital.display_name} (${hospital.id})`);
    } else {
      failed += 1;
      console.log(`  ✗ ${hospital.display_name} (${hospital.id}): ${res.error || 'skipped'}`);
    }
  }
  console.log(`Done. ${ok} synced, ${failed} failed.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});
