/**
 * ojao — Phone + password auth via Fast2SMS OTP.
 *
 * Firebase Auth only supports email+password sign-in, so we register each user
 * with a DETERMINISTIC synthetic email derived from their mobile number
 * (`{digits}@phone.ojao.app`) plus their 6-digit password. The client computes
 * the same synthetic email at login time and calls signInWithEmailAndPassword
 * directly — no server lookup needed. The user's REAL email is kept in their
 * Firestore profile for future use (receipts, notifications).
 *
 * OTPs are sent over SMS by Fast2SMS. The API key is a secret, never in source:
 *   firebase functions:secrets:set FAST2SMS_API_KEY
 *
 * Callable functions (client -> lib/data/services/auth_service.dart):
 *   - sendPhoneOtp({ mobile, purpose })                       -> { ok }
 *   - registerWithOtp({ mobile, name, email, password, code })-> { ok, uid }
 *   - resetPasswordWithOtp({ mobile, password, code })        -> { ok }
 */
const crypto = require("crypto");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

const FAST2SMS_API_KEY = defineSecret("FAST2SMS_API_KEY");

// --- Tunables --------------------------------------------------------------
const OTP_TTL_MS = 5 * 60 * 1000; // codes valid for 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends to one number
const MAX_SENDS_PER_WINDOW = 5; // sends allowed per rate window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_VERIFY_ATTEMPTS = 5; // wrong-code tries before a code is burned

const SYNTHETIC_EMAIL_DOMAIN = "phone.ojao.app";

// --- Helpers ---------------------------------------------------------------

/** Normalizes a mobile number to bare digits (drops +, spaces, dashes). */
function normalizeMobile(mobile) {
  if (typeof mobile !== "string") return "";
  const digits = mobile.replace(/\D/g, "");
  return digits;
}

/** The deterministic synthetic email Firebase Auth stores for this number. */
function syntheticEmail(digits) {
  return `${digits}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** SHA-256 hash of a code, so we never store the plaintext OTP. */
function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function isValidMobile(digits) {
  // 10–15 digits covers Indian (10) and country-code-prefixed numbers.
  return /^\d{10,15}$/.test(digits);
}

function isValidPassword(password) {
  // Exactly 6 digits, per product spec.
  return typeof password === "string" && /^\d{6}$/.test(password);
}

/** Sends an OTP SMS via Fast2SMS. Throws HttpsError on failure. */
async function sendSms(mobile, code) {
  // Fast2SMS expects the 10-digit number without country code for Indian DLT.
  const numbers = mobile.length > 10 ? mobile.slice(-10) : mobile;
  const message = `Your ojao verification code is ${code}. It is valid for 5 minutes. Do not share it with anyone.`;

  const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      "authorization": FAST2SMS_API_KEY.value(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q", // quick transactional route; adjust to your DLT setup
      message,
      language: "english",
      numbers,
    }),
  });

  let data;
  try {
    data = await resp.json();
  } catch (_) {
    data = null;
  }

  if (!resp.ok || !data || data.return !== true) {
    console.error("Fast2SMS send failed", {status: resp.status, data});
    throw new HttpsError("unavailable", "Could not send the OTP. Try again.");
  }
}

/**
 * Enforces rate limits and issues a fresh OTP for [digits], storing its hash.
 * Throws HttpsError('resource-exhausted') when limits are exceeded.
 */
async function issueOtp(db, digits, purpose) {
  const ref = db.doc(`otp_requests/${digits}`);
  const now = Date.now();

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};

    // Cooldown between sends.
    if (data.lastSentAt && now - data.lastSentAt < RESEND_COOLDOWN_MS) {
      throw new HttpsError(
          "resource-exhausted", "Please wait before requesting another code.");
    }

    // Sliding send window.
    let windowStart = data.windowStart || now;
    let sendCount = data.sendCount || 0;
    if (now - windowStart > RATE_WINDOW_MS) {
      windowStart = now;
      sendCount = 0;
    }
    if (sendCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpsError(
          "resource-exhausted", "Too many code requests. Try again later.");
    }

    tx.set(ref, {
      codeHash: hashCode(code),
      purpose: purpose || "verify",
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      windowStart,
      sendCount: sendCount + 1,
    }, {merge: true});
  });

  return code;
}

/**
 * Verifies [code] against the stored OTP for [digits]. Consumes the code on
 * success. Throws HttpsError on mismatch / expiry / too many attempts.
 */
async function consumeOtp(db, digits, code) {
  const ref = db.doc(`otp_requests/${digits}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Request a code first.");
    }
    const data = snap.data();

    if (data.expiresAt && now > data.expiresAt) {
      throw new HttpsError("deadline-exceeded", "This code has expired.");
    }
    if ((data.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpsError(
          "resource-exhausted", "Too many attempts. Request a new code.");
    }

    if (hashCode(code) !== data.codeHash) {
      tx.update(ref, {attempts: (data.attempts || 0) + 1});
      throw new HttpsError("permission-denied", "Incorrect code.");
    }

    // Correct — burn the code so it can't be reused.
    tx.delete(ref);
  });
}

// --- Callable functions ----------------------------------------------------

const sendPhoneOtp = onCall(
    {secrets: [FAST2SMS_API_KEY]},
    async (request) => {
      const {mobile, purpose} = request.data || {};
      const digits = normalizeMobile(mobile);
      if (!isValidMobile(digits)) {
        throw new HttpsError("invalid-argument", "Enter a valid mobile number.");
      }

      const db = admin.firestore();

      // For a password reset, the account must exist; for registration it must
      // NOT already exist. Checking here gives clearer errors than at verify.
      const email = syntheticEmail(digits);
      let userExists = true;
      try {
        await admin.auth().getUserByEmail(email);
      } catch (_) {
        userExists = false;
      }
      if (purpose === "reset" && !userExists) {
        throw new HttpsError("not-found", "No account found for this number.");
      }
      if (purpose === "register" && userExists) {
        throw new HttpsError(
            "already-exists", "An account with this number already exists.");
      }

      const code = await issueOtp(db, digits, purpose);
      await sendSms(digits, code);
      return {ok: true};
    },
);

const registerWithOtp = onCall(
    {secrets: [FAST2SMS_API_KEY]},
    async (request) => {
      const {mobile, name, email, password, code} = request.data || {};
      const digits = normalizeMobile(mobile);
      if (!isValidMobile(digits)) {
        throw new HttpsError("invalid-argument", "Enter a valid mobile number.");
      }
      if (!isValidPassword(password)) {
        throw new HttpsError(
            "invalid-argument", "Password must be exactly 6 digits.");
      }
      if (typeof name !== "string" || name.trim().length < 2) {
        throw new HttpsError("invalid-argument", "Enter your name.");
      }

      const db = admin.firestore();
      await consumeOtp(db, digits, code);

      const synthetic = syntheticEmail(digits);
      let userRecord;
      try {
        userRecord = await admin.auth().createUser({
          email: synthetic,
          password,
          displayName: name.trim(),
        });
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          throw new HttpsError(
              "already-exists", "An account with this number already exists.");
        }
        console.error("createUser failed", err);
        throw new HttpsError("internal", "Could not create the account.");
      }

      // Store the profile (with the REAL email) under users/{uid}.
      await db.doc(`users/${userRecord.uid}`).set({
        uid: userRecord.uid,
        phoneNumber: digits,
        displayName: name.trim(),
        email: typeof email === "string" ? email.trim() : null,
        role: "patient",
        isVerified: true,
        createdAt: new Date().toISOString(),
      }, {merge: true});

      return {ok: true, uid: userRecord.uid};
    },
);

const resetPasswordWithOtp = onCall(
    {secrets: [FAST2SMS_API_KEY]},
    async (request) => {
      const {mobile, password, code} = request.data || {};
      const digits = normalizeMobile(mobile);
      if (!isValidMobile(digits)) {
        throw new HttpsError("invalid-argument", "Enter a valid mobile number.");
      }
      if (!isValidPassword(password)) {
        throw new HttpsError(
            "invalid-argument", "Password must be exactly 6 digits.");
      }

      const db = admin.firestore();
      const synthetic = syntheticEmail(digits);

      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(synthetic);
      } catch (_) {
        throw new HttpsError("not-found", "No account found for this number.");
      }

      await consumeOtp(db, digits, code);
      await admin.auth().updateUser(userRecord.uid, {password});
      return {ok: true};
    },
);

module.exports = {
  sendPhoneOtp,
  registerWithOtp,
  resetPasswordWithOtp,
  // exported for potential reuse/testing
  syntheticEmail,
  normalizeMobile,
};
