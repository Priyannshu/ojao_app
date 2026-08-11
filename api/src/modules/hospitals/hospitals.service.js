/**
 * Hospital discovery + profile service (ARCHITECTURE.md sections 3, 4, 7).
 *
 * The authoritative distance calculation lives here, in the backend, using
 * PostGIS — the client no longer sorts by distance. Nearby search:
 *   - filters to is_active = true AND is_verified = true only,
 *   - uses ST_DWithin for the radius filter (index-friendly),
 *   - orders by ST_Distance,
 *   - returns bounded, paginated results with only client-needed fields,
 *   - never logs exact patient coordinates (section 5).
 */
const { query, withTransaction } = require('../../db/pool');
const { notFound, badRequest } = require('../../lib/errors');
const validate = require('../../lib/validate');
const audit = require('../../lib/audit');
const config = require('../../config');

/** Columns the mobile app is allowed to see for a search result. */
const CARD_COLUMNS = `
  id, display_name, description, phone, emergency_phone,
  address_line_1, address_line_2, city, state, postal_code, country,
  emergency_available,
  ST_Y(location::geometry) AS latitude,
  ST_X(location::geometry) AS longitude`;

function toCard(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    description: row.description,
    phone: row.phone,
    emergencyPhone: row.emergency_phone,
    address: {
      line1: row.address_line_1,
      line2: row.address_line_2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
    },
    emergencyAvailable: row.emergency_available,
    latitude: row.latitude,
    longitude: row.longitude,
    // Present only on nearby results.
    distanceMeters: row.distance_meters !== undefined ? Math.round(row.distance_meters) : undefined,
  };
}

/**
 * Nearby verified hospitals ordered by distance.
 * @param {{latitude, longitude, radiusMeters?, limit?, offset?}} params
 */
async function nearby(params) {
  const lat = validate.latitude(params.latitude);
  const lng = validate.longitude(params.longitude);
  const radius = validate.radiusMeters(params.radiusMeters, config.nearby.maxRadiusMeters, config.nearby.maxRadiusMeters);
  const limit = validate.limit(params.limit, config.nearby.maxLimit, config.nearby.defaultLimit);
  const offset = validate.offset(params.offset);

  // PostGIS point is (longitude, latitude). geography => distances in meters.
  const point = 'ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography';
  const { rows } = await query(
    `SELECT ${CARD_COLUMNS},
            ST_Distance(location, ${point}) AS distance_meters
       FROM hospitals
      WHERE is_active = true
        AND is_verified = true
        AND location IS NOT NULL
        AND ST_DWithin(location, ${point}, $3)
      ORDER BY location <-> ${point}
      LIMIT $4 OFFSET $5`,
    [lng, lat, radius, limit, offset],
  );

  return {
    results: rows.map(toCard),
    pagination: { limit, offset, count: rows.length, radiusMeters: radius },
  };
}

/** Full public profile of one verified hospital, including services. */
async function getById(hospitalId, { includeUnverified = false } = {}) {
  const { rows } = await query(
    `SELECT ${CARD_COLUMNS}, legal_name, email, is_active, is_verified, verified_at, created_at, updated_at
       FROM hospitals WHERE id = $1`,
    [hospitalId],
  );
  const h = rows[0];
  if (!h) throw notFound('Hospital not found.');
  // Hide unapproved hospitals from the public (section 2/5).
  if (!includeUnverified && !(h.is_active && h.is_verified)) throw notFound('Hospital not found.');

  const { rows: services } = await query(
    `SELECT id, service_type, service_name, is_available, description
       FROM hospital_services WHERE hospital_id = $1 ORDER BY service_name`,
    [hospitalId],
  );

  return {
    ...toCard(h),
    legalName: h.legal_name,
    email: h.email,
    isActive: h.is_active,
    isVerified: h.is_verified,
    verifiedAt: h.verified_at,
    services: services.map((s) => ({
      id: s.id,
      serviceType: s.service_type,
      serviceName: s.service_name,
      isAvailable: s.is_available,
      description: s.description,
    })),
  };
}

// Fields a hospital admin may edit via PATCH. is_verified / is_active are NOT
// here — verification state is changed only through the admin workflow.
const EDITABLE = {
  displayName: 'display_name',
  description: 'description',
  phone: 'phone',
  emergencyPhone: 'emergency_phone',
  email: 'email',
  addressLine1: 'address_line_1',
  addressLine2: 'address_line_2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  emergencyAvailable: 'emergency_available',
};

/** Patch editable hospital fields; audited. Coordinates handled separately. */
async function update(hospitalId, body, actorUserId) {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, column] of Object.entries(EDITABLE)) {
    if (body[key] !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(body[key]);
    }
  }

  // Coordinate edits (section: "Editing and confirming hospital coordinates").
  if (body.latitude !== undefined || body.longitude !== undefined) {
    const lat = validate.latitude(body.latitude);
    const lng = validate.longitude(body.longitude);
    sets.push(`location = ST_SetSRID(ST_MakePoint($${i++}, $${i++}), 4326)::geography`);
    values.push(lng, lat);
  }

  if (sets.length === 0) throw badRequest('No editable fields provided.');
  sets.push('updated_at = now()');
  values.push(hospitalId);

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE hospitals SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`,
      values,
    );
    if (!rows[0]) throw notFound('Hospital not found.');
    await audit.record(client, {
      actorUserId,
      action: 'HOSPITAL_UPDATED',
      entityType: 'hospital',
      entityId: hospitalId,
      metadata: { fields: Object.keys(body) },
    });
    return getById(hospitalId, { includeUnverified: true });
  });
}

module.exports = { nearby, getById, update };
