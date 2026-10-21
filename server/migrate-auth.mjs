// Creates/updates Better Auth's own tables (user, session, account, verification).
import { getMigrations } from './node_modules/better-auth/dist/db/get-migration.mjs'
import { auth } from './auth.js'

if (!auth) throw new Error('DATABASE_URL not set — Better Auth needs a real PostgreSQL connection')
const { runMigrations } = await getMigrations(auth.options)
await runMigrations()
console.log('Better Auth tables migrated')
process.exit(0)
