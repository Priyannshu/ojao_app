/**
 * In-memory sliding-window rate limiter (per key = IP + optional user).
 *
 * ARCHITECTURE.md section 5 requires per-user/device/IP limits on nearby search
 * and OTP. This process-local limiter covers the single-instance first
 * production shape (section 6). When the API scales to multiple instances,
 * swap the store for Redis (section 6 notes Redis is optional until measured
 * demand) — the middleware contract stays the same.
 */
const { tooManyRequests } = require('../lib/errors');

function createRateLimiter({ windowMs, max, name = 'requests' }) {
  /** key -> array of request timestamps within the window */
  const hits = new Map();

  // Periodically drop stale keys so the map doesn't grow unbounded.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, windowMs);
  if (sweep.unref) sweep.unref(); // don't keep the event loop alive

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const cutoff = now - windowMs;
    const key = `${req.ip}:${req.user ? req.user.id : 'anon'}`;

    const times = (hits.get(key) || []).filter((t) => t > cutoff);
    if (times.length >= max) {
      const retryAfter = Math.ceil((times[0] + windowMs - now) / 1000);
      res.set('Retry-After', String(Math.max(retryAfter, 1)));
      return next(tooManyRequests(`Too many ${name}. Please slow down.`));
    }
    times.push(now);
    hits.set(key, times);
    next();
  };
}

module.exports = { createRateLimiter };
