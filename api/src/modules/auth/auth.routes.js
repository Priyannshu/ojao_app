/**
 * Auth routes — /api/v1/auth (ARCHITECTURE.md section 7).
 *
 *   POST /otp/request { phone, purpose }                      -> { ok, message }
 *   POST /register  { name, email?, phone, password, otp }   -> { user, accessToken, refreshToken, expiresIn }
 *   POST /password/reset { phone, newPassword, otp }          -> { ok }
 *   POST /login     { phone, password }                      -> { user, accessToken, refreshToken, expiresIn }
 *   POST /refresh   { refreshToken }                         -> { accessToken, refreshToken, expiresIn }
 *   POST /logout    { refreshToken }                         -> { ok }
 *   GET  /me                                                 -> { user }   (Bearer access token)
 */
const express = require('express');
const { asyncHandler, notFound } = require('../../lib/errors');
const { authenticate } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { query } = require('../../db/pool');
const config = require('../../config');
const service = require('./auth.service');

const router = express.Router();

// Per-IP throttle on credential endpoints (section 5).
const authLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  name: 'auth attempts',
});

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  res.status(201).json(await service.register(req.body || {}));
}));

router.post('/otp/request', authLimiter, asyncHandler(async (req, res) => {
  res.status(202).json(await service.requestOtp(req.body || {}));
}));

router.post('/password/reset', authLimiter, asyncHandler(async (req, res) => {
  res.json(await service.resetPassword(req.body || {}));
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  res.json(await service.login(req.body || {}));
}));

router.post('/refresh', authLimiter, asyncHandler(async (req, res) => {
  res.json(await service.refresh(req.body || {}));
}));

router.post('/logout', asyncHandler(async (req, res) => {
  res.json(await service.logout(req.body || {}));
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw notFound('User not found.');
  res.json({ user: service.publicUser(rows[0]) });
}));

module.exports = router;
