// Campus Gig & SkillSwap Portal — PERN backend (Express + PostgreSQL).
//
// Endpoints required by HacktoberFest-3.0 issue #12:
//   GET    /api/gigs?category=&type=&payment_type=&q=&min_budget=&max_budget=&status=
//   POST   /api/gigs
//   POST   /api/applications
//   PATCH  /api/applications/:id
//   PATCH  /api/gigs/:id
//   POST   /api/reviews
// Plus: GET /api/users, GET /api/users/:id (profiles + computed reputation),
//       GET /api/applications, GET /api/reviews, GET /api/stats.
//
// No auth in scope for the hackathon build: the acting user is sent as
// `user_id` in the request body (the frontend has a user switcher so both
// sides of a gig can be demoed). All ownership rules are enforced here.
import cors from 'cors'
import express from 'express'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { SCHEMA, dbMode, exec, initDb, query, withTransaction } from './db.js'
import { seedIfEmpty } from './seed.js'
import { DEMO_PASSWORD, auth } from './auth.js'

const app = express()
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }))

// Better Auth owns /api/auth/* (sign-up, sign-in, session, sign-out).
// Mounted before express.json() because it reads the raw request body.
if (auth) app.all('/api/auth/*', toNodeHandler(auth))
app.use(express.json())

// Resolves the signed-in session (if any) to a domain profile id.
// Identity = Better Auth session -> users.email -> users.id.
app.use('/api', async (req, _res, next) => {
  req.domainUserId = null
  req.sessionUser = null
  if (auth) {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
      if (session?.user?.email) {
        req.sessionUser = session.user
        const { rows } = await query('SELECT id FROM users WHERE email = $1', [session.user.email])
        req.domainUserId = rows[0]?.id ?? null
      }
    } catch { /* no session — public reads still work */ }
  }
  next()
})

// Who is acting? With auth on, only the session counts (401/403 otherwise).
// With auth off (no DATABASE_URL), fall back to the body user_id for local dev.
function actorId(req, res, bodyUserId) {
  if (!auth) return bodyUserId ? Number(bodyUserId) : null
  if (!req.sessionUser) { fail(res, 401, 'Sign in required'); return null }
  if (!req.domainUserId) { fail(res, 403, 'No profile for this account yet — finish signing up'); return null }
  return req.domainUserId
}

app.get('/api/me', async (req, res) => {
  if (!auth) return res.json({ auth: false })
  if (!req.sessionUser) return fail(res, 401, 'Not signed in')
  if (!req.domainUserId) return res.json({ user: req.sessionUser, profile: null })
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.domainUserId])
  res.json({ user: req.sessionUser, profile: rows[0] })
})

// Creates the domain profile for a freshly signed-up account (session required).
app.post('/api/profile', async (req, res) => {
  if (!auth) return fail(res, 400, 'Auth is not enabled')
  if (!req.sessionUser) return fail(res, 401, 'Sign in required')
  if (req.domainUserId) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.domainUserId])
    return res.json(rows[0])
  }
  const { major, semester, bio, skills } = req.body || {}
  if (!major?.trim()) return fail(res, 400, 'Major is required')
  if (!(Number(semester) >= 1 && Number(semester) <= 12)) return fail(res, 400, 'Semester must be between 1 and 12')
  const skillList = Array.isArray(skills) ? skills : String(skills || '').split(',').map((s) => s.trim()).filter(Boolean)
  const { rows } = await query(
    'INSERT INTO users (name, major, semester, bio, skills, email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.sessionUser.name, major.trim(), Number(semester), (bio || '').trim(), skillList, req.sessionUser.email],
  )
  res.status(201).json(rows[0])
})

const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring']
const TYPES = ['Offering', 'Requesting']
const PAYMENT_TYPES = ['Paid', 'SkillSwap', 'Free']

// A stored 'Open' gig whose deadline has passed is presented as Expired.
const DERIVED_STATUS = `CASE WHEN g.status = 'Open' AND g.deadline < CURRENT_DATE THEN 'Expired' ELSE g.status END`

const fail = (res, status, message) => res.status(status).json({ error: message })
const isExpired = (gig) => gig.status === 'Open' && new Date(gig.deadline) < new Date(new Date().toISOString().slice(0, 10))

async function getGig(id) {
  const { rows } = await query(
    `SELECT g.*, ${DERIVED_STATUS} AS display_status,
            u.name AS owner_name, u.major AS owner_major
       FROM gigs g JOIN users u ON u.id = g.user_id WHERE g.id = $1`,
    [id],
  )
  return rows[0] || null
}

app.get('/api/health', async (_req, res) => {
  const { rows } = await query('SELECT COUNT(*)::int AS users FROM users')
  res.json({ ok: true, db: dbMode, users: rows[0].users })
})

app.get('/api/stats', async (_req, res) => {
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM gigs g WHERE ${DERIVED_STATUS} = 'Open') AS open_gigs,
       (SELECT COUNT(*)::int FROM users) AS active_students,
       (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews) AS avg_rating,
       (SELECT COUNT(*)::int FROM reviews) AS review_count`,
  )
  res.json(rows[0])
})

// ---------- Users / profiles ----------
app.get('/api/users', async (_req, res) => {
  const { rows } = await query(
    `SELECT u.*,
            (SELECT COUNT(*)::int FROM gigs g WHERE g.user_id = u.id) AS gigs_posted,
            (SELECT COUNT(*)::int FROM gigs g WHERE g.status = 'Completed' AND (g.user_id = u.id OR g.accepted_applicant_id = u.id)) AS gigs_completed,
            (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.reviewee_id = u.id) AS average_rating,
            (SELECT COUNT(*)::int FROM reviews r WHERE r.reviewee_id = u.id) AS review_count
       FROM users u ORDER BY u.id`,
  )
  res.json(rows.map((u) => ({ ...u, average_rating: u.average_rating ? Number(u.average_rating) : null })))
})

app.get('/api/users/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT u.*,
            (SELECT COUNT(*)::int FROM gigs g WHERE g.user_id = u.id) AS gigs_posted,
            (SELECT COUNT(*)::int FROM gigs g WHERE g.status = 'Completed' AND (g.user_id = u.id OR g.accepted_applicant_id = u.id)) AS gigs_completed,
            (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.reviewee_id = u.id) AS average_rating,
            (SELECT COUNT(*)::int FROM reviews r WHERE r.reviewee_id = u.id) AS review_count
       FROM users u WHERE u.id = $1`,
    [req.params.id],
  )
  if (!rows[0]) return fail(res, 404, 'User not found')
  const { rows: reviews } = await query(
    `SELECT r.*, ru.name AS reviewer_name, g.title AS gig_title
       FROM reviews r JOIN users ru ON ru.id = r.reviewer_id JOIN gigs g ON g.id = r.gig_id
      WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC`,
    [req.params.id],
  )
  const user = rows[0]
  res.json({ ...user, average_rating: user.average_rating ? Number(user.average_rating) : null, reviews_received: reviews })
})

// ---------- Gigs ----------
app.get('/api/gigs', async (req, res) => {
  const { q, category, type, payment_type, min_budget, max_budget, status } = req.query
  const where = []
  const params = []
  const add = (build) => { where.push(build(params)) }

  if (q) add((p) => { p.push(`%${q}%`, `%${q}%`); return `(g.title ILIKE $${p.length - 1} OR g.description ILIKE $${p.length})` })
  if (category) add((p) => { p.push(category); return `g.category = $${p.length}` })
  if (type) add((p) => { p.push(type); return `g.type = $${p.length}` })
  if (payment_type) add((p) => { p.push(payment_type); return `g.payment_type = $${p.length}` })
  if (min_budget) add((p) => { p.push(Number(min_budget)); return `g.budget >= $${p.length}` })
  if (max_budget) add((p) => { p.push(Number(max_budget)); return `g.budget <= $${p.length}` })
  if (status) add((p) => { p.push(status); return `${DERIVED_STATUS} = $${p.length}` })

  let sql = `SELECT g.*, ${DERIVED_STATUS} AS display_status,
                    u.name AS owner_name, u.major AS owner_major,
                    (SELECT COUNT(*)::int FROM applications a WHERE a.gig_id = g.id) AS applications_count
               FROM gigs g JOIN users u ON u.id = g.user_id`
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`
  sql += ` ORDER BY CASE ${DERIVED_STATUS} WHEN 'Open' THEN 0 WHEN 'In Progress' THEN 1 WHEN 'Completed' THEN 2 WHEN 'Expired' THEN 3 ELSE 4 END, g.id DESC`
  const { rows } = await query(sql, params)
  res.json(rows)
})

app.get('/api/gigs/:id', async (req, res) => {
  const gig = await getGig(req.params.id)
  if (!gig) return fail(res, 404, 'Gig not found')
  res.json(gig)
})

app.post('/api/gigs', async (req, res) => {
  const { title, description, type, category, payment_type, budget, deadline } = req.body || {}
  const user_id = actorId(req, res, req.body?.user_id)
  if (user_id === null) { if (!auth) return fail(res, 400, 'user_id is required'); return }
  if (!title?.trim()) return fail(res, 400, 'Title is required')
  if (!description?.trim()) return fail(res, 400, 'Description is required')
  if (!TYPES.includes(type)) return fail(res, 400, `Type must be one of: ${TYPES.join(', ')}`)
  if (!CATEGORIES.includes(category)) return fail(res, 400, `Category must be one of: ${CATEGORIES.join(', ')}`)
  if (!PAYMENT_TYPES.includes(payment_type)) return fail(res, 400, `Payment type must be one of: ${PAYMENT_TYPES.join(', ')}`)
  if (payment_type === 'Paid' && !(Number(budget) > 0)) return fail(res, 400, 'Budget is required for paid gigs')
  if (payment_type !== 'Paid' && budget !== null && budget !== undefined && budget !== '') return fail(res, 400, 'Budget is only allowed for paid gigs')
  if (!deadline || Number.isNaN(Date.parse(deadline))) return fail(res, 400, 'A valid deadline is required')
  if (new Date(deadline) < new Date(new Date().toISOString().slice(0, 10))) return fail(res, 400, 'Deadline cannot be in the past')

  const { rows: owner } = await query('SELECT id FROM users WHERE id = $1', [user_id])
  if (!owner[0]) return fail(res, 404, 'User not found')

  const { rows } = await query(
    `INSERT INTO gigs (user_id, title, description, type, category, payment_type, budget, deadline)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [user_id, title.trim(), description.trim(), type, category, payment_type, payment_type === 'Paid' ? Number(budget) : null, deadline],
  )
  res.status(201).json(await getGig(rows[0].id))
})

app.patch('/api/gigs/:id', async (req, res) => {
  const { status } = req.body || {}
  const user_id = actorId(req, res, req.body?.user_id)
  if (user_id === null) { if (!auth) return fail(res, 400, 'user_id is required'); return }
  const gig = await getGig(req.params.id)
  if (!gig) return fail(res, 404, 'Gig not found')
  if (Number(user_id) !== gig.user_id) return fail(res, 403, 'Only the gig owner may change gig status')
  if (!status) return fail(res, 400, 'status is required')

  // Allowed transitions: completion only from In Progress; cancel from Open.
  const allowed = { 'In Progress': ['Completed'], Open: ['Cancelled'] }
  if (!(allowed[gig.status] || []).includes(status)) {
    return fail(res, 422, `Cannot change a ${gig.display_status} gig to ${status}`)
  }
  await query('UPDATE gigs SET status = $1 WHERE id = $2', [status, gig.id])
  res.json(await getGig(gig.id))
})

// ---------- Applications ----------
app.get('/api/applications', async (req, res) => {
  const { applicant_id, gig_id } = req.query
  const where = []
  const params = []
  if (applicant_id) { params.push(applicant_id); where.push(`a.applicant_id = $${params.length}`) }
  if (gig_id) { params.push(gig_id); where.push(`a.gig_id = $${params.length}`) }
  const { rows } = await query(
    `SELECT a.*, g.title AS gig_title, ${DERIVED_STATUS} AS gig_status, g.user_id AS gig_owner_id,
            u.name AS applicant_name, u.major AS applicant_major
       FROM applications a
       JOIN gigs g ON g.id = a.gig_id
       JOIN users u ON u.id = a.applicant_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY a.created_at DESC`,
    params,
  )
  res.json(rows)
})

app.post('/api/applications', async (req, res) => {
  const { gig_id, message } = req.body || {}
  const applicant_id = actorId(req, res, req.body?.applicant_id)
  if (applicant_id === null) { if (!auth) return fail(res, 400, 'applicant_id is required'); return }
  if (!gig_id) return fail(res, 400, 'gig_id is required')
  if (!message?.trim()) return fail(res, 400, 'A short application message is required')

  const gig = await getGig(gig_id)
  if (!gig) return fail(res, 404, 'Gig not found')
  if (Number(applicant_id) === gig.user_id) return fail(res, 422, 'You cannot apply to your own gig')
  if (gig.display_status !== 'Open') return fail(res, 422, `This gig is ${gig.display_status} and is not accepting applications`)

  const { rows: existing } = await query('SELECT id FROM applications WHERE gig_id = $1 AND applicant_id = $2', [gig_id, applicant_id])
  if (existing[0]) return fail(res, 422, 'You have already applied to this gig')

  try {
    const { rows } = await query(
      'INSERT INTO applications (gig_id, applicant_id, message) VALUES ($1,$2,$3) RETURNING *',
      [gig_id, applicant_id, message.trim()],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') return fail(res, 422, 'You have already applied to this gig')
    throw err
  }
})

app.patch('/api/applications/:id', async (req, res) => {
  const { status } = req.body || {}
  const user_id = actorId(req, res, req.body?.user_id)
  if (user_id === null) { if (!auth) return fail(res, 400, 'user_id is required'); return }
  if (!['Accepted', 'Rejected'].includes(status)) return fail(res, 400, 'status must be Accepted or Rejected')

  const { rows } = await query('SELECT * FROM applications WHERE id = $1', [req.params.id])
  const application = rows[0]
  if (!application) return fail(res, 404, 'Application not found')
  const gig = await getGig(application.gig_id)
  if (Number(user_id) !== gig.user_id) return fail(res, 403, 'Only the gig owner may review applications')
  if (application.status !== 'Pending') return fail(res, 422, `Application is already ${application.status}`)

  if (status === 'Rejected') {
    await query('UPDATE applications SET status = $1 WHERE id = $2', ['Rejected', application.id])
  } else {
    if (gig.display_status !== 'Open') return fail(res, 422, `Cannot accept an applicant for a ${gig.display_status} gig`)
    // Accept one applicant: gig -> In Progress, remaining Pending -> Rejected.
    await withTransaction(async (q) => {
      await q('UPDATE applications SET status = $1 WHERE id = $2', ['Accepted', application.id])
      await q('UPDATE applications SET status = $1 WHERE gig_id = $2 AND status = $3 AND id <> $4', ['Rejected', gig.id, 'Pending', application.id])
      await q('UPDATE gigs SET status = $1, accepted_applicant_id = $2 WHERE id = $3', ['In Progress', application.applicant_id, gig.id])
    })
  }
  const { rows: updated } = await query('SELECT * FROM applications WHERE id = $1', [application.id])
  res.json(updated[0])
})

// ---------- Reviews ----------
app.get('/api/reviews', async (req, res) => {
  const { gig_id, reviewee_id, reviewer_id } = req.query
  const where = []
  const params = []
  if (gig_id) { params.push(gig_id); where.push(`r.gig_id = $${params.length}`) }
  if (reviewee_id) { params.push(reviewee_id); where.push(`r.reviewee_id = $${params.length}`) }
  if (reviewer_id) { params.push(reviewer_id); where.push(`r.reviewer_id = $${params.length}`) }
  const { rows } = await query(
    `SELECT r.*, ru.name AS reviewer_name, g.title AS gig_title
       FROM reviews r JOIN users ru ON ru.id = r.reviewer_id JOIN gigs g ON g.id = r.gig_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.created_at DESC`,
    params,
  )
  res.json(rows)
})

app.post('/api/reviews', async (req, res) => {
  const { gig_id, rating, comment } = req.body || {}
  const reviewer_id = actorId(req, res, req.body?.reviewer_id)
  if (reviewer_id === null) { if (!auth) return fail(res, 400, 'reviewer_id is required'); return }
  if (!gig_id) return fail(res, 400, 'gig_id is required')
  if (!(Number(rating) >= 1 && Number(rating) <= 5)) return fail(res, 400, 'Rating must be between 1 and 5')

  const gig = await getGig(gig_id)
  if (!gig) return fail(res, 404, 'Gig not found')
  if (gig.status !== 'Completed') return fail(res, 422, 'Reviews are only allowed after a gig is completed')

  const reviewer = Number(reviewer_id)
  const isOwner = reviewer === gig.user_id
  const isAccepted = reviewer === gig.accepted_applicant_id
  if (!isOwner && !isAccepted) return fail(res, 403, 'Only the gig owner and the accepted applicant may review this gig')
  const reviewee_id = isOwner ? gig.accepted_applicant_id : gig.user_id
  if (!reviewee_id) return fail(res, 422, 'This gig has no accepted applicant to review')

  const { rows: existing } = await query('SELECT id FROM reviews WHERE gig_id = $1 AND reviewer_id = $2', [gig_id, reviewer])
  if (existing[0]) return fail(res, 422, 'You have already reviewed this gig')

  try {
    const { rows } = await query(
      'INSERT INTO reviews (gig_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [gig_id, reviewer, reviewee_id, Number(rating), (comment || '').trim()],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') return fail(res, 422, 'You have already reviewed this gig')
    throw err
  }
})

async function seedAuthAccounts() {
  if (!auth) return
  try {
    const { rows: tables } = await query(`SELECT to_regclass('public."user"') AS t`)
    if (!tables[0].t) { console.log('Better Auth tables not found — run: node migrate-auth.mjs'); return }
    const { rows: us } = await query('SELECT name, email FROM users WHERE email IS NOT NULL ORDER BY id')
    let created = 0
    for (const u of us) {
      const { rows: existing } = await query('SELECT id FROM "user" WHERE email = $1', [u.email])
      if (!existing[0]) {
        await auth.api.signUpEmail({ body: { name: u.name, email: u.email, password: DEMO_PASSWORD } })
        created++
      }
    }
    if (created) console.log(`Better Auth: created ${created} demo accounts (password: ${DEMO_PASSWORD})`)
  } catch (err) {
    console.log('Better Auth account seeding skipped:', err.message)
  }
}

const PORT = process.env.API_PORT || 4000
await initDb()
await exec(SCHEMA)
const seeded = await seedIfEmpty()
await seedAuthAccounts()
console.log(`Campus Gig API on http://localhost:${PORT} — db: ${dbMode}${seeded ? ' (seeded: 12 users, 25 gigs, 20 applications, 8 reviews)' : ''}`)
app.listen(PORT)
