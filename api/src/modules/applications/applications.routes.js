/**
 * Application + verification routes (ARCHITECTURE.md section 7).
 *
 * Applicant-facing — /api/v1/hospital-applications (any signed-in user):
 *   POST /                          submit an application
 *   GET  /:applicationId            view own application
 *   POST /:applicationId/documents  attach a stored-document reference
 *
 * Admin — /api/v1/admin/hospital-applications (PLATFORM_ADMIN only):
 *   GET  /                          review queue (?status=&limit=&offset=)
 *   POST /:id/approve               approve -> creates hospital + admin link
 *   POST /:id/reject                reject with notes
 */
const express = require('express');
const { asyncHandler } = require('../../lib/errors');
const { authenticate, requireRole } = require('../../middleware/auth');
const service = require('./applications.service');

// Applicant-facing router.
const applicant = express.Router();
applicant.use(authenticate);

applicant.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body || {}, req.user.id));
}));

applicant.get('/mine', asyncHandler(async (req, res) => {
  res.json({ application: await service.getLatestForApplicant(req.user.id) });
}));

applicant.get('/:applicationId', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.applicationId, req.user));
}));

applicant.post('/:applicationId/documents', asyncHandler(async (req, res) => {
  res.status(201).json(await service.addDocument(req.params.applicationId, req.body || {}, req.user));
}));

// Admin router (mounted under /api/v1/admin).
const admin = express.Router();
admin.use(authenticate, requireRole('PLATFORM_ADMIN'));

admin.get('/hospital-applications', asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
}));

admin.post('/hospital-applications/:id/approve', asyncHandler(async (req, res) => {
  res.json(await service.approve(req.params.id, req.user.id, req.body || {}));
}));

admin.post('/hospital-applications/:id/reject', asyncHandler(async (req, res) => {
  res.json(await service.reject(req.params.id, req.user.id, req.body || {}));
}));

admin.post('/hospitals/:hospitalId/suspend', asyncHandler(async (req, res) => {
  res.json(await service.setHospitalActive(req.params.hospitalId, false, req.user.id, req.body || {}));
}));

admin.post('/hospitals/:hospitalId/reactivate', asyncHandler(async (req, res) => {
  res.json(await service.setHospitalActive(req.params.hospitalId, true, req.user.id, req.body || {}));
}));

module.exports = { applicant, admin };
