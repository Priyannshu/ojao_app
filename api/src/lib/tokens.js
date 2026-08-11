/**
 * JWT + refresh-token utilities.
 *
 * Access tokens are short-lived, signed JWTs carrying { sub, role } — verified
 * on every request without a DB hit. Refresh tokens are opaque random strings;
 * only their SHA-256 hash is persisted (refresh_tokens table) so they are
 * revocable and a DB leak cannot be replayed. See ARCHITECTURE.md section 3.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.accessSecret, {
    subject: user.id,
    expiresIn: config.jwt.accessTtl,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret); // throws on invalid/expired
}

/** Generate an opaque refresh token and its storable hash + expiry. */
function newRefreshToken() {
  const token = crypto.randomBytes(48).toString('base64url');
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + config.jwt.refreshTtl * 1000),
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { signAccessToken, verifyAccessToken, newRefreshToken, hashToken };
