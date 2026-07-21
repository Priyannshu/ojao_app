/**
 * ojao — Phone + password auth via WhatsApp Business Cloud API OTP.
 *
 * Firebase Auth only supports email+password sign-in, so we register each user
 * with a DETERMINISTIC synthetic email derived from their mobile number
 * (`{digits}@phone.ojao.app`) plus their 6-digit password. The client computes
 * the same synthetic email at login time and calls signInWithEmailAndPassword
 * directly — no server lookup needed. The user's REAL email is kept in their
 * Firestore profile for future use (receipts, notifications).
 *
 * OTPs are delivered via WhatsApp using Meta's Cloud API. Configure once via
 * secrets (all four are required):
 *   firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN     # permanent system-user token
 *   firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID  # numeric id, e.g. 1235520376311429
 *   firebase functions:secrets:set WHATSAPP_TEMPLATE_NAME    # approved authentication template name
 *   firebase functions:secrets:set WHATSAPP_TEMPLATE_LANG    # language code, e.g. en_US
 *
 * The template MUST be in the "authentication" category, have exactly one body
 * placeholder ({{1}}) and the standard Copy-Code button. Meta populates both
 * with the code we pass. `hello_world` will NOT deliver an OTP — swap the
 * template secret to your approved auth template's name when it's ready.
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

const WHATSAPP_ACCESS_TOKEN = defineSecret("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = defineSecret("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_TEMPLATE_NAME = defineSecret("WHATSAPP_TEMPLATE_NAME");
const WHATSAPP_TEMPLATE_LANG = defineSecret("WHATSAPP_TEMPLATE_LANG");

const OTP_SECRETS = [
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TEMPLATE_NAME,
  WHATSAPP_TEMPLATE_LANG,
];

// Pin the Graph API version so payload shape changes don't surprise us.
const WA_GRAPH_VERSION = "v21.0";

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

/**
 * Sends an OTP over WhatsApp via Meta's Cloud API. Throws HttpsError on
 * failure. Uses an authentication-category template with a single body
 * placeholder ({{1}}) and a Copy-Code button; the same code is passed to both
 * components so Meta's one-tap autofill works.
 */
async function sendWhatsappOtp(mobile, code) {
  // WhatsApp expects the full international number in digits only, no plus.
  // 10-digit local numbers are assumed to be Indian and get a "91" prefix so
  // the Graph API accepts them consistently.
  const to = mobile.length === 10 ? `91${mobile}` : mobile;

  const url = `https://graph.facebook.com/${WA_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: WHATSAPP_TEMPLATE_NAME.value(),
      language: {code: WHATSAPP_TEMPLATE_LANG.value()},
      components: [
        {
          type: "body",
          parameters: [{type: "text", text: code}],
        },
        {
          // Copy-Code button — required by Meta's standard auth template.
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{type: "text", text: code}],
        },
      ],
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await resp.json();
  } catch (_) {
    data = null;
  }

  if (!resp.ok || !data || data.error) {
    console.error("WhatsApp send failed", {
      status: resp.status,
      error: data && data.error,
    });
    // Surface a user-facing message. The Meta error stays in the log for us.
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
    {secrets: OTP_SECRETS},
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
      await sendWhatsappOtp(digits, code);
      return {ok: true};
    },
);

const registerWithOtp = onCall(
    {secrets: OTP_SECRETS},
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
    {secrets: OTP_SECRETS},
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
