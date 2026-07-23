/**
 * ojao — phone + password OTP auth logic (framework-agnostic).
 *
 * Ported from the original Firebase Cloud Function (functions/otp_auth.js) so it
 * runs on a plain Node server (EC2) while still using Firebase Auth + Firestore
 * via the Admin SDK. Firebase Auth only supports email+password sign-in, so each
 * user is registered under a DETERMINISTIC synthetic email derived from their
 * mobile number (`{digits}@phone.ojao.app`) + their 6-digit password. The Flutter
 * client computes the same synthetic email at login and calls Firebase Auth
 * directly — this server never handles sessions.
 *
 * OTPs are delivered via WhatsApp Cloud API. Config comes from env vars:
 *   WHATSAPP_ACCESS_TOKEN     permanent system-user token
 *   WHATSAPP_PHONE_NUMBER_ID  numeric id, e.g. 1235520376311429
 *   WHATSAPP_TEMPLATE_NAME    approved authentication template name
 *   WHATSAPP_TEMPLATE_LANG    language code, e.g. en_US
 *
 * The template MUST be authentication-category with one body placeholder
 * ({{1}}) and the standard Copy-Code button. `hello_world` will NOT deliver a
 * code — swap WHATSAPP_TEMPLATE_NAME to your approved template when ready.
 */
const crypto = require("crypto");
const admin = require("firebase-admin");

const WA_GRAPH_VERSION = "v21.0";

// --- Tunables --------------------------------------------------------------
const OTP_TTL_MS = 5 * 60 * 1000; // codes valid for 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends to one number
const MAX_SENDS_PER_WINDOW = 5; // sends allowed per rate window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_VERIFY_ATTEMPTS = 5; // wrong-code tries before a code is burned

const SYNTHETIC_EMAIL_DOMAIN = "phone.ojao.app";

/**
 * A typed error the HTTP layer maps to a status code + JSON body. `code` mirrors
 * the old Firebase HttpsError codes so client-side messaging stays consistent.
 */
class AuthError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const errInvalid = (m) => new AuthError("invalid-argument", m, 400);
const errNotFound = (m) => new AuthError("not-found", m, 404);
const errExists = (m) => new AuthError("already-exists", m, 409);
const errRate = (m) => new AuthError("resource-exhausted", m, 429);
const errExpired = (m) => new AuthError("deadline-exceeded", m, 410);
const errDenied = (m) => new AuthError("permission-denied", m, 403);
const errUnavailable = (m) => new AuthError("unavailable", m, 503);
const errInternal = (m) => new AuthError("internal", m, 500);

// --- Helpers ---------------------------------------------------------------

function normalizeMobile(mobile) {
  if (typeof mobile !== "string") return "";
  return mobile.replace(/\D/g, "");
}

function syntheticEmail(digits) {
  return `${digits}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function isValidMobile(digits) {
  return /^\d{10,15}$/.test(digits);
}

function isValidPassword(password) {
  return typeof password === "string" && /^\d{6}$/.test(password);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw errInternal(`Server is missing config: ${name}`);
  return v;
}

/** Sends an OTP over WhatsApp Cloud API. Throws AuthError on failure. */
async function sendWhatsappOtp(mobile, code) {
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");
  const templateName = requireEnv("WHATSAPP_TEMPLATE_NAME");
  const templateLang = requireEnv("WHATSAPP_TEMPLATE_LANG");

  // WhatsApp wants the full international number, digits only. 10-digit local
  // numbers are assumed Indian and get a "91" prefix.
  const to = mobile.length === 10 ? `91${mobile}` : mobile;

  const url = `https://graph.facebook.com/${WA_GRAPH_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {code: templateLang},
      components: [
        {type: "body", parameters: [{type: "text", text: code}]},
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
      "Authorization": `Bearer ${token}`,
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
    throw errUnavailable("Could not send the OTP. Try again.");
  }
}

/** Issues a fresh rate-limited OTP for [digits], storing its hash. */
async function issueOtp(db, digits, purpose) {
  const ref = db.doc(`otp_requests/${digits}`);
  const now = Date.now();
  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};

    if (data.lastSentAt && now - data.lastSentAt < RESEND_COOLDOWN_MS) {
      throw errRate("Please wait before requesting another code.");
    }

    let windowStart = data.windowStart || now;
    let sendCount = data.sendCount || 0;
    if (now - windowStart > RATE_WINDOW_MS) {
      windowStart = now;
      sendCount = 0;
    }
    if (sendCount >= MAX_SENDS_PER_WINDOW) {
      throw errRate("Too many code requests. Try again later.");
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

/** Verifies [code] against the stored OTP for [digits], consuming it on success. */
async function consumeOtp(db, digits, code) {
  const ref = db.doc(`otp_requests/${digits}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw errNotFound("Request a code first.");
    const data = snap.data();

    if (data.expiresAt && now > data.expiresAt) {
      throw errExpired("This code has expired.");
    }
    if ((data.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      throw errRate("Too many attempts. Request a new code.");
    }
    if (hashCode(code) !== data.codeHash) {
      tx.update(ref, {attempts: (data.attempts || 0) + 1});
      throw errDenied("Incorrect code.");
    }
    tx.delete(ref); // burn on success
  });
}

// --- Operations (called by the HTTP layer) ---------------------------------

async function sendPhoneOtp({mobile, purpose}) {
  const digits = normalizeMobile(mobile);
  if (!isValidMobile(digits)) throw errInvalid("Enter a valid mobile number.");

  const db = admin.firestore();
  const email = syntheticEmail(digits);
  let userExists = true;
  try {
    await admin.auth().getUserByEmail(email);
  } catch (_) {
    userExists = false;
  }
  if (purpose === "reset" && !userExists) {
    throw errNotFound("No account found for this number.");
  }
  if (purpose === "register" && userExists) {
    throw errExists("An account with this number already exists.");
  }

  const code = await issueOtp(db, digits, purpose);
  await sendWhatsappOtp(digits, code);
  return {ok: true};
}

async function registerWithOtp({mobile, name, email, password, code}) {
  const digits = normalizeMobile(mobile);
  if (!isValidMobile(digits)) throw errInvalid("Enter a valid mobile number.");
  if (!isValidPassword(password)) {
    throw errInvalid("Password must be exactly 6 digits.");
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    throw errInvalid("Enter your name.");
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
      throw errExists("An account with this number already exists.");
    }
    console.error("createUser failed", err);
    throw errInternal("Could not create the account.");
  }

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
}

async function resetPasswordWithOtp({mobile, password, code}) {
  const digits = normalizeMobile(mobile);
  if (!isValidMobile(digits)) throw errInvalid("Enter a valid mobile number.");
  if (!isValidPassword(password)) {
    throw errInvalid("Password must be exactly 6 digits.");
  }

  const db = admin.firestore();
  const synthetic = syntheticEmail(digits);

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(synthetic);
  } catch (_) {
    throw errNotFound("No account found for this number.");
  }

  await consumeOtp(db, digits, code);
  await admin.auth().updateUser(userRecord.uid, {password});
  return {ok: true};
}

module.exports = {
  AuthError,
  sendPhoneOtp,
  registerWithOtp,
  resetPasswordWithOtp,
  syntheticEmail,
  normalizeMobile,
};
