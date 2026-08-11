/**
 * Firebase Admin SDK — lazy singleton for the hybrid bridge.
 *
 * The API's primary store is Postgres. During migration we ALSO mirror approved
 * hospitals into Firestore (the store the mobile app still reads) so a hospital
 * onboarded through the admin panel appears in the app. This module owns that
 * one Firebase connection.
 *
 * It is intentionally optional: if FIRESTORE_SYNC_ENABLED is false or no
 * credentials are configured, `db()` returns null and every sync becomes a
 * no-op. The API must run fine without Firebase (e.g. local dev, CI).
 */
const config = require('../config');

let app = null;
let firestore = null;
let initTried = false;

/** True when sync is switched on and credentials are configured. */
function isEnabled() {
  return config.firestoreSync.enabled && !!config.firestoreSync.credentialsPath;
}

/** Returns a Firestore instance, or null if sync is disabled/unavailable. */
function db() {
  if (!isEnabled()) return null;
  if (firestore) return firestore;
  if (initTried) return firestore; // don't retry a failed init every call

  initTried = true;
  try {
    // Required lazily so environments without firebase-admin installed still run.
    // eslint-disable-next-line global-require
    const admin = require('firebase-admin');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const credential = admin.credential.cert(require(config.firestoreSync.credentialsPath));
    app = admin.initializeApp(
      config.firestoreSync.projectId
        ? { credential, projectId: config.firestoreSync.projectId }
        : { credential },
      'firestore-sync',
    );
    firestore = admin.firestore(app);
    console.log('Firestore sync initialized.');
  } catch (err) {
    console.error('Firestore sync init failed; hospital mirroring is OFF:', err.message);
    firestore = null;
  }
  return firestore;
}

module.exports = { isEnabled, db };
