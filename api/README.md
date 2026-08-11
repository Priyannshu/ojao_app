# ojao API

Backend REST service for the **target architecture** in
[`../ARCHITECTURE.md`](../ARCHITECTURE.md): a single, versioned `/api/v1`
service over **PostgreSQL + PostGIS**. It owns hospital discovery, hospital
verification, authentication, notifications registry, and the audit trail — the
server-side policy enforcement point the mobile app migrates onto.

This service is **new and self-contained**. It does not replace the existing
Firebase MVP or the `../server` OTP service yet; it implements the migration
target (delivery sequence steps 3–6) so those flows can move over incrementally.

## Requirements

- Node 18+
- PostgreSQL 14+ with the **PostGIS** and **pgcrypto** extensions available

## Setup

```bash
cd api
cp .env.example .env          # then edit secrets + DATABASE_URL
npm install
npm run migrate               # creates schema + PostGIS indexes (idempotent)
npm run seed                  # optional: dev users + sample hospitals
npm start                     # http://localhost:8081
```

Health check: `GET /health` → `{ "ok": true, "service": "ojao-api" }`

## Auth model

One authoritative flow (section 3): **phone + password**, bcrypt-hashed in
Postgres. Roles are `USER`, `HOSPITAL_ADMIN`, `PLATFORM_ADMIN` — the client can
never choose its own role. Access tokens are short-lived JWTs; refresh tokens
are opaque, stored **hashed** and revocable (rotated on every refresh).

Send the access token as `Authorization: Bearer <token>`.

## Endpoints (`/api/v1`)

### Auth
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/otp/request` | – | Sends a WhatsApp OTP for `register` or `password_reset`; rejects ineligible numbers explicitly. |
| POST | `/auth/register` | – | Verifies OTP, registers a `USER`, and returns tokens. |
| POST | `/auth/login` | – | `{ phone, password }` → tokens. |
| POST | `/auth/password/reset` | – | Verifies WhatsApp OTP, changes password, and revokes sessions. |
| POST | `/auth/refresh` | – | Rotate refresh token. |
| POST | `/auth/logout` | – | Revoke a refresh token. |
| GET | `/auth/me` | Bearer | Current user. |

### Hospital discovery & profiles
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/hospitals/nearby` | – (rate-limited) | `?latitude&longitude&radiusMeters&limit&offset`. PostGIS `ST_DWithin`/`ST_Distance`, verified+active only, distance computed server-side. |
| GET | `/hospitals/:id` | – | Public profile (verified only) + services. |
| PATCH | `/hospitals/:id` | Hospital/Platform admin | Edit profile & coordinates (own hospital only). |

### Hospital applications & verification
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/hospital-applications` | Bearer | Submit an onboarding application. |
| GET | `/hospital-applications/mine` | Bearer | Latest application for the signed-in applicant, or `null`. |
| GET | `/hospital-applications/:id` | Bearer | View own application. |
| POST | `/hospital-applications/:id/documents` | Bearer | Attach a stored-document reference (object-storage key). |
| GET | `/admin/hospital-applications` | Platform admin | Review queue (`?status=`). |
| POST | `/admin/hospital-applications/:id/approve` | Platform admin | Creates hospital + links admin. |
| POST | `/admin/hospital-applications/:id/reject` | Platform admin | Requires `reviewNotes`. |
| POST | `/admin/hospitals/:id/suspend` | Platform admin | Deactivate a hospital. |
| POST | `/admin/hospitals/:id/reactivate` | Platform admin | Reactivate. |

### Notifications & audit
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/notifications/device-tokens` | Bearer | Register a push token (bound to user). |
| DELETE | `/notifications/device-tokens` | Bearer | Unregister. |
| GET | `/admin/audit-logs` | Platform admin | Query the audit trail. |

## Example

```bash
# Nearby verified hospitals within 5 km of MG Road, Bengaluru
curl "http://localhost:8081/api/v1/hospitals/nearby?latitude=12.9750&longitude=77.6100&radiusMeters=5000"

# Log in as the seeded platform admin (dev password: 123456)
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"9000000001","password":"123456"}'
```

## Security controls (section 5)

- Every coordinate, radius, pagination value, and status is validated server-side.
- Per-IP rate limits on `nearby` and auth endpoints.
- `is_verified` / `is_active` / `role` / hospital ownership are **never** trusted
  from the client — they are server-owned and enforced via middleware.
- Exact patient coordinates are never written to logs or audit metadata.
- Passwords bcrypt-hashed; refresh tokens stored only as SHA-256 hashes.
- Documents are referenced by private object-storage keys (upload the file to a
  private bucket and store the key; serve via short-lived signed URLs).
- Every approval, rejection, suspension, and profile change is written to
  `audit_logs`.

## Testing

```bash
npm test                      # validation unit tests (no DB)
RUN_DB_TESTS=1 npm test       # + nearby integration test (needs migrate+seed)
```

## Deployment

Single service (section 6): deploy to Cloud Run / ECS / Render / Railway / Fly.io
with managed PostgreSQL+PostGIS. Provide secrets via the platform's env/secret
manager — never bundle them. Put it behind HTTPS at the gateway/load balancer.
Add Redis for coarse-location caching only after measuring demand.

## Not yet migrated

Queue, appointment, and payment mutations still run through Firebase/Firestore in
the mobile app (delivery sequence step 6). They should move behind this same
`/api/v1` boundary with server-side transactions before production.
