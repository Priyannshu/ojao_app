/**
 * ojao auth server — thin HTTP layer over auth.js.
 *
 * Endpoints (all POST, JSON in/out):
 *   POST /auth/send-otp        { mobile, purpose }                    -> { ok }
 *   POST /auth/register        { mobile, name, email, password, code }-> { ok, uid }
 *   POST /auth/reset-password  { mobile, password, code }             -> { ok }
 *   GET  /health                                                      -> { ok }
 *
 * On error it returns the matching HTTP status with { error, message }, where
 * `error` is the stable code (e.g. "resource-exhausted") and `message` is the
 * user-facing text the Flutter app shows.
 *
 * Firebase Admin credentials: set GOOGLE_APPLICATION_CREDENTIALS to the path of
 * a service-account JSON key downloaded from the Firebase console
 * (Project settings -> Service accounts -> Generate new private key). Keep that
 * file OFF version control.
 */
// Load .env into process.env before anything reads it. pm2 does NOT do this
// automatically; without it, firebase-admin can't find the service-account
// path and throws "Unable to detect a Project Id" on the first Firestore call.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const auth = require("./auth");

// Initialize the Admin SDK once. Uses GOOGLE_APPLICATION_CREDENTIALS
// (application-default credentials) so no key path is hard-coded here.
admin.initializeApp();

const app = express();
app.use(express.json());
// The Flutter mobile app isn't a browser origin, but CORS is harmless and lets
// you hit the API from a web build / local tools during development.
app.use(cors());

/** Wraps an async operation: runs it, returns JSON, maps AuthError to status. */
function handle(opName, fn) {
  return async (req, res) => {
    try {
      const result = await fn(req.body || {});
      res.json(result);
    } catch (err) {
      if (err instanceof auth.AuthError) {
        res.status(err.status).json({error: err.code, message: err.message});
      } else {
        console.error(`${opName} failed`, err);
        res.status(500).json({
          error: "internal",
          message: "Something went wrong. Please try again.",
        });
      }
    }
  };
}

app.get("/health", (_req, res) => res.json({ok: true}));

app.post("/auth/send-otp", handle("send-otp", auth.sendPhoneOtp));
app.post("/auth/register", handle("register", auth.registerWithOtp));
app.post("/auth/reset-password", handle("reset-password", auth.resetPasswordWithOtp));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`ojao auth server listening on :${PORT}`);
});
