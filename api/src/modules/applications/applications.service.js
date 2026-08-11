/**
 * Hospital application + verification service (ARCHITECTURE.md sections 3, 7).
 *
 * Flow:
 *   1. A signed-in user submits a hospital application (PENDING).
 *   2. They may attach document references (object-storage keys — never the
 *      raw files; storage uses private buckets + signed URLs, section 5).
 *   3. A PLATFORM_ADMIN reviews the queue and approves or rejects.
 *   4. On approval, a hospitals row is created (is_active + is_verified), the
 *      applicant becomes its HOSPITAL_ADMIN, and every decision is audited.
 *
 * Clients never set is_verified / is_active / role — those are server-owned.
 */
const { pool, query, withTransaction } = require('../../db/pool');
const { notFound, forbidden, badRequest, conflict } = require('../../lib/errors');
const validate = require('../../lib/validate');
const audit = require('../../lib/audit');
const firestoreSync = require('../../lib/firestoreSync');

function toApplication(row) {
  return {
    id: row.id,
    applicantUserId: row.applicant_user_id,
    hospitalName: row.hospital_name,
    submittedAddress: row.submitted_address,
    submittedPhone: row.submitted_phone,
    submittedDocuments: row.submitted_documents,
    status: row.status,
    reviewNotes: row.review_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    hospitalId: row.hospital_id,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
  };
}

const SELECT_APP = `
  id, applicant_user_id, hospital_name, submitted_address, submitted_phone,
  submitted_documents, status, review_notes, reviewed_by, reviewed_at, hospital_id,
  ST_Y(submitted_location::geometry) AS latitude,
  ST_X(submitted_location::geometry) AS longitude,
  created_at`;

/** A signed-in user submits an application to onboard a hospital. */
async function create(body, applicantUserId) {
  const hospitalName = validate.requiredString(body.hospitalName, 'hospitalName', { min: 2, max: 200 });
  const submittedAddress = validate.optionalString(body.submittedAddress, 'submittedAddress', { max: 500 });
  const submittedPhone = body.submittedPhone ? validate.phone(body.submittedPhone, 'submittedPhone') : null;
  const documents = Array.isArray(body.submittedDocuments) ? body.submittedDocuments : [];

  let lat = null;
  let lng = null;
  if (body.latitude !== undefined || body.longitude !== undefined) {
    lat = validate.latitude(body.latitude);
    lng = validate.longitude(body.longitude);
  }

  return withTransaction(async (client) => {
    // Serialize submissions for one applicant. A row lock cannot protect the
    // first submission because there is no application row to lock yet.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [applicantUserId]);
    const existing = await client.query(
      `SELECT id, status FROM hospital_applications
        WHERE applicant_user_id = $1
        ORDER BY created_at DESC FOR UPDATE`,
      [applicantUserId],
    );
    const previous = existing.rows[0];
    if (existing.rows.some((application) => application.status === 'APPROVED')) {
      throw conflict('Your hospital application is already approved.');
    }
    if (previous?.status === 'PENDING') {
      throw conflict('You already have an application under review.');
    }
    if (previous && previous.status !== 'REJECTED') {
      throw conflict('This application is not eligible for resubmission.');
    }

    const { rows } = await client.query(
      `INSERT INTO hospital_applications
         (applicant_user_id, hospital_name, submitted_address, submitted_phone,
          submitted_documents, submitted_location)
       VALUES ($1, $2, $3, $4, $5::jsonb,
               CASE WHEN $6::float8 IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography END)
       RETURNING ${SELECT_APP}`,
      [applicantUserId, hospitalName, submittedAddress, submittedPhone, JSON.stringify(documents), lng, lat],
    );
    await audit.record(client, {
      actorUserId: applicantUserId,
      action: previous ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED',
      entityType: 'hospital_application',
      entityId: rows[0].id,
      metadata: previous ? { previousApplicationId: previous.id } : undefined,
    });
    return toApplication(rows[0]);
  });
}

/** Latest application for the signed-in applicant, or null before submission. */
async function getLatestForApplicant(applicantUserId) {
  const { rows } = await query(
    `SELECT ${SELECT_APP} FROM hospital_applications
      WHERE applicant_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [applicantUserId],
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

/** Fetch one application. Applicants see their own; platform admins see any. */
async function getById(applicationId, requester) {
  const { rows } = await query(`SELECT ${SELECT_APP} FROM hospital_applications WHERE id = $1`, [applicationId]);
  const app = rows[0];
  if (!app) throw notFound('Application not found.');
  if (requester.role !== 'PLATFORM_ADMIN' && app.applicant_user_id !== requester.id) {
    throw forbidden();
  }
  return toApplication(app);
}

/** Attach a stored-document reference to an application the caller owns. */
async function addDocument(applicationId, body, requester) {
  const storageKey = validate.requiredString(body.storageKey, 'storageKey', { max: 500 });
  const label = validate.optionalString(body.label, 'label', { max: 200 });

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT applicant_user_id, status FROM hospital_applications WHERE id = $1 FOR UPDATE',
      [applicationId],
    );
    const app = rows[0];
    if (!app) throw notFound('Application not found.');
    if (requester.role !== 'PLATFORM_ADMIN' && app.applicant_user_id !== requester.id) throw forbidden();
    if (app.status !== 'PENDING') throw conflict('This application can no longer be edited.');

    const doc = { storageKey, label, addedAt: new Date().toISOString() };
    const { rows: updated } = await client.query(
      `UPDATE hospital_applications
          SET submitted_documents = submitted_documents || $2::jsonb, updated_at = now()
        WHERE id = $1
        RETURNING ${SELECT_APP}`,
      [applicationId, JSON.stringify([doc])],
    );
    await audit.record(client, {
      actorUserId: requester.id,
      action: 'APPLICATION_DOCUMENT_ADDED',
      entityType: 'hospital_application',
      entityId: applicationId,
      metadata: { label },
    });
    return toApplication(updated[0]);
  });
}

// --- Admin surface --------------------------------------------------------

/** Paginated review queue, optionally filtered by status. */
async function list({ status, limit, offset }) {
  const clean = { limit: validate.limit(limit, 100, 20), offset: validate.offset(offset) };
  const params = [];
  let where = '';
  if (status) {
    if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      throw badRequest('Invalid status filter.');
    }
    params.push(status);
    where = `WHERE status = $${params.length}`;
  }
  params.push(clean.limit, clean.offset);
  const { rows } = await query(
    `SELECT ${SELECT_APP} FROM hospital_applications ${where}
      ORDER BY created_at ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { results: rows.map(toApplication), pagination: clean };
}

/**
 * Approve an application: create the hospital, link the applicant as its
 * HOSPITAL_ADMIN, mark the application APPROVED — all atomically + audited.
 */
async function approve(applicationId, adminUserId, body = {}) {
  const reviewNotes = validate.optionalString(body.reviewNotes, 'reviewNotes', { max: 1000 });

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT *, ST_Y(submitted_location::geometry) AS lat, ST_X(submitted_location::geometry) AS lng
         FROM hospital_applications WHERE id = $1 FOR UPDATE`,
      [applicationId],
    );
    const app = rows[0];
    if (!app) throw notFound('Application not found.');
    if (app.status !== 'PENDING') throw conflict(`Application is already ${app.status}.`);

    const { rows: hosp } = await client.query(
      `INSERT INTO hospitals
         (legal_name, display_name, phone, address_line_1, location,
          is_active, is_verified, verified_at)
       VALUES ($1, $1, $2, $3,
               CASE WHEN $4::float8 IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography END,
               true, true, now())
       RETURNING id, legal_name, display_name, phone, address_line_1, address_line_2,
                 city, state, is_active,
                 ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude`,
      [app.hospital_name, app.submitted_phone, app.submitted_address, app.lng, app.lat],
    );
    const hospital = hosp[0];
    const hospitalId = hospital.id;

    await client.query(
      `INSERT INTO hospital_admins (user_id, hospital_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [app.applicant_user_id, hospitalId],
    );
    // Elevate the applicant's role if they were a plain USER.
    await client.query(
      `UPDATE users SET role = 'HOSPITAL_ADMIN', updated_at = now()
        WHERE id = $1 AND role = 'USER'`,
      [app.applicant_user_id],
    );
    await client.query(
      `UPDATE hospital_applications
          SET status = 'APPROVED', review_notes = $2, reviewed_by = $3,
              reviewed_at = now(), hospital_id = $4, updated_at = now()
        WHERE id = $1`,
      [applicationId, reviewNotes, adminUserId, hospitalId],
    );
    await audit.record(client, {
      actorUserId: adminUserId,
      action: 'APPLICATION_APPROVED',
      entityType: 'hospital_application',
      entityId: applicationId,
      metadata: { hospitalId },
    });
    return { applicationId, hospitalId, status: 'APPROVED', hospital };
  });

  // Hybrid bridge: mirror the newly-created hospital into Firestore so the
  // mobile app sees it. Post-commit + best-effort — a Firestore failure must
  // not undo the approval, but we record it so it can be re-synced.
  const sync = await firestoreSync.upsertFacility(result.hospital);
  if (sync && sync.ok === false && !sync.skipped) {
    await audit.record(pool, {
      actorUserId: adminUserId,
      action: 'FIRESTORE_SYNC_FAILED',
      entityType: 'hospital',
      entityId: result.hospitalId,
      metadata: { error: sync.error, op: 'approve' },
    }).catch(() => {});
  }

  return { applicationId: result.applicationId, hospitalId: result.hospitalId, status: result.status };
}

/** Reject an application with required reviewer notes. */
async function reject(applicationId, adminUserId, body = {}) {
  const reviewNotes = validate.requiredString(body.reviewNotes, 'reviewNotes', { min: 3, max: 1000 });

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT status FROM hospital_applications WHERE id = $1 FOR UPDATE',
      [applicationId],
    );
    const app = rows[0];
    if (!app) throw notFound('Application not found.');
    if (app.status !== 'PENDING') throw conflict(`Application is already ${app.status}.`);

    await client.query(
      `UPDATE hospital_applications
          SET status = 'REJECTED', review_notes = $2, reviewed_by = $3,
              reviewed_at = now(), updated_at = now()
        WHERE id = $1`,
      [applicationId, reviewNotes, adminUserId],
    );
    await audit.record(client, {
      actorUserId: adminUserId,
      action: 'APPLICATION_REJECTED',
      entityType: 'hospital_application',
      entityId: applicationId,
      metadata: { reviewNotes },
    });
    return { applicationId, status: 'REJECTED' };
  });
}

/** Suspend or reactivate a hospital (platform admin); audited. */
async function setHospitalActive(hospitalId, isActive, adminUserId, body = {}) {
  const reason = validate.optionalString(body.reason, 'reason', { max: 1000 });
  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE hospitals SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [hospitalId, isActive],
    );
    if (!rows[0]) throw notFound('Hospital not found.');
    await audit.record(client, {
      actorUserId: adminUserId,
      action: isActive ? 'HOSPITAL_REACTIVATED' : 'HOSPITAL_SUSPENDED',
      entityType: 'hospital',
      entityId: hospitalId,
      metadata: { reason },
    });
  });

  // Bridge: reflect the active state on the Firestore facility so the app
  // hides a suspended hospital. Best-effort.
  await firestoreSync.setFacilityActive(hospitalId, isActive);

  return { hospitalId, isActive };
}

module.exports = {
  create,
  getLatestForApplicant,
  getById,
  addDocument,
  list,
  approve,
  reject,
  setHospitalActive,
};
