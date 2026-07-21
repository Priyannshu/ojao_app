#!/usr/bin/env node
// Uploads the ojao seed dataset to Firestore using the Firebase Admin SDK.
//
// Usage:
//   1. Firebase console -> Project settings -> Service accounts ->
//      "Generate new private key". Save the file as serviceAccount.json
//      in this folder (it is gitignored; never commit it).
//   2. npm install
//   3. node seed_firestore.js            # write the data
//      node seed_firestore.js --dry-run  # print what would be written
//
// The app is multi-facility, so every document is written beneath the facility
// that owns it, to match FirestorePaths in the Flutter app:
//   facilities/{facilityId}
//   facilities/{facilityId}/{departments|tokens|appointments}/{docId}
//   facilities/{facilityId}/analytics/current

const path = require('path');
const data = require('./seed_data');

const DRY_RUN = process.argv.includes('--dry-run');
// firebase-admin is only needed for a real write; keep dry-run dependency-free.
const admin = DRY_RUN ? null : require('firebase-admin');

function loadCredential() {
  const saPath = path.join(__dirname, 'serviceAccount.json');
  try {
    return admin.credential.cert(require(saPath));
  } catch (_) {
    console.error(
      '\nMissing serviceAccount.json in the seed/ folder.\n' +
        'Firebase console -> Project settings -> Service accounts ->\n' +
        'Generate new private key, save it here as serviceAccount.json.\n',
    );
    process.exit(1);
  }
}

// Yields every { path, data } document to write for one facility.
function* facilityDocuments(facilityId, bundle) {
  const root = `facilities/${facilityId}`;
  yield { path: root, data: bundle.facility };
  for (const [id, doc] of Object.entries(bundle.departments)) {
    yield { path: `${root}/departments/${id}`, data: doc };
  }
  for (const [id, doc] of Object.entries(bundle.analytics)) {
    yield { path: `${root}/analytics/${id}`, data: doc };
  }
  for (const [id, doc] of Object.entries(bundle.tokens)) {
    yield { path: `${root}/tokens/${id}`, data: doc };
  }
  for (const [id, doc] of Object.entries(bundle.appointments)) {
    yield { path: `${root}/appointments/${id}`, data: doc };
  }
}

async function main() {
  if (!DRY_RUN) {
    admin.initializeApp({ credential: loadCredential() });
  }
  const db = DRY_RUN ? null : admin.firestore();

  const facilityDocs = data.facilityDocs;
  const facilityCount = Object.keys(facilityDocs).length;
  console.log(`\nSeeding ${facilityCount} facilities...`);

  let total = 0;
  let batch = DRY_RUN ? null : db.batch();
  let ops = 0;

  for (const [facilityId, bundle] of Object.entries(facilityDocs)) {
    let facilityTotal = 0;
    for (const { path: docPath, data: docData } of facilityDocuments(facilityId, bundle)) {
      total++;
      facilityTotal++;
      if (DRY_RUN) {
        console.log(`  would write ${docPath}`);
        continue;
      }
      batch.set(db.doc(docPath), docData, { merge: true });
      ops++;
      if (ops === 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    console.log(`  ${bundle.facility.name} (${facilityId}): ${facilityTotal} docs`);
  }

  if (!DRY_RUN && ops > 0) await batch.commit();

  console.log(
    `\n${DRY_RUN ? 'Dry run complete' : 'Seed complete'}: ${total} documents ` +
      `across ${facilityCount} facilities.`,
  );
  if (!DRY_RUN) process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
