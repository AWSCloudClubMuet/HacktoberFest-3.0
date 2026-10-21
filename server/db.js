// Database layer for the PERN backend.
//
// Two modes, same SQL everywhere:
//  - DATABASE_URL set  -> real PostgreSQL via `pg` Pool
//  - DATABASE_URL unset -> embedded PostgreSQL (PGlite) persisted to server/.data/
//    so the stack runs locally with zero setup, still on genuine Postgres SQL.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let pool = null
let pglite = null

export const dbMode = process.env.DATABASE_URL ? 'postgres (DATABASE_URL)' : 'postgres (embedded PGlite)'

export async function initDb() {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query('SELECT 1')
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    pglite = new PGlite(path.join(__dirname, '.data'))
    await pglite.waitReady
  }
}

export async function query(text, params = []) {
  if (pool) return pool.query(text, params)
  return pglite.query(text, params)
}

// For multi-statement SQL (schema DDL) which prepared-statement query() rejects.
export async function exec(text) {
  if (pool) return pool.query(text)
  return pglite.exec(text)
}

// Runs fn with a query function bound to a single connection/transaction.
export async function withTransaction(fn) {
  if (pool) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await fn((t, p = []) => client.query(t, p))
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
  await pglite.query('BEGIN')
  try {
    const result = await fn((t, p = []) => pglite.query(t, p))
    await pglite.query('COMMIT')
    return result
  } catch (err) {
    await pglite.query('ROLLBACK')
    throw err
  }
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  semester INTEGER NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Offering', 'Requesting')),
  category TEXT NOT NULL CHECK (category IN ('Programming', 'Design', 'Writing', 'Tutoring')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Paid', 'SkillSwap', 'Free')),
  budget NUMERIC NULL CHECK (budget IS NULL OR budget > 0),
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Cancelled')),
  accepted_applicant_id INTEGER NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id),
  applicant_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gig_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id),
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  reviewee_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gig_id, reviewer_id)
);
`
