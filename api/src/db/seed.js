/**
 * Development seed data. Creates a platform admin, a hospital admin, an
 * approved+verified hospital in Bengaluru, and one unverified hospital (to
 * prove the search filter hides it). Idempotent on phone/email.
 *
 * Run with: npm run seed   (after `npm run migrate`)
 */
const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('./pool');

const DEV_PASSWORD = '123456'; // dev only — 6-digit to match the mobile app

async function upsertUser(client, { name, email, phone, role }) {
  const hash = await bcrypt.hash(DEV_PASSWORD, 10);
  const { rows } = await client.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
     RETURNING id`,
    [name, email, phone, hash, role],
  );
  return rows[0].id;
}

async function seed() {
  await withTransaction(async (client) => {
    await upsertUser(client, {
      name: 'Platform Admin',
      email: 'admin@ojao.app',
      phone: '9000000001',
      role: 'PLATFORM_ADMIN',
    });

    const hospitalAdminId = await upsertUser(client, {
      name: 'Hospital Admin',
      email: 'hosp@ojao.app',
      phone: '9000000002',
      role: 'HOSPITAL_ADMIN',
    });

    await upsertUser(client, {
      name: 'Test Patient',
      email: 'patient@ojao.app',
      phone: '9000000003',
      role: 'USER',
    });

    // Active + verified hospital near MG Road, Bengaluru (lng, lat).
    const { rows: hosp } = await client.query(
      `INSERT INTO hospitals
         (legal_name, display_name, description, phone, city, state, country,
          location, is_active, is_verified, verified_at)
       VALUES
         ('Ojao General Hospital Pvt Ltd', 'Ojao General Hospital',
          'Multi-speciality hospital', '+918000000000', 'Bengaluru', 'Karnataka',
          'India', ST_SetSRID(ST_MakePoint(77.6100, 12.9750), 4326)::geography,
          true, true, now())
       ON CONFLICT DO NOTHING
       RETURNING id`,
    );

    if (hosp[0]) {
      await client.query(
        `INSERT INTO hospital_admins (user_id, hospital_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [hospitalAdminId, hosp[0].id],
      );
      await client.query(
        `INSERT INTO hospital_services (hospital_id, service_type, service_name)
         VALUES ($1, 'EMERGENCY', 'Casualty & Emergency'),
                ($1, 'OPD', 'General Medicine OPD')
         ON CONFLICT DO NOTHING`,
        [hosp[0].id],
      );
    }

    // Unverified hospital nearby — MUST NOT appear in nearby search.
    await client.query(
      `INSERT INTO hospitals
         (legal_name, display_name, phone, city, location, is_active, is_verified)
       VALUES
         ('Pending Clinic LLP', 'Pending Clinic', '+918000000001', 'Bengaluru',
          ST_SetSRID(ST_MakePoint(77.6120, 12.9760), 4326)::geography, true, false)
       ON CONFLICT DO NOTHING`,
    );
  });

  console.log(`Seed complete. Dev login password for all users: ${DEV_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
