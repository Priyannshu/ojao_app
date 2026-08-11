/**
 * Central configuration, loaded once from the environment.
 *
 * Every tunable the app reads lives here so there is a single place to see what
 * the service depends on. Values that are unsafe to default (JWT secrets) throw
 * in production if missing; discovery limits and rate windows have sane
 * defaults matching ARCHITECTURE.md section 3.
 */
require('dotenv').config();

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Env ${name} must be an integer, got "${raw}"`);
  return n;
}

function str(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

function bool(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1';
}

const nodeEnv = str('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';

/** In production a real secret is mandatory; in dev we fall back to a marker. */
function secret(name) {
  const v = process.env[name];
  if (!v) {
    if (isProd) throw new Error(`Missing required secret ${name} in production`);
    return `dev-insecure-${name}`;
  }
  return v;
}

const config = {
  nodeEnv,
  isProd,
  port: int('PORT', 8081),
  corsOrigins: str('CORS_ORIGINS', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    connectionString: str('DATABASE_URL', undefined),
    host: str('PGHOST', 'localhost'),
    port: int('PGPORT', 5432),
    user: str('PGUSER', 'ojao'),
    password: str('PGPASSWORD', 'ojao'),
    database: str('PGDATABASE', 'ojao'),
    ssl: str('PGSSLMODE', 'disable') === 'require' ? { rejectUnauthorized: false } : false,
  },

  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET'),
    refreshSecret: secret('JWT_REFRESH_SECRET'),
    accessTtl: int('ACCESS_TOKEN_TTL', 900), // 15 min
    refreshTtl: int('REFRESH_TOKEN_TTL', 2592000), // 30 days
  },

  otp: {
    hmacSecret: secret('OTP_HMAC_SECRET'),
    ttlMs: int('OTP_TTL_MS', 300000),
    resendCooldownMs: int('OTP_RESEND_COOLDOWN_MS', 60000),
    rateWindowMs: int('OTP_RATE_WINDOW_MS', 3600000),
    maxSends: int('OTP_MAX_SENDS_PER_WINDOW', 5),
    maxAttempts: int('OTP_MAX_VERIFY_ATTEMPTS', 5),
  },

  fast2sms: {
    apiKey: str('FAST2SMS_API_KEY', ''),
    phoneNumberId: str('FAST2SMS_PHONE_NUMBER_ID', ''),
    templateName: str('FAST2SMS_TEMPLATE_NAME', ''),
    templateLang: str('FAST2SMS_TEMPLATE_LANG', 'en_US'),
  },

  nearby: {
    maxRadiusMeters: int('NEARBY_MAX_RADIUS_METERS', 50000),
    maxLimit: int('NEARBY_MAX_LIMIT', 100),
    defaultLimit: int('NEARBY_DEFAULT_LIMIT', 20),
  },

  rateLimit: {
    windowMs: int('RATE_LIMIT_WINDOW_MS', 60000),
    nearbyMax: int('RATE_LIMIT_NEARBY_MAX', 60),
    authMax: int('RATE_LIMIT_AUTH_MAX', 10),
  },

  // Hybrid bridge (ARCHITECTURE.md migration): when enabled, an approved
  // Postgres hospital is mirrored into Firestore `facilities/{sameId}` so the
  // Flutter app — still Firestore-backed for queues/booking — shows it. Off by
  // default; the API runs normally without Firebase credentials.
  firestoreSync: {
    enabled: bool('FIRESTORE_SYNC_ENABLED', false),
    // Path to the Firebase service-account JSON (Admin SDK). Same project the
    // mobile app reads. Falls back to GOOGLE_APPLICATION_CREDENTIALS.
    credentialsPath: str('FIREBASE_CREDENTIALS', str('GOOGLE_APPLICATION_CREDENTIALS', '')),
    projectId: str('FIREBASE_PROJECT_ID', ''),
  },
};

module.exports = config;
