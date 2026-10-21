import express from 'express'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.CAMPUSLOOP_DB_PATH || path.join(__dirname, 'db.json')
const app = express()
app.use(cors())
app.use(express.json())

const readDb = async () => JSON.parse(await fs.readFile(dbPath, 'utf8'))
const writeDb = async (db) => fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`)
const nextId = (rows) => String(Math.max(0, ...rows.map((x) => Number(x.id))) + 1)
const sessions = new Map()
const defaultEmail = (name) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@campus.edu`
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex')
const safeUser = ({ password_hash, password_salt, ...user }) => user
const publicUser = (user) => { const { email, ...publicFields } = safeUser(user); return publicFields }

const initializeAuth = async () => {
  const db = await readDb()
  let changed = false
  db.users = db.users.map((user) => {
    if (user.password_hash && user.email) return user
    const salt = crypto.randomBytes(16).toString('hex')
    changed = true
    return { ...user, email: user.email || defaultEmail(user.name), password_salt: salt, password_hash: hashPassword('campus123', salt) }
  })
  if (!db.reset_tokens) { db.reset_tokens = []; changed = true }
  if (changed) await writeDb(db)
}

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const session = token && sessions.get(token)
  if (!session || session.expires_at < Date.now()) { if (token) sessions.delete(token); return res.status(401).json({ error: 'Please sign in to continue.' }) }
  const db = await readDb()
  const user = db.users.find((item) => item.id === session.user_id)
  if (!user) return res.status(401).json({ error: 'Your session is no longer valid.' })
  req.authToken = token
  req.user = user
  next()
}
const userWithStats = (db, user) => {
  if (!user) return null
  const received = db.reviews.filter((r) => r.reviewee_id === user.id)
  const average = received.length ? received.reduce((sum, r) => sum + r.rating, 0) / received.length : 0
  return { ...publicUser(user), average_rating: Number(average.toFixed(1)), reviews_count: received.length }
}
const enrich = (db, gig) => ({
  ...gig,
  owner: userWithStats(db, db.users.find((u) => u.id === gig.user_id)),
  applications_count: db.applications.filter((a) => a.gig_id === gig.id).length,
})
const expired = (gig) => gig.status === 'Open' && new Date(gig.deadline) < new Date()

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/auth/login', async (req, res) => {
  const db = await readDb()
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = db.users.find((item) => item.email.toLowerCase() === email)
  if (!user || hashPassword(String(req.body.password || ''), user.password_salt) !== user.password_hash) return res.status(401).json({ error: 'Email or password is incorrect.' })
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { user_id: user.id, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  res.json({ token, user: safeUser(user) })
})

app.post('/api/auth/register', async (req, res) => {
  const db = await readDb()
  const { name, major, semester } = req.body
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  if (!name?.trim() || !major?.trim() || !email || !semester) return res.status(400).json({ error: 'Please complete every field.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  if (db.users.some((user) => user.email.toLowerCase() === email)) return res.status(409).json({ error: 'An account with this email already exists.' })
  const salt = crypto.randomBytes(16).toString('hex')
  const user = { id: nextId(db.users), name: name.trim(), email, major: major.trim(), semester: Number(semester), bio: 'New to CampusLoop and ready to collaborate.', skills: [], avatar_color: '#397565', password_salt: salt, password_hash: hashPassword(password, salt) }
  db.users.push(user)
  await writeDb(db)
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { user_id: user.id, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  res.status(201).json({ token, user: safeUser(user) })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const db = await readDb()
  const received = db.reviews.filter((review) => review.reviewee_id === req.user.id)
  const average = received.length ? received.reduce((sum, review) => sum + review.rating, 0) / received.length : 0
  res.json({ ...safeUser(req.user), average_rating: Number(average.toFixed(1)), reviews_count: received.length, gigs_posted: db.gigs.filter((gig) => gig.user_id === req.user.id).length, gigs_completed: db.gigs.filter((gig) => gig.status === 'Completed' && (gig.user_id === req.user.id || gig.accepted_applicant_id === req.user.id)).length })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.authToken)
  res.json({ ok: true })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const db = await readDb()
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = db.users.find((item) => item.email.toLowerCase() === email)
  let demo_reset_token = null
  if (user) {
    db.reset_tokens = db.reset_tokens.filter((item) => item.user_id !== user.id && new Date(item.expires_at) > new Date())
    demo_reset_token = crypto.randomBytes(3).toString('hex').toUpperCase()
    db.reset_tokens.push({ token: demo_reset_token, user_id: user.id, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
    await writeDb(db)
  }
  res.json({ message: 'If that account exists, a reset code has been sent.', demo_reset_token })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const db = await readDb()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const record = db.reset_tokens.find((item) => item.token === String(req.body.token || '').trim().toUpperCase() && new Date(item.expires_at) > new Date())
  const user = record && db.users.find((item) => item.id === record.user_id && item.email.toLowerCase() === email)
  if (!user) return res.status(400).json({ error: 'That reset code is invalid or has expired.' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  const salt = crypto.randomBytes(16).toString('hex')
  user.password_salt = salt
  user.password_hash = hashPassword(password, salt)
  db.reset_tokens = db.reset_tokens.filter((item) => item !== record)
  await writeDb(db)
  for (const [token, session] of sessions) if (session.user_id === user.id) sessions.delete(token)
  res.json({ message: 'Password updated. You can now sign in.' })
})

app.patch('/api/users/me', requireAuth, async (req, res) => {
  const db = await readDb()
  const user = db.users.find((item) => item.id === req.user.id)
  if (req.body.name?.trim()) user.name = req.body.name.trim()
  if (req.body.major?.trim()) user.major = req.body.major.trim()
  if (req.body.bio !== undefined) user.bio = String(req.body.bio).trim().slice(0, 280)
  if (Array.isArray(req.body.skills)) user.skills = req.body.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 8)
  await writeDb(db)
  res.json(safeUser(user))
})

app.get('/api/users', async (_req, res) => {
  const db = await readDb()
  const users = db.users.map((user) => {
    const received = db.reviews.filter((r) => r.reviewee_id === user.id)
    const average_rating = received.length ? received.reduce((sum, r) => sum + r.rating, 0) / received.length : 0
    return {
      ...publicUser(user),
      average_rating: Number(average_rating.toFixed(1)),
      reviews_count: received.length,
      gigs_posted: db.gigs.filter((g) => g.user_id === user.id).length,
      gigs_completed: db.gigs.filter((g) => g.status === 'Completed' && (g.user_id === user.id || g.accepted_applicant_id === user.id)).length,
    }
  })
  res.json(users)
})

app.get('/api/gigs', async (req, res) => {
  const db = await readDb()
  const { category, type, payment_type, min_budget, max_budget, q, status, user_id } = req.query
  let rows = db.gigs.map((g) => expired(g) ? { ...g, status: 'Expired' } : g)
  if (category && category !== 'All') rows = rows.filter((g) => g.category === category)
  if (type && type !== 'All') rows = rows.filter((g) => g.type === type)
  if (payment_type && payment_type !== 'All') rows = rows.filter((g) => g.payment_type === payment_type)
  if (status && status !== 'All') rows = rows.filter((g) => g.status === status)
  if (user_id) rows = rows.filter((g) => g.user_id === user_id)
  if (min_budget) rows = rows.filter((g) => g.budget !== null && g.budget >= Number(min_budget))
  if (max_budget) rows = rows.filter((g) => g.budget !== null && g.budget <= Number(max_budget))
  if (q) {
    const needle = String(q).toLowerCase()
    rows = rows.filter((g) => `${g.title} ${g.description}`.toLowerCase().includes(needle))
  }
  res.json(rows.map((g) => enrich(db, g)))
})

app.get('/api/gigs/:id', async (req, res) => {
  const db = await readDb()
  const gig = db.gigs.find((g) => g.id === req.params.id)
  if (!gig) return res.status(404).json({ error: 'Gig not found.' })
  res.json(enrich(db, expired(gig) ? { ...gig, status: 'Expired' } : gig))
})

app.post('/api/gigs', requireAuth, async (req, res) => {
  const db = await readDb()
  const { title, description, type, category, payment_type, budget, deadline } = req.body
  const user_id = req.user.id
  if (![title, description, type, category, payment_type, deadline].every(Boolean)) return res.status(400).json({ error: 'Please complete every required field.' })
  if (!['Offering', 'Requesting'].includes(type) || !['Paid', 'SkillSwap', 'Free'].includes(payment_type)) return res.status(400).json({ error: 'Invalid gig type or payment type.' })
  if (payment_type === 'Paid' && (!Number(budget) || Number(budget) < 1)) return res.status(400).json({ error: 'Paid gigs require a valid budget.' })
  if (new Date(deadline) <= new Date()) return res.status(400).json({ error: 'Deadline must be in the future.' })
  const gig = { id: nextId(db.gigs), user_id, title: title.trim(), description: description.trim(), type, category, payment_type, budget: payment_type === 'Paid' ? Number(budget) : null, deadline, status: 'Open', accepted_applicant_id: null, created_at: new Date().toISOString() }
  db.gigs.unshift(gig)
  await writeDb(db)
  res.status(201).json(enrich(db, gig))
})

app.patch('/api/gigs/:id', requireAuth, async (req, res) => {
  const db = await readDb()
  const gig = db.gigs.find((g) => g.id === req.params.id)
  if (!gig) return res.status(404).json({ error: 'Gig not found.' })
  if (gig.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can change its status.' })
  const next = req.body.status
  const allowed = { Open: ['Cancelled'], 'In Progress': ['Completed'], Completed: [], Expired: [], Cancelled: [] }
  if (!allowed[gig.status]?.includes(next)) return res.status(400).json({ error: `Cannot move a gig from ${gig.status} to ${next}.` })
  gig.status = next
  await writeDb(db)
  res.json(enrich(db, gig))
})

app.get('/api/applications', requireAuth, async (req, res) => {
  const db = await readDb()
  let rows = db.applications
  if (req.query.applicant_id) rows = rows.filter((a) => a.applicant_id === req.user.id)
  if (req.query.gig_id) {
    const gig = db.gigs.find((item) => item.id === req.query.gig_id)
    rows = rows.filter((a) => a.gig_id === req.query.gig_id && (gig?.user_id === req.user.id || a.applicant_id === req.user.id))
  }
  res.json(rows.map((a) => ({ ...a, applicant: publicUser(db.users.find((u) => u.id === a.applicant_id)), gig: db.gigs.find((g) => g.id === a.gig_id) })))
})

app.post('/api/applications', requireAuth, async (req, res) => {
  const db = await readDb()
  const { gig_id, message } = req.body
  const applicant_id = req.user.id
  const gig = db.gigs.find((g) => g.id === gig_id)
  if (!gig) return res.status(404).json({ error: 'Gig not found.' })
  if (gig.user_id === applicant_id) return res.status(400).json({ error: 'You cannot apply to your own gig.' })
  if (gig.status !== 'Open' || expired(gig)) return res.status(400).json({ error: 'This gig is no longer accepting applications.' })
  if (db.applications.some((a) => a.gig_id === gig_id && a.applicant_id === applicant_id)) return res.status(409).json({ error: 'You have already applied to this gig.' })
  if (!message?.trim()) return res.status(400).json({ error: 'Add a short note to your application.' })
  const application = { id: nextId(db.applications), gig_id, applicant_id, message: message.trim(), status: 'Pending', created_at: new Date().toISOString() }
  db.applications.push(application)
  await writeDb(db)
  res.status(201).json(application)
})

app.patch('/api/applications/:id', requireAuth, async (req, res) => {
  const db = await readDb()
  const application = db.applications.find((a) => a.id === req.params.id)
  if (!application) return res.status(404).json({ error: 'Application not found.' })
  const gig = db.gigs.find((g) => g.id === application.gig_id)
  if (gig.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can manage applicants.' })
  if (gig.status !== 'Open' || application.status !== 'Pending') return res.status(400).json({ error: 'This application can no longer be changed.' })
  if (!['Accepted', 'Rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid application status.' })
  application.status = req.body.status
  if (req.body.status === 'Accepted') {
    gig.status = 'In Progress'
    gig.accepted_applicant_id = application.applicant_id
    db.applications.filter((a) => a.gig_id === gig.id && a.id !== application.id && a.status === 'Pending').forEach((a) => { a.status = 'Rejected' })
  }
  await writeDb(db)
  res.json(application)
})

app.get('/api/reviews', async (req, res) => {
  const db = await readDb()
  let rows = db.reviews
  if (req.query.gig_id) rows = rows.filter((r) => r.gig_id === req.query.gig_id)
  res.json(rows.map((r) => ({ ...r, reviewer: publicUser(db.users.find((u) => u.id === r.reviewer_id)) })))
})

app.post('/api/reviews', requireAuth, async (req, res) => {
  const db = await readDb()
  const { gig_id, reviewee_id, rating, comment } = req.body
  const reviewer_id = req.user.id
  const gig = db.gigs.find((g) => g.id === gig_id)
  if (!gig || gig.status !== 'Completed') return res.status(400).json({ error: 'Reviews are available after a gig is completed.' })
  const participants = [gig.user_id, gig.accepted_applicant_id]
  if (!participants.includes(reviewer_id) || !participants.includes(reviewee_id) || reviewer_id === reviewee_id) return res.status(403).json({ error: 'Only the owner and accepted applicant can review each other.' })
  if (db.reviews.some((r) => r.gig_id === gig_id && r.reviewer_id === reviewer_id)) return res.status(409).json({ error: 'You have already reviewed this gig.' })
  if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
  const review = { id: nextId(db.reviews), gig_id, reviewer_id, reviewee_id, rating: Number(rating), comment: String(comment || '').trim() }
  db.reviews.push(review)
  await writeDb(db)
  res.status(201).json(review)
})

app.post('/api/assistant', requireAuth, async (req, res) => {
  const db = await readDb()
  const message = String(req.body.message || '').trim().toLowerCase()
  if (!message) return res.status(400).json({ error: 'Ask the assistant a question first.' })
  const openGigs = db.gigs.filter((gig) => gig.status === 'Open' && !expired(gig) && gig.user_id !== req.user.id)
  const matches = (terms) => openGigs.filter((gig) => terms.some((term) => `${gig.title} ${gig.description} ${gig.category}`.toLowerCase().includes(term))).slice(0, 3)
  let reply = ''
  let suggested = []

  const category = ['programming', 'design', 'writing', 'tutoring'].find((item) => message.includes(item))
  if (category || /find|recommend|match|opportunit|gig/.test(message)) {
    const terms = category ? [category] : [...req.user.skills.map((skill) => skill.toLowerCase()), ...message.split(/\s+/).filter((word) => word.length > 4)]
    suggested = matches(terms)
    if (!suggested.length) suggested = openGigs.slice(0, 3)
    reply = suggested.length
      ? `I found ${suggested.length} open ${category ? `${category} ` : ''}opportunit${suggested.length === 1 ? 'y' : 'ies'} that ${suggested.length === 1 ? 'looks' : 'look'} promising. I prioritized your skills in ${req.user.skills.slice(0, 2).join(' and ') || 'collaboration'}.`
      : 'There are no matching open gigs right now. Try posting an offering so students can find you.'
  } else if (/apply|application|proposal|message|pitch/.test(message)) {
    const skills = req.user.skills.slice(0, 3).join(', ') || 'relevant campus projects'
    reply = `Here’s a strong starting point:\n\nHi! I’m ${req.user.name}, a ${req.user.major} student with experience in ${skills}. Your gig stood out to me, and I’d be glad to help. I can communicate progress clearly and work around the listed deadline. Happy to discuss the details!\n\nTip: add one specific example of similar work before sending it.`
  } else if (/reputation|rating|review|trust/.test(message)) {
    reply = 'Your reputation is calculated only from reviews left after completed gigs. The owner and accepted applicant can each leave one 1–5 star review. Complete work reliably, communicate early, and leave thoughtful reviews to build trust.'
  } else if (/post|create|offer|request/.test(message)) {
    reply = 'For a strong gig, use an outcome-focused title, describe exactly what “done” looks like, choose Offering or Requesting, set the payment type, and leave enough time before the deadline. I can help refine your description after you draft it.'
  } else if (/payment|paid|swap|free|budget/.test(message)) {
    reply = 'CampusLoop supports Paid, Skill Swap, and Free gigs. Paid gigs require a budget. Skill Swap works best when you clearly name the skill you can exchange, while Free gigs are ideal for peer support and community projects.'
  } else if (/hello|hi|hey/.test(message)) {
    reply = `Hi ${req.user.name.split(' ')[0]}! I’m Loop AI. I can find gigs that match your skills, draft an application, explain reputation, or help you plan a new gig.`
  } else {
    suggested = openGigs.slice(0, 3)
    reply = 'I can help with gig discovery, application writing, payment choices, deadlines, and reputation. Try asking “Find design gigs” or “Draft an application message.”'
  }

  res.json({ reply, suggested_gigs: suggested.map((gig) => enrich(db, gig)) })
})

await initializeAuth()
const port = Number(process.env.PORT || 3001)
app.listen(port, () => console.log(`CampusLoop API running at http://localhost:${port}`))
