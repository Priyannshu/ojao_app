/**
 * Audit log query — /api/v1/admin/audit-logs (PLATFORM_ADMIN only).
 *
 * Read surface over the immutable audit trail. Filter by entity or actor; the
 * API never exposes a way to mutate or delete audit rows.
 */
const express = require('express');
const { asyncHandler } = require('../../lib/errors');
const { authenticate, requireRole } = require('../../middleware/auth');
const { query } = require('../../db/pool');
const validate = require('../../lib/validate');

const router = express.Router();
router.use(authenticate, requireRole('PLATFORM_ADMIN'));

router.get('/audit-logs', asyncHandler(async (req, res) => {
  const limit = validate.limit(req.query.limit, 200, 50);
  const offset = validate.offset(req.query.offset);

  const conditions = [];
  const params = [];
  if (req.query.entityType) {
    params.push(req.query.entityType);
    conditions.push(`entity_type = $${params.length}`);
  }
  if (req.query.entityId) {
    params.push(req.query.entityId);
    conditions.push(`entity_id = $${params.length}`);
  }
  if (req.query.actorUserId) {
    params.push(req.query.actorUserId);
    conditions.push(`actor_user_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT id, actor_user_id, action, entity_type, entity_id, metadata, created_at
       FROM audit_logs ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  res.json({
    results: rows.map((r) => ({
      id: r.id,
      actorUserId: r.actor_user_id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      metadata: r.metadata,
      createdAt: r.created_at,
    })),
    pagination: { limit, offset, count: rows.length },
  });
}));

module.exports = router;
