// Better Auth instance for the Campus Gig API.
//
// Hosted in Express (mounted at /api/auth/* in index.js) and backed by the
// same PostgreSQL database as the rest of the app. Better Auth owns its
// tables ("user", "session", "account", "verification"); the domain profile
// lives in our `users` table and is linked to the auth account by email.
//
// Poster / Applicant are NOT auth roles — they are derived per gig from the
// signed-in user's relationship to that gig (see index.js).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

export const DEMO_PASSWORD = 'campus1234'

export const auth = process.env.DATABASE_URL
  ? betterAuth({
      database: new Pool({ connectionString: process.env.DATABASE_URL }),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      trustedOrigins: ['http://localhost:3000'],
      emailAndPassword: { enabled: true },
    })
  : null
