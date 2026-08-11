/**
 * Notification device-token registration (ARCHITECTURE.md section 3).
 *
 * Device tokens are registered through an AUTHENTICATED endpoint and bound to
 * the caller's user id — never treated as trusted client-supplied identity.
 * The backend owns actual dispatch (queue calls, reminders, verification
 * outcomes); this module just manages the registry of where to send.
 */
const express = require('express');
const { asyncHandler } = require('../../lib/errors');
const { authenticate } = require('../../middleware/auth');
const { query } = require('../../db/pool');
const validate = require('../../lib/validate');
const audit = require('../../lib/audit');
const { pool } = require('../../db/pool');

const router = express.Router();
router.use(authenticate);

/** Register (or refresh) a push token for the signed-in user. */
router.post('/device-tokens', asyncHandler(async (req, res) => {
  const token = validate.requiredString(req.body?.token, 'token', { max: 4096 });
  const platform = validate.optionalString(req.body?.platform, 'platform', { max: 32 });

  await query(
    `INSERT INTO device_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, token) DO UPDATE SET platform = EXCLUDED.platform`,
    [req.user.id, token, platform],
  );
  await audit.record(pool, {
    actorUserId: req.user.id,
    action: 'DEVICE_TOKEN_REGISTERED',
    entityType: 'device_token',
    metadata: { platform },
  });
  res.status(201).json({ ok: true });
}));

/** Unregister a token (e.g. on logout / uninstall). */
router.delete('/device-tokens', asyncHandler(async (req, res) => {
  const token = validate.requiredString(req.body?.token, 'token', { max: 4096 });
  await query('DELETE FROM device_tokens WHERE user_id = $1 AND token = $2', [req.user.id, token]);
  res.json({ ok: true });
}));

module.exports = router;
