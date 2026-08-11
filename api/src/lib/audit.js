/**
 * Audit logging (ARCHITECTURE.md sections 3 & 5).
 *
 * Records security-sensitive events: approvals, rejections, suspensions,
 * profile changes, login failures, payment verification failures. Never log
 * exact patient coordinates here — pass coarse metadata only.
 *
 * Accepts either the shared pool or a transaction client so an audit row can be
 * written atomically with the decision it records.
 */
async function record(exec, { actorUserId = null, action, entityType, entityId = null, metadata = {} }) {
  await exec.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorUserId, action, entityType, entityId != null ? String(entityId) : null, metadata],
  );
}

module.exports = { record };
