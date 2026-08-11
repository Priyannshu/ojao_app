/**
 * Auth service — the authoritative authentication flow for the target
 * architecture (ARCHITECTURE.md sections 3 & 7).
 *
 * Consolidates identity behind ONE provider: phone + password stored in
 * Postgres, bcrypt-hashed. Issues short-lived access JWTs and revocable refresh
 * tokens. This replaces the split between Firebase Auth, the Express OTP server,
 * and legacy phone auth as those flows migrate over.
 *
 * Registration here is USER-only. HOSPITAL_ADMIN / PLATFORM_ADMIN roles are
 * granted by an admin, never self-selected — the client cannot pick its role.
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, query, withTransaction } = require('../../db/pool');
const { signAccessToken, newRefreshToken, hashToken } = require('../../lib/tokens');
const {
  badRequest,
  conflict,
  unauthorized,
  unavailable,
  invalidOtp,
  tooManyRequests,
  notFound,
  forbidden,
} = require('../../lib/errors');
const validate = require('../../lib/validate');
const audit = require('../../lib/audit');
const config = require('../../config');
const { sendWhatsappOtp } = require('../../lib/fast2sms');

const BCRYPT_ROUNDS = 10;
const OTP_PURPOSES = new Set(['register', 'password_reset']);
const OTP_ACCEPTED = {
  ok: true,
  message: 'If this number is eligible, a verification code will be sent on WhatsApp.',
};

function phoneAliases(phone) {
  return phone.length === 10 ? [phone, `91${phone}`, `+91${phone}`] : [phone, `+${phone}`];
}

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  status: u.status,
});

async function issueTokens(client, user) {
  const refresh = newRefreshToken();
  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, refresh.hash, refresh.expiresAt],
  );
  return {
    accessToken: signAccessToken(user),
    refreshToken: refresh.token,
    expiresIn: config.jwt.accessTtl,
  };
}

function otpMac(phone, purpose, generation, code) {
  return crypto
    .createHmac('sha256', config.otp.hmacSecret)
    .update(`${phone}:${purpose}:${generation}:${code}`)
    .digest('hex');
}

function validOtpCode(value) {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

async function requestOtp({ phone, purpose }) {
  const cleanPhone = validate.phone(phone);
  if (!OTP_PURPOSES.has(purpose)) throw badRequest('purpose must be register or password_reset.');

  const { rows } = await query('SELECT status FROM users WHERE phone = ANY($1::text[]) LIMIT 1', [phoneAliases(cleanPhone)]);
  const user = rows[0];
  if (purpose === 'register' && user) {
    throw conflict('An account with this number already exists. Sign in or use Forgot password.');
  }
  if (purpose === 'password_reset' && !user) {
    throw notFound('No account was found for this number.');
  }
  if (purpose === 'password_reset' && user.status !== 'ACTIVE') {
    throw forbidden('This account is not active.');
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const generation = crypto.randomUUID();
  const now = Date.now();

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO otp_challenges (phone, purpose, window_start)
       VALUES ($1, $2, now()) ON CONFLICT (phone, purpose) DO NOTHING`,
      [cleanPhone, purpose],
    );
    const { rows: challengeRows } = await client.query(
      'SELECT * FROM otp_challenges WHERE phone = $1 AND purpose = $2 FOR UPDATE',
      [cleanPhone, purpose],
    );
    const challenge = challengeRows[0];
    const lastSent = challenge.last_sent_at ? new Date(challenge.last_sent_at).getTime() : 0;
    if (lastSent && now - lastSent < config.otp.resendCooldownMs) {
      const waitSeconds = Math.ceil((config.otp.resendCooldownMs - (now - lastSent)) / 1000);
      throw tooManyRequests(`Please wait ${waitSeconds} seconds before requesting another code.`);
    }

    let windowStart = challenge.window_start ? new Date(challenge.window_start).getTime() : now;
    let sendCount = challenge.send_count || 0;
    if (now - windowStart >= config.otp.rateWindowMs) {
      windowStart = now;
      sendCount = 0;
    }
    if (sendCount >= config.otp.maxSends) {
      throw tooManyRequests('Too many code requests. Try again later.');
    }

    await client.query(
      `UPDATE otp_challenges
          SET code_mac = $3, generation = $4,
              expires_at = now() + ($5 * interval '1 millisecond'),
              attempts = 0, consumed_at = NULL, last_sent_at = now(),
              window_start = to_timestamp($6 / 1000.0), send_count = $7,
              updated_at = now()
        WHERE phone = $1 AND purpose = $2`,
      [
        cleanPhone,
        purpose,
        otpMac(cleanPhone, purpose, generation, code),
        generation,
        config.otp.ttlMs,
        windowStart,
        sendCount + 1,
      ],
    );
  });

  try {
    await sendWhatsappOtp(cleanPhone, code);
    console.log('WhatsApp OTP accepted by provider', {
      purpose,
      phoneSuffix: cleanPhone.slice(-2),
    });
  } catch (err) {
    console.error('WhatsApp OTP delivery failed', { purpose, error: err.message });
    await query(
      `UPDATE otp_challenges SET code_mac = NULL, expires_at = NULL, updated_at = now()
        WHERE phone = $1 AND purpose = $2 AND generation = $3`,
      [cleanPhone, purpose, generation],
    ).catch(() => {});
    throw unavailable('Could not send the WhatsApp code. Please try again.');
  }
  return OTP_ACCEPTED;
}

async function consumeOtp(client, phone, purpose, code) {
  const { rows } = await client.query(
    'SELECT * FROM otp_challenges WHERE phone = $1 AND purpose = $2 FOR UPDATE',
    [phone, purpose],
  );
  const challenge = rows[0];
  const expired = !challenge?.expires_at || new Date(challenge.expires_at) <= new Date();
  const unusable = !challenge?.code_mac || challenge.consumed_at || challenge.attempts >= config.otp.maxAttempts;
  let matches = false;
  if (!expired && !unusable && validOtpCode(code)) {
    const actual = Buffer.from(otpMac(phone, purpose, challenge.generation, code), 'hex');
    const expected = Buffer.from(challenge.code_mac, 'hex');
    matches = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }

  if (!matches) {
    if (challenge && !unusable) {
      await client.query(
        `UPDATE otp_challenges
            SET attempts = attempts + 1,
                code_mac = CASE WHEN attempts + 1 >= $3 THEN NULL ELSE code_mac END,
                updated_at = now()
          WHERE phone = $1 AND purpose = $2`,
        [phone, purpose, config.otp.maxAttempts],
      );
    }
    return false;
  }

  await client.query(
    `UPDATE otp_challenges
        SET code_mac = NULL, consumed_at = now(), updated_at = now()
      WHERE phone = $1 AND purpose = $2`,
    [phone, purpose],
  );
  return true;
}

async function register({ name, email, phone, password, otp, code }) {
  const cleanName = validate.requiredString(name, 'name', { min: 2, max: 120 });
  const cleanPhone = validate.phone(phone);
  const cleanEmail = validate.optionalEmail(email);
  const cleanPassword = validate.requiredString(password, 'password', { min: 6, max: 128 });
  const verificationCode = otp ?? code;
  if (!validOtpCode(verificationCode)) throw invalidOtp();

  const hash = await bcrypt.hash(cleanPassword, BCRYPT_ROUNDS);

  const result = await withTransaction(async (client) => {
    if (!(await consumeOtp(client, cleanPhone, 'register', verificationCode))) {
      return { invalidOtp: true };
    }
    const existing = await client.query('SELECT 1 FROM users WHERE phone = ANY($1::text[])', [phoneAliases(cleanPhone)]);
    if (existing.rows.length) throw conflict('An account with this number already exists.');

    let rows;
    try {
      ({ rows } = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'USER')
         RETURNING *`,
        [cleanName, cleanEmail, cleanPhone, hash],
      ));
    } catch (err) {
      if (err.code === '23505') throw conflict('An account with these details already exists.');
      throw err;
    }
    const user = rows[0];
    const tokens = await issueTokens(client, user);
    await audit.record(client, {
      actorUserId: user.id,
      action: 'AUTH_REGISTER',
      entityType: 'user',
      entityId: user.id,
    });
    return { user: publicUser(user), ...tokens };
  });
  if (result.invalidOtp) throw invalidOtp();
  return result;
}

async function resetPassword({ phone, newPassword, password, otp, code }) {
  const cleanPhone = validate.phone(phone);
  const cleanPassword = validate.requiredString(newPassword ?? password, 'newPassword', { min: 6, max: 128 });
  const verificationCode = otp ?? code;
  if (!validOtpCode(verificationCode)) throw invalidOtp();
  const hash = await bcrypt.hash(cleanPassword, BCRYPT_ROUNDS);

  const result = await withTransaction(async (client) => {
    if (!(await consumeOtp(client, cleanPhone, 'password_reset', verificationCode))) {
      return { invalidOtp: true };
    }
    const { rows } = await client.query(
      `UPDATE users SET password_hash = $2, updated_at = now()
        WHERE phone = ANY($1::text[]) AND status = 'ACTIVE' RETURNING id`,
      [phoneAliases(cleanPhone), hash],
    );
    if (!rows[0]) return { invalidOtp: true };
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [rows[0].id],
    );
    await audit.record(client, {
      actorUserId: rows[0].id,
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'user',
      entityId: rows[0].id,
    });
    return { ok: true };
  });
  if (result.invalidOtp) throw invalidOtp();
  return result;
}

async function login({ phone, password }) {
  const cleanPhone = validate.phone(phone);
  if (typeof password !== 'string' || password.length === 0) {
    throw badRequest('password is required.');
  }

  const { rows } = await query('SELECT * FROM users WHERE phone = ANY($1::text[]) LIMIT 1', [phoneAliases(cleanPhone)]);
  const user = rows[0];

  // Compare against a fixed dummy hash when the user is missing so the response
  // time doesn't reveal whether the number is registered.
  const hashToCheck = user ? user.password_hash : '$2a$10$0000000000000000000000000000000000000000000000000000';
  const ok = await bcrypt.compare(password, hashToCheck);

  if (!user || !ok || user.status !== 'ACTIVE') {
    // Record the failure (section 5) without leaking which condition failed.
    await audit.record(pool, {
      actorUserId: user ? user.id : null,
      action: 'AUTH_LOGIN_FAILED',
      entityType: 'user',
      entityId: user ? user.id : null,
      metadata: { phone: cleanPhone },
    }).catch(() => {});
    throw unauthorized('Incorrect number or password.');
  }

  return withTransaction(async (client) => {
    const tokens = await issueTokens(client, user);
    await audit.record(client, {
      actorUserId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: user.id,
    });
    return { user: publicUser(user), ...tokens };
  });
}

/** Rotate a refresh token: validate, revoke the old, issue a new pair. */
async function refresh({ refreshToken }) {
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw badRequest('refreshToken is required.');
  }
  const tokenHash = hashToken(refreshToken);

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT rt.*, u.role, u.status
         FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1
        FOR UPDATE`,
      [tokenHash],
    );
    const record = rows[0];
    if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
      throw unauthorized('Session expired. Sign in again.');
    }
    if (record.status !== 'ACTIVE') throw unauthorized('Account is not active.');

    // Rotate: revoke the presented token, then mint a fresh pair.
    await client.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [record.id]);
    const user = { id: record.user_id, role: record.role };
    const tokens = await issueTokens(client, user);
    return tokens;
  });
}

async function logout({ refreshToken }) {
  if (typeof refreshToken === 'string' && refreshToken) {
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [
      hashToken(refreshToken),
    ]);
  }
  return { ok: true };
}

module.exports = { requestOtp, register, resetPassword, login, refresh, logout, publicUser };
