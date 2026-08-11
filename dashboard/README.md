# ojao Hospital Portal

The hospital onboarding and platform administration surface from
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §"Hospital Verification and
Administration" — the admin dashboard the repo previously lacked (§9 gap).

Pure static HTML/CSS/JS, **no build step**. It talks to the target backend
([`../api`](../api)) at `/api/v1` in production and `localhost:8081/api/v1`
when locally served from another port. It does only what the server authorizes.

## What it does

### Hospital partners

- Create a REST API account after WhatsApp OTP phone verification.
- Recover a forgotten password through a WhatsApp OTP and revoke old sessions.
- Submit hospital identity, contact, address, and optional map coordinates.
- Capture browser geolocation when permission is granted.
- Attach references to documents already stored in a private bucket.
- Resume later to track `PENDING`, `APPROVED`, `REJECTED`, or `SUSPENDED`
  status and read reviewer notes.

The API currently records private object-storage keys; raw browser file upload
requires a signed-upload endpoint and is intentionally not presented as
available.

### Platform administrators

- **Sign in** as a `PLATFORM_ADMIN` (phone + password via `/auth/login`).
- **Review the application queue** — filter by `PENDING` / `APPROVED` /
  `REJECTED` / all.
- **Approve** an application → the API creates the hospital record
  (`is_active` + `is_verified`), links the applicant as its `HOSPITAL_ADMIN`,
  and audits the decision.
- **Reject** with a required reason.
- **Suspend / reactivate** a hospital.
- **Read the audit trail** — filter by entity type.

The portal holds only a short-lived access token and rotating refresh token in
`sessionStorage` and
silently refreshes it once on `401`. **Roles are enforced server-side** — the
UI never trusts its own copy of the role.

## Run it

The dashboard is static files; serve them over HTTP (opening `index.html` via
`file://` will hit CORS/`fetch` restrictions).

```bash
# 1. Start the API (see ../api/README.md)
cd ../api && npm run migrate && npm run seed && npm start   # :8081

# 2. Serve the dashboard on the origin the API allows via CORS_ORIGINS.
#    The api/.env.example allows http://localhost:3000 by default.
cd ../dashboard
python -m http.server 3000        # or: npx serve -l 3000
```

Open <http://localhost:3000>, set the API base URL (default
`http://localhost:8081`), and sign in with the seeded platform admin:

```
phone:    9000000001
password: 123456
```

## CORS

Browser requests from the dashboard origin must be allowed by the API. Add the
dashboard origin to `CORS_ORIGINS` in `../api/.env`:

```
CORS_ORIGINS=http://localhost:3000
```

## Endpoints used

| Action | Request |
| --- | --- |
| Partner registration | `POST /api/v1/auth/register` |
| Sign in | `POST /api/v1/auth/login` |
| Refresh | `POST /api/v1/auth/refresh` |
| Submit application | `POST /api/v1/hospital-applications` |
| Current application | `GET /api/v1/hospital-applications/mine` |
| Add document reference | `POST /api/v1/hospital-applications/:id/documents` |
| Review queue | `GET /api/v1/admin/hospital-applications?status=` |
| Approve | `POST /api/v1/admin/hospital-applications/:id/approve` |
| Reject | `POST /api/v1/admin/hospital-applications/:id/reject` |
| Suspend | `POST /api/v1/admin/hospitals/:id/suspend` |
| Reactivate | `POST /api/v1/admin/hospitals/:id/reactivate` |
| Audit log | `GET /api/v1/admin/audit-logs?entityType=` |

## Notes / next steps

- This is intentionally framework-free for zero-friction hosting (any static
  host / S3 + CloudFront). If it grows, port to a bundled SPA — the API contract
  stays identical.
- Document previews (`submitted_documents`) currently show a count. Serving them
  needs the object-storage signed-URL endpoint (§5) which is not built yet.
