/**
 * Typed HTTP error + helpers.
 *
 * Mirrors the stable error-code vocabulary used by the existing OTP server
 * (server/auth.js) so the Flutter client's error messaging stays consistent
 * across both services. Throw these anywhere; the central error handler in
 * app.js maps them to `{ error, message }` + status.
 */
class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const badRequest = (m) => new ApiError('invalid-argument', m, 400);
const unauthorized = (m) => new ApiError('unauthenticated', m || 'Sign in required.', 401);
const forbidden = (m) => new ApiError('permission-denied', m || 'You do not have access.', 403);
const notFound = (m) => new ApiError('not-found', m || 'Not found.', 404);
const conflict = (m) => new ApiError('already-exists', m, 409);
const tooManyRequests = (m) => new ApiError('resource-exhausted', m || 'Too many requests.', 429);
const internal = (m) => new ApiError('internal', m || 'Something went wrong.', 500);
const unavailable = (m) => new ApiError('unavailable', m || 'Service temporarily unavailable.', 503);
const invalidOtp = () => new ApiError('invalid-otp', 'The code is invalid or expired.', 400);

/** Wrap an async route handler so thrown errors reach Express's error handler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
  ApiError,
  asyncHandler,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internal,
  unavailable,
  invalidOtp,
};
