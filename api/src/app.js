/**
 * Express application assembly (ARCHITECTURE.md section 1: single backend
 * service, versioned /api/v1 boundary, "do not split into microservices until
 * scale requires it").
 *
 * Wires the internal modules (section 3) as routers, applies global concerns
 * (CORS, JSON parsing, trust proxy for correct client IPs behind a load
 * balancer), and centralizes error handling so every failure returns the same
 * { error, message } shape the mobile client already understands.
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { ApiError } = require('./lib/errors');

const authRoutes = require('./modules/auth/auth.routes');
const hospitalRoutes = require('./modules/hospitals/hospitals.routes');
const applicationRoutes = require('./modules/applications/applications.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const auditRoutes = require('./modules/audit/audit.routes');

function createApp() {
  const app = express();

  // Behind an API gateway / load balancer (section 6) req.ip must reflect the
  // real client so rate limiting keys are correct.
  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // The mobile app is not a browser origin; CORS matters only for the admin
  // dashboard / web tooling. Empty list => reflect no cross-origin (same-origin
  // and non-browser clients still work).
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : false }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'ojao-api' }));

  const v1 = express.Router();
  v1.use('/auth', authRoutes);
  v1.use('/hospitals', hospitalRoutes);
  v1.use('/hospital-applications', applicationRoutes.applicant);
  v1.use('/admin', applicationRoutes.admin);
  v1.use('/admin', auditRoutes);
  v1.use('/notifications', notificationRoutes);
  app.use('/api/v1', v1);

  // 404 for anything unmatched.
  app.use((req, res) => {
    res.status(404).json({ error: 'not-found', message: `No route for ${req.method} ${req.path}` });
  });

  // Central error handler — maps ApiError to its status, everything else to 500
  // without leaking internals. Four args required for Express to treat it as an
  // error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.code, message: err.message });
    }
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'invalid-argument', message: 'Malformed JSON body.' });
    }
    console.error('Unhandled error', err);
    res.status(500).json({ error: 'internal', message: 'Something went wrong. Please try again.' });
  });

  return app;
}

module.exports = { createApp };
