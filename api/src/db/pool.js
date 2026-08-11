/**
 * PostgreSQL connection pool (node-postgres).
 *
 * A single shared Pool for the whole process. Use `query()` for one-off
 * statements and `withTransaction()` when several writes must be atomic (e.g.
 * approving an application and creating the hospital + audit row together).
 */
const { Pool } = require('pg');
const config = require('../config');

const pool = config.db.connectionString
  ? new Pool({ connectionString: config.db.connectionString, ssl: config.db.ssl })
  : new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl,
    });

pool.on('error', (err) => {
  // A pooled client can error while idle (e.g. server restart). Log, don't crash.
  console.error('Unexpected idle client error', err);
});

/** Run a single parameterized query. */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run `fn` inside a transaction, passing it a dedicated client. Commits on
 * success, rolls back on any throw, and always releases the client.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
