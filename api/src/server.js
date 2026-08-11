/**
 * Server entrypoint. Starts the HTTP listener and handles graceful shutdown so
 * in-flight requests finish and the pg pool drains on SIGTERM/SIGINT (relevant
 * for Cloud Run / ECS / Railway rolling deploys, section 6).
 */
const { createApp } = require('./app');
const config = require('./config');
const { pool } = require('./db/pool');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`ojao-api listening on :${config.port} (${config.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
