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
// All documents are written under clinics/main/<collection>/<docId> to match
// FirestorePaths in the Flutter app.

const path = require('path');
const data = require('./seed_data');

const DRY_RUN = process.argv.includes('--dry-run');
// firebase-admin is only needed for a real write; keep dry-run dependency-free.
const admin = DRY_RUN ? null : require('firebase-admin');

const CLINIC_ROOT = 'clinics/main';

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

async function main() {
  if (!DRY_RUN) {
    admin.initializeApp({ credential: loadCredential() });
  }
  const db = DRY_RUN ? null : admin.firestore();

  // collection name -> { docId: docData }
  const collections = {
    departments: data.departments,
    analytics: data.analytics,
    tokens: data.tokens,
    appointments: data.appointments,
  };

  let total = 0;
  for (const [collection, docs] of Object.entries(collections)) {
    const entries = Object.entries(docs);
    console.log(`\n${collection}: ${entries.length} docs`);
    if (DRY_RUN) {
      for (const [docId] of entries) {
        console.log(`  would write ${CLINIC_ROOT}/${collection}/${docId}`);
      }
      total += entries.length;
      continue;
    }

    // Batched writes (Firestore caps a batch at 500 ops).
    let batch = db.batch();
    let ops = 0;
    for (const [docId, docData] of entries) {
      const ref = db.doc(`${CLINIC_ROOT}/${collection}/${docId}`);
      batch.set(ref, docData, { merge: true });
      ops++;
      total++;
      if (ops === 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();
    console.log(`  wrote ${entries.length} docs`);
  }

  console.log(
    `\n${DRY_RUN ? 'Dry run complete' : 'Seed complete'}: ${total} documents ` +
      `under ${CLINIC_ROOT}/`,
  );
  if (!DRY_RUN) process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
