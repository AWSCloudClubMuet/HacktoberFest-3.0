const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const version = '001_initial_schema';
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (!applied.rowCount) {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schema);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
    }
    await client.query('COMMIT');
    console.log('ReliefHub database schema is up to date.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(error => {
    console.error(`Database migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { migrate };
