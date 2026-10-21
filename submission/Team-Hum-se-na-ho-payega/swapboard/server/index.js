'use strict';
/**
 * Swapboard backend. Plain Node (no npm install needed).
 * JSON file persistence in data/db.json, seeded on first run.
 *
 * "Who am I" is mocked: send the X-User-Id header with any request that needs a user.
 * All business rules live here, so the frontend (or Postman) can never bypass them.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildSeed, ENUMS } = require('./seed');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DB_FILE = path.join(ROOT, 'data', 'db.json');

/* ---------- persistence ---------- */
let db;
const save = () => {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
};
const load = () => {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { db = buildSeed(); save(); }
};

/* ---------- helpers ---------- */
class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
const fail = (status, message, details) => { throw new HttpError(status, message, details); };
const today = () => new Date().toISOString().slice(0, 10);
const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

// Open gigs whose deadline has passed are reported as Expired (computed, never stale).
const effStatus = (g) => (g.status === 'Open' && g.deadline < today() ? 'Expired' : g.status);

function ratingOf(uid) {
  const rs = db.reviews.filter((r) => r.reviewee_id === uid);
  const avg = rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : null;
  return { avg, count: rs.length };
}
function mini(uid) {
  const u = db.users.find((x) => x.id === uid);
  if (!u) return null;
  const r = ratingOf(uid);
  return { id: u.id, name: u.name, major: u.major, avg_rating: r.avg, review_count: r.count };
}
function userView(u) {
  const r = ratingOf(u.id);
  return {
    ...u,
    stats: {
      gigs_posted: db.gigs.filter((g) => g.user_id === u.id).length,
      gigs_completed: db.gigs.filter((g) => g.status === 'Completed' && (g.user_id === u.id || g.accepted_applicant_id === u.id)).length,
      avg_rating: r.avg, // always calculated from stored reviews
      review_count: r.count,
    },
  };
}
function gigView(g) {
  return {
    ...g,
    status: effStatus(g),
    owner: mini(g.user_id),
    accepted_applicant: g.accepted_applicant_id ? mini(g.accepted_applicant_id) : null,
    application_count: db.applications.filter((a) => a.gig_id === g.id).length,
  };
}
function appView(a) {
  const g = db.gigs.find((x) => x.id === a.gig_id);
  return { ...a, applicant: mini(a.applicant_id), gig: g && { id: g.id, title: g.title, status: effStatus(g), user_id: g.user_id } };
}
function reviewView(r) {
  const g = db.gigs.find((x) => x.id === r.gig_id);
  return { ...r, reviewer: mini(r.reviewer_id), reviewee: mini(r.reviewee_id), gig_title: g && g.title };
}

const me = (c) => {
  const u = db.users.find((x) => x.id === c.uid);
  if (!u) fail(401, 'Choose who you are acting as first (X-User-Id header).');
  return u;
};
const findOr404 = (list, id, label) => {
  const x = list.find((i) => i.id === Number(id));
  if (!x) fail(404, `${label} not found.`);
  return x;
};
const throwIfErrors = (e) => { if (Object.keys(e).length) fail(422, 'Please fix the highlighted fields.', e); };

/* ---------- validation ---------- */
function validateGigFields(b, e, { partial }) {
  const o = {};
  const has = (k) => !partial || b[k] !== undefined;
  if (has('title')) { o.title = str(b.title); if (o.title.length < 5 || o.title.length > 100) e.title = 'Title needs 5 to 100 characters.'; }
  if (has('description')) { o.description = str(b.description); if (o.description.length < 20 || o.description.length > 1000) e.description = 'Describe the gig in 20 to 1000 characters.'; }
  if (has('deadline')) { o.deadline = str(b.deadline); if (!isDate(o.deadline)) e.deadline = 'Pick a valid deadline.'; else if (o.deadline < today()) e.deadline = 'Deadline cannot be in the past.'; }
  return o;
}
function validateBudget(payment, b, e) {
  if (payment !== 'Paid') return null;
  const n = Number(b.budget);
  if (b.budget === '' || b.budget == null || !Number.isFinite(n) || n <= 0 || n > 1000000) { e.budget = 'Paid gigs need a budget between 1 and 1,000,000.'; return null; }
  return Math.round(n);
}
function validateUser(b, e) {
  const o = {};
  o.name = str(b.name); if (o.name.length < 2 || o.name.length > 60) e.name = 'Name needs 2 to 60 characters.';
  o.major = str(b.major); if (o.major.length < 2 || o.major.length > 60) e.major = 'Add your major.';
  o.semester = Number(b.semester); if (!Number.isInteger(o.semester) || o.semester < 1 || o.semester > 12) e.semester = 'Semester must be 1 to 12.';
  o.bio = str(b.bio); if (o.bio.length > 300) e.bio = 'Keep the bio under 300 characters.';
  const raw = Array.isArray(b.skills) ? b.skills : String(b.skills || '').split(',');
  o.skills = [...new Set(raw.map((s) => str(s)).filter(Boolean))].slice(0, 10);
  if (!o.skills.length) e.skills = 'List at least one skill.';
  return o;
}

/* ---------- routes ---------- */
const routes = [];
const route = (m, p, h) => routes.push([m, new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'), h]);

route('GET', '/meta', () => ENUMS);
route('POST', '/reset', () => { db = buildSeed(); save(); return { ok: true, message: 'Database reset to seed data.' }; });

/* users */
route('GET', '/users', (c) => {
  const q = str(c.query.q).toLowerCase();
  return db.users
    .filter((u) => !q || [u.name, u.major, ...u.skills].join(' ').toLowerCase().includes(q))
    .map(userView);
});
route('GET', '/users/:id', (c) => userView(findOr404(db.users, c.params.id, 'User')));
route('POST', '/users', (c) => {
  const e = {}; const o = validateUser(c.body, e); throwIfErrors(e);
  const u = { id: nextId(db.users), ...o };
  db.users.push(u); save();
  return [201, userView(u)];
});
route('PATCH', '/users/:id', (c) => {
  const u = findOr404(db.users, c.params.id, 'User');
  if (me(c).id !== u.id) fail(403, 'You can only edit your own profile.');
  const e = {}; const o = validateUser({ ...u, ...c.body }, e); throwIfErrors(e);
  Object.assign(u, o); save();
  return userView(u);
});

/* gigs */
route('GET', '/gigs', (c) => {
  const q = c.query;
  const words = str(q.q).toLowerCase().split(/\s+/).filter(Boolean);
  const min = q.min_budget !== undefined && q.min_budget !== '' ? Number(q.min_budget) : null;
  const max = q.max_budget !== undefined && q.max_budget !== '' ? Number(q.max_budget) : null;
  let list = db.gigs.filter((g) => {
    if (q.category && g.category !== q.category) return false;
    if (q.type && g.type !== q.type) return false;
    if (q.payment_type && g.payment_type !== q.payment_type) return false;
    if (q.status && effStatus(g) !== q.status) return false;
    if (q.user_id && g.user_id !== Number(q.user_id)) return false;
    if ((min !== null || max !== null) && g.budget == null) return false; // budget range only matches paid gigs
    if (min !== null && g.budget < min) return false;
    if (max !== null && g.budget > max) return false;
    const hay = (g.title + ' ' + g.description).toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  const sorts = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    deadline: (a, b) => a.deadline.localeCompare(b.deadline),
    budget_high: (a, b) => (b.budget ?? -1) - (a.budget ?? -1),
    budget_low: (a, b) => (a.budget ?? Infinity) - (b.budget ?? Infinity),
  };
  list.sort(sorts[q.sort] || sorts.newest);
  return list.map(gigView);
});
route('GET', '/gigs/:id', (c) => gigView(findOr404(db.gigs, c.params.id, 'Gig')));
route('POST', '/gigs', (c) => {
  const u = me(c); const b = c.body; const e = {};
  const o = validateGigFields(b, e, { partial: false });
  if (!ENUMS.types.includes(b.type)) e.type = 'Choose Offering or Requesting.';
  if (!ENUMS.categories.includes(b.category)) e.category = 'Choose a category.';
  if (!ENUMS.payment_types.includes(b.payment_type)) e.payment_type = 'Choose how this gig is paid.';
  const budget = validateBudget(b.payment_type, b, e);
  throwIfErrors(e);
  const g = {
    id: nextId(db.gigs), user_id: u.id, ...o, type: b.type, category: b.category, payment_type: b.payment_type,
    budget, status: 'Open', accepted_applicant_id: null, created_at: new Date().toISOString(),
  };
  db.gigs.push(g); save();
  return [201, gigView(g)];
});
route('PATCH', '/gigs/:id', (c) => {
  const u = me(c); const g = findOr404(db.gigs, c.params.id, 'Gig'); const b = c.body;
  if (g.user_id !== u.id) fail(403, 'Only the gig owner can change this gig.');
  const cur = effStatus(g);

  if (b.status !== undefined) {
    if (!ENUMS.gig_statuses.includes(b.status)) fail(422, 'Unknown status.', { status: 'Unknown status.' });
    const allowed = { Open: ['Cancelled'], Expired: ['Cancelled'], 'In Progress': ['Completed', 'Cancelled'] };
    if (!(allowed[cur] || []).includes(b.status)) {
      const why = b.status === 'Completed' ? 'A gig can only be completed from In Progress.'
        : b.status === 'In Progress' ? 'Accept an applicant to move a gig to In Progress.'
        : `A ${cur} gig cannot move to ${b.status}.`;
      fail(409, why);
    }
    g.status = b.status;
    if (b.status === 'Cancelled') db.applications.forEach((a) => { if (a.gig_id === g.id && a.status === 'Pending') a.status = 'Rejected'; });
  }

  const editing = ['title', 'description', 'deadline', 'budget'].some((k) => b[k] !== undefined);
  if (editing) {
    if (g.status !== 'Open') fail(409, 'Only open gigs can be edited.');
    const e = {}; const o = validateGigFields(b, e, { partial: true });
    if (b.budget !== undefined) o.budget = validateBudget(g.payment_type, b, e);
    throwIfErrors(e);
    Object.assign(g, o);
  }
  save();
  return gigView(g);
});

/* applications */
route('GET', '/applications', (c) => {
  const q = c.query; const u = me(c);
  const ownedGigIds = new Set(db.gigs.filter((g) => g.user_id === u.id).map((g) => g.id));
  return db.applications
    .filter((a) => a.applicant_id === u.id || ownedGigIds.has(a.gig_id)) // applicants and gig owners only
    .filter((a) => !q.gig_id || a.gig_id === Number(q.gig_id))
    .filter((a) => !q.applicant_id || a.applicant_id === Number(q.applicant_id))
    .filter((a) => !q.status || a.status === q.status)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(appView);
});
route('POST', '/applications', (c) => {
  const u = me(c); const b = c.body;
  const g = findOr404(db.gigs, b.gig_id, 'Gig');
  const message = str(b.message);
  if (message.length < 10 || message.length > 500) fail(422, 'Please fix the highlighted fields.', { message: 'Write 10 to 500 characters about why you are a fit.' });
  if (g.user_id === u.id) fail(403, 'You cannot apply to your own gig.');
  if (effStatus(g) !== 'Open') fail(409, `This gig is ${effStatus(g)} and no longer accepts applications.`);
  if (db.applications.some((a) => a.gig_id === g.id && a.applicant_id === u.id)) fail(409, 'You have already applied to this gig.');
  const a = { id: nextId(db.applications), gig_id: g.id, applicant_id: u.id, message, status: 'Pending', created_at: new Date().toISOString() };
  db.applications.push(a); save();
  return [201, appView(a)];
});
route('PATCH', '/applications/:id', (c) => {
  const u = me(c); const a = findOr404(db.applications, c.params.id, 'Application');
  const g = db.gigs.find((x) => x.id === a.gig_id);
  if (g.user_id !== u.id) fail(403, 'Only the gig owner can review applications.');
  const status = c.body.status;
  if (!['Accepted', 'Rejected'].includes(status)) fail(422, 'Status must be Accepted or Rejected.', { status: 'Status must be Accepted or Rejected.' });
  if (a.status !== 'Pending') fail(409, `This application was already ${a.status.toLowerCase()}.`);
  if (status === 'Accepted') {
    if (effStatus(g) !== 'Open') fail(409, `This gig is ${effStatus(g)}, so no one can be accepted.`);
    a.status = 'Accepted';
    g.status = 'In Progress';
    g.accepted_applicant_id = a.applicant_id;
    db.applications.forEach((o) => { if (o.gig_id === g.id && o.id !== a.id && o.status === 'Pending') o.status = 'Rejected'; });
  } else {
    a.status = 'Rejected';
  }
  save();
  return appView(a);
});

/* reviews */
route('GET', '/reviews', (c) => {
  const q = c.query;
  return db.reviews
    .filter((r) => !q.user_id || r.reviewee_id === Number(q.user_id))
    .filter((r) => !q.reviewer_id || r.reviewer_id === Number(q.reviewer_id))
    .filter((r) => !q.gig_id || r.gig_id === Number(q.gig_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(reviewView);
});
route('POST', '/reviews', (c) => {
  const u = me(c); const b = c.body;
  const g = findOr404(db.gigs, b.gig_id, 'Gig');
  if (g.status !== 'Completed') fail(409, 'Reviews open once a gig is completed.');
  const isOwner = g.user_id === u.id; const isWorker = g.accepted_applicant_id === u.id;
  if (!isOwner && !isWorker) fail(403, 'Only the gig owner and the accepted applicant can leave reviews.');
  if (db.reviews.some((r) => r.gig_id === g.id && r.reviewer_id === u.id)) fail(409, 'You have already reviewed this gig.');
  const e = {};
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) e.rating = 'Rate from 1 to 5.';
  const comment = str(b.comment);
  if (comment.length < 3 || comment.length > 500) e.comment = 'Leave a short comment (3 to 500 characters).';
  throwIfErrors(e);
  const r = { id: nextId(db.reviews), gig_id: g.id, reviewer_id: u.id, reviewee_id: isOwner ? g.accepted_applicant_id : g.user_id, rating, comment, created_at: new Date().toISOString() };
  db.reviews.push(r); save();
  return [201, reviewView(r)];
});

/* ---------- server ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
};
const send = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
};
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (d) => { raw += d; if (raw.length > 1e5) { reject(new HttpError(413, 'Payload too large.')); req.destroy(); } });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new HttpError(400, 'Body must be valid JSON.')); } });
});

const API_ROOTS = /^\/(?:api\/)?(meta|reset|users|gigs|applications|reviews)(\/|$)/;

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  const started = Date.now();

  if (API_ROOTS.test(url.pathname)) {
    const apiPath = url.pathname.replace(/^\/api/, '');
    try {
      const hit = routes.find(([m, re]) => m === req.method && re.test(apiPath));
      if (!hit) {
        const pathExists = routes.some(([, re]) => re.test(apiPath));
        throw new HttpError(pathExists ? 405 : 404, pathExists ? 'Method not allowed.' : 'No such endpoint.');
      }
      const params = apiPath.match(hit[1]).groups || {};
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
      const out = hit[2]({ params, query: Object.fromEntries(url.searchParams), body, uid: Number(req.headers['x-user-id']) });
      const [status, data] = Array.isArray(out) && typeof out[0] === 'number' ? out : [200, out];
      send(res, status, data);
      console.log(`${req.method} ${url.pathname}${url.search} ${status} ${Date.now() - started}ms`);
    } catch (err) {
      const status = err.status || 500;
      if (!err.status) console.error(err);
      send(res, status, { error: err.message, details: err.details || {} });
      console.log(`${req.method} ${url.pathname}${url.search} ${status} ${err.message}`);
    }
    return;
  }

  // static files + SPA fallback
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});

load();
server.listen(PORT, () => {
  console.log(`\n  Swapboard is running.\n  Open  http://localhost:${PORT}\n  API   http://localhost:${PORT}/api/gigs\n`);
});
