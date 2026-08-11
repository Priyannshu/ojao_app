/**
 * Hospital routes — /api/v1/hospitals (ARCHITECTURE.md section 7).
 *
 *   GET   /nearby?latitude&longitude&radiusMeters&limit&offset  (public, rate-limited)
 *   GET   /:hospitalId                                          (public — verified only)
 *   PATCH /:hospitalId                                          (hospital admin / platform admin)
 */
const express = require('express');
const { asyncHandler } = require('../../lib/errors');
const { authenticate, requireHospitalAccess, optionalAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const config = require('../../config');
const service = require('./hospitals.service');

const router = express.Router();

const nearbyLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.nearbyMax,
  name: 'nearby searches',
});

router.get('/nearby', optionalAuth, nearbyLimiter, asyncHandler(async (req, res) => {
  res.json(await service.nearby(req.query));
}));

router.get('/:hospitalId', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.hospitalId));
}));

router.patch('/:hospitalId', authenticate, requireHospitalAccess, asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.hospitalId, req.body || {}, req.user.id));
}));

module.exports = router;
