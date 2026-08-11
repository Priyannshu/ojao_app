/**
 * Authentication + authorization middleware.
 *
 * `authenticate` verifies the Bearer access token and attaches `req.user`.
 * `optionalAuth` attaches it when present but never rejects.
 * `requireRole(...roles)` enforces server-side role checks — client-supplied
 * role/ownership values are never trusted (ARCHITECTURE.md section 5).
 * `requireHospitalAccess` restricts hospital admins to their own hospital.
 */
const { verifyAccessToken } = require('../lib/tokens');
const { unauthorized, forbidden } = require('../lib/errors');
const { query } = require('../db/pool');

function bearer(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function authenticate(req, _res, next) {
  const token = bearer(req);
  if (!token) return next(unauthorized());
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (_err) {
    next(unauthorized('Session expired. Sign in again.'));
  }
}

function optionalAuth(req, _res, next) {
  const token = bearer(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch (_err) {
    // Ignore a bad token on public endpoints.
  }
  next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

/**
 * Allow the request only if the caller is a PLATFORM_ADMIN, or a HOSPITAL_ADMIN
 * assigned to the hospital named by `:hospitalId`. Assumes `authenticate` ran.
 */
async function requireHospitalAccess(req, _res, next) {
  try {
    if (!req.user) return next(unauthorized());
    if (req.user.role === 'PLATFORM_ADMIN') return next();
    if (req.user.role !== 'HOSPITAL_ADMIN') return next(forbidden());

    const hospitalId = req.params.hospitalId;
    const { rows } = await query(
      'SELECT 1 FROM hospital_admins WHERE user_id = $1 AND hospital_id = $2',
      [req.user.id, hospitalId],
    );
    if (rows.length === 0) return next(forbidden('You do not manage this hospital.'));
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, optionalAuth, requireRole, requireHospitalAccess };
