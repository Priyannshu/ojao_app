# ojao — Firestore seed data

Loads a medium-size sample dataset into your Firebase project so the app
has departments, live queue tokens, appointments, and analytics to show.

Everything is written under the nested clinic document the app expects:
`clinics/main/<collection>/<id>`.

## What gets written (50 docs)

| Path | Count | Purpose |
|------|-------|---------|
| `clinics/main/departments/*` | 7 | Department cards on the patient home |
| `clinics/main/analytics/current` | 1 | The "clinic pulse" stats strip |
| `clinics/main/tokens/*` | 30 | Live virtual-queue tokens (staff dashboard) |
| `clinics/main/appointments/*` | 12 | Sample appointments |

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
- Timestamps are ISO-8601 strings, matching how the app's models serialize
  dates (`DateTime.parse` / `toIso8601String`).
