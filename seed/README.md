# ojao — Firestore seed data

Loads a medium-size sample dataset into your Firebase project so the app
has facilities, departments, live queue tokens, appointments, and analytics
to show.

The app is **multi-facility**: each hospital / clinic / diagnostic center is a
document under the top-level `facilities` collection, and everything it owns
lives in subcollections beneath it. So the seed writes under
`facilities/{facilityId}/<collection>/<id>` — each facility's queue, token
sequence, and appointments are fully isolated from every other facility's.

## What gets written (~246 docs across 8 facilities)

Per facility:

| Path | Purpose |
|------|---------|
| `facilities/{id}` | The facility card (name, type, coordinates, rating) |
| `facilities/{id}/departments/*` | Department cards for that facility |
| `facilities/{id}/analytics/current` | That facility's stats strip |
| `facilities/{id}/tokens/*` | That facility's live virtual-queue tokens |
| `facilities/{id}/appointments/*` | Sample appointments at that facility |

Facilities span all categories — hospitals, clinics, and diagnostic centers —
with coordinates clustered around a central point so the app's "near me"
distance sorting has something to order.

## One-time setup

1. **Get a service-account key** (this authenticates the importer as admin):
   - Firebase console → Project settings → **Service accounts**
   - Click **Generate new private key** → downloads a JSON file
   - Save it in this folder as `service-account.json`
     (already git-ignored — never commit it)

2. **Install the one dependency:**
   ```bash
   cd seed
   npm install
   ```

## Run it

Preview without writing anything:
```bash
npm run seed:dry
```

Write to Firestore:
```bash
npm run seed
```

Then pull-to-refresh the app's home screen — the department cards and stats
will appear. Sign in as a staff user to see the queue tokens.

## Notes

- Re-running overwrites the same doc IDs (idempotent) — safe to run repeatedly.
- The token/appointment `patientId`s are placeholders (`seed-patient-01` …).
  They won't match your real signed-in uid, so they populate the **staff**
  views. To see a token on *your* patient home, join a queue in-app, or edit
  one seed token's `patientId` to your uid (printed in the debug logs at login).
- Staff are scoped to **one** facility. A staff user's `clinicId` (in the
  `users` collection) must equal a facility id above (e.g. `apollo-hospital`)
  for their dashboard/queue to show that facility's tokens.
- Timestamps are ISO-8601 strings, matching how the app's models serialize
  dates (`DateTime.parse` / `toIso8601String`).
