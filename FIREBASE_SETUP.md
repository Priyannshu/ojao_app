# ojao — Backend Setup Guide

The app is built and compiles against a **placeholder** `lib/firebase_options.dart`.
To make login, the live queue, appointments, and payments actually work, connect a
real Firebase project by following the steps below. Nothing in `lib/` needs manual
edits — the tooling generates the config files for you.

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `ojao-clinic`), accept defaults, create it.
3. Inside the project, enable these products:
   - **Authentication** → Sign-in method → **Phone** → Enable.
   - **Firestore Database** → Create database → Start in **production mode**.
   - **Cloud Messaging** (enabled by default).
   - **Cloud Functions** (needs the **Blaze** pay-as-you-go plan; required for Razorpay).

## 2. Wire the Flutter app to it

From `C:\startup\ojao_app`, in PowerShell:

```powershell
# One-time tool installs
dart pub global activate flutterfire_cli
npm install -g firebase-tools

# Log in and generate config (overwrites the placeholder firebase_options.dart,
# and writes android/app/google-services.json + ios/Runner/GoogleService-Info.plist)
firebase login
flutterfire configure
```

When prompted, pick your project and select the **android** and **ios** platforms.

> If `flutterfire` / `dart` aren't on your PATH, this project's Flutter SDK lives at
> `C:\src\flutter\bin` — add that and `%LOCALAPPDATA%\Pub\Cache\bin` to PATH, or call
> the executables by full path.

## 3. Android specifics

`flutterfire configure` drops `android/app/google-services.json` in place. Two things
to confirm for **phone auth**:

- The Google Services Gradle plugin must be applied. Verify `android/build.gradle.kts`
  and `android/app/build.gradle.kts` include the `com.google.gms.google-services` plugin
  (FlutterFire adds this automatically on recent versions; if a build complains, see
  <https://firebase.flutter.dev/docs/overview>).
- In the Firebase console → Project settings → your Android app, add your debug
  **SHA-1** and **SHA-256** fingerprints (phone auth / Play Integrity needs them):

  ```powershell
  cd android; .\gradlew signingReport
  ```

  Copy the debug `SHA1` / `SHA256` into the console, then re-run `flutterfire configure`
  (or just re-download `google-services.json`).

## 4. iOS specifics (needs a Mac to build/run)

- `flutterfire configure` writes `ios/Runner/GoogleService-Info.plist`.
- Enable push: in Xcode add the **Push Notifications** and **Background Modes**
  (Remote notifications) capabilities, and upload an **APNs key** in the Firebase
  console → Cloud Messaging.
- Phone auth on iOS uses APNs for silent verification; the APNs key above covers it.

## 5. Firestore data shape

The app reads/writes these paths (see `FirestorePaths` in
`lib/data/services/firestore_service.dart`). Everything lives under a single
clinic document, `clinics/main`, so that Firestore's segment-count rules are
satisfied (collections have an odd number of segments, documents an even
number):

| Path | Written by | Notes |
|------|-----------|-------|
| `clinics/main/users/{uid}` | auth | `UserModel` — role decides patient vs staff |
| `clinics/main/departments/{id}` | seed / staff | `Department` |
| `clinics/main/tokens/{id}` | queue | `PatientToken` (the live queue) |
| `clinics/main/positions/{id}` | queue | lightweight position mirror |
| `clinics/main/appointments/{id}` | booking | `Appointment` |
| `clinics/main/payments/{id}` | payment | `PaymentRecord` |
| `clinics/main/analytics/current` | staff/CF | `ClinicStats` (single doc) |

### Seed some departments so the home screen isn't empty

Firestore console → create collection `clinics`, add document `main`, then
within it create the `departments` sub-collection (full path
`clinics/main/departments/{id}`). Add a few docs like:

```json
{
  "id": "cardiology",
  "name": "Cardiology",
  "description": "Heart & vascular care",
  "icon": "cardiology",
  "avgWaitMinutes": 18,
  "activeDoctors": 3,
  "currentServing": "CA-104",
  "isActive": true
}
```

And the analytics doc at `clinics/main/analytics/current`:

```json
{
  "id": "current",
  "activePatients": 12,
  "avgWaitReduction": 42,
  "patientSatisfaction": 4.6,
  "imagingTurnaround": 25,
  "patientsServed": 87,
  "updatedAt": "2026-07-17T09:00:00.000Z"
}
```

To make an account **staff**, edit its `clinics/main/users/{uid}` doc and set
`"role": "staff"` (or `"admin"`). The app routes staff to the console automatically.

## 6. Security rules (minimum viable, tighten before production)

Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /clinics/{clinicId} {
      match /users/{uid} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /departments/{id} {
        allow read: if request.auth != null;
        allow write: if false; // manage from console / functions for now
      }
      match /tokens/{id} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null;
      }
      match /positions/{id} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      match /appointments/{id} {
        allow read, write: if request.auth != null;
      }
      match /payments/{id} {
        allow read: if request.auth != null;
        allow write: if false; // written by Cloud Functions only
      }
      match /analytics/{doc} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
  }
}
```

> These are intentionally permissive so the MVP works. Before launch, scope token
> updates to staff and lock patient reads to their own records.

## 7. Razorpay payments (Cloud Functions)

`lib/data/services/payment_service.dart` calls two callable functions:
`createRazorpayOrder` and `verifyRazorpayPayment`. A ready-to-deploy implementation
is scaffolded in the `functions/` folder. To deploy:

```powershell
cd functions
npm install
# Store your Razorpay keys as secrets (Blaze plan required):
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase deploy --only functions
```

Then put your Razorpay **key id** into `lib/core/constants/app_constants.dart`
(`defaultRazorpayKey`) for the client-side checkout.

## 8. Run it

```powershell
cd C:\startup\ojao_app
C:\src\flutter\bin\flutter.bat run
```

Sign in with a phone number, pick a department, join the queue. Flip a user's role
to `staff` to see the console side.
