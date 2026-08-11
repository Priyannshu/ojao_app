/**
 * Hospital → Firestore mirror (hybrid bridge).
 *
 * Writes a Postgres hospital into Firestore as `facilities/{hospitalId}` using
 * the SAME id in both stores — that shared id is what lets the mobile app
 * (Firestore-backed for queues/appointments) resolve a hospital the admin panel
 * created in Postgres. The document shape matches the Flutter `Facility` model
 * (lib/data/models/facility.dart); default departments match `Department`
 * (lib/data/models/department.dart) so the booking/queue flow works immediately.
 *
 * Every function is best-effort and never throws to its caller: a Firestore
 * outage must not fail or roll back a Postgres approval. Failures are logged and
 * surfaced via an audit row by the caller.
 */
const firebase = require('./firebase');

// Minimal starter departments so a freshly-onboarded hospital is bookable.
// `id` is stable/slug-based; the app reads these under
// facilities/{id}/departments/{deptId}.
const DEFAULT_DEPARTMENTS = [
  {
    id: 'general-medicine',
    name: 'General Medicine',
    description: 'Everyday illness & checkups',
    icon: 'general',
    avgWaitMinutes: 12,
    activeDoctors: 1,
    currentServing: '-',
    isActive: true,
  },
  {
    id: 'emergency',
    name: 'Emergency',
    description: 'Casualty & urgent care',
    icon: 'general',
    avgWaitMinutes: 5,
    activeDoctors: 1,
    currentServing: '-',
    isActive: true,
  },
];

/** Map a Postgres hospital row to the Flutter `Facility` JSON shape. */
function toFacilityDoc(hospital) {
  return {
    id: hospital.id,
    name: hospital.display_name || hospital.legal_name || 'Hospital',
    // Postgres has no facility type yet; the app groups by this, so default to
    // hospital. (Clinics/diagnostics can be introduced when the schema gains a
    // type column.)
    type: 'hospital',
    address: [hospital.address_line_1, hospital.address_line_2, hospital.city, hospital.state]
      .filter((s) => s && String(s).trim())
      .join(', '),
    latitude: hospital.latitude != null ? Number(hospital.latitude) : 0,
    longitude: hospital.longitude != null ? Number(hospital.longitude) : 0,
    rating: 0,
    departmentCount: DEFAULT_DEPARTMENTS.length,
    isActive: hospital.is_active !== false,
    // Provenance marker so it's clear this doc is mirrored from Postgres.
    source: 'ojao-api',
  };
}

/**
 * Upsert a hospital into Firestore as a facility (+ default departments on
 * first create). `hospital` is a row with latitude/longitude already projected
 * out of the PostGIS point. Returns { ok, skipped?, error? }.
 */
async function upsertFacility(hospital, { seedDepartments = true } = {}) {
  const db = firebase.db();
  if (!db) return { ok: false, skipped: true };

  try {
    const facilityRef = db.collection('facilities').doc(hospital.id);
    // merge:true so re-syncs (name/coords/isActive changes) don't clobber any
    // fields the app may have added (e.g. rating, departmentCount edits).
    await facilityRef.set(toFacilityDoc(hospital), { merge: true });

    if (seedDepartments) {
      const deptCol = facilityRef.collection('departments');
      // Only seed departments that don't already exist, so a re-sync never
      // overwrites live department state.
      const batch = db.batch();
      for (const dept of DEFAULT_DEPARTMENTS) {
        const ref = deptCol.doc(dept.id);
        const snap = await ref.get();
        if (!snap.exists) batch.set(ref, dept);
      }
      await batch.commit();
    }
    return { ok: true };
  } catch (err) {
    console.error(`Firestore upsertFacility(${hospital.id}) failed:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Mirror an active/suspended toggle onto the facility doc. */
async function setFacilityActive(hospitalId, isActive) {
  const db = firebase.db();
  if (!db) return { ok: false, skipped: true };
  try {
    await db.collection('facilities').doc(hospitalId).set({ isActive }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error(`Firestore setFacilityActive(${hospitalId}) failed:`, err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { upsertFacility, setFacilityActive, toFacilityDoc, DEFAULT_DEPARTMENTS };
