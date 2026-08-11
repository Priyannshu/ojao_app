/**
 * Migration runner. Applies db/schema.sql inside a single transaction.
 *
 * The schema is written to be idempotent (CREATE ... IF NOT EXISTS, guarded
 * enum creation), so this doubles as "ensure the database is up to date".
 * Run with: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
