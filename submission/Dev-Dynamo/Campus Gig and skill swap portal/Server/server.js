const express = require('express'), cors = require('cors'), fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'db.json');
if (!fs.existsSync(FILE)) require('./seed');
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = () => fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
const app = express(); app.use(cors()); app.use(express.json());
const PUB = path.join(__dirname, 'public');
app.use(express.static(PUB));
// Browser page loads (Accept: text/html) get the React app; fetch() calls get the JSON API
app.use((req, res, next) => (req.method === 'GET' && (req.headers.accept || '').includes('text/html') && fs.existsSync(path.join(PUB, 'index.html'))) ? res.sendFile(path.join(PUB, 'index.html')) : next());
const today = () => new Date().toISOString().slice(0, 10);
const view = g => ({ ...g, status: g.status === 'Open' && g.deadline < today() ? 'Expired' : g.status });
const nextId = arr => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const stats = u => {
  const rv = db.reviews.filter(r => r.reviewee_id === u.id);
  return { ...u, gigs_posted: db.gigs.filter(g => g.user_id === u.id).length,
    gigs_completed: db.gigs.filter(g => g.status === 'Completed' && (g.user_id === u.id || g.accepted_applicant_id === u.id)).length,
    review_count: rv.length, average_rating: rv.length ? +(rv.reduce((s, r) => s + r.rating, 0) / rv.length).toFixed(2) : null };
};
// Users
app.get('/users', (q, r) => r.json(db.users.map(stats)));
app.get('/users/:id', (q, r) => { const u = db.users.find(x => x.id == q.params.id); u ? r.json(stats(u)) : bad(r, 'User not found', 404); });
// Gigs
app.get('/gigs', (req, res) => {
  const { category, type, payment_type, status, user_id, q, min_budget, max_budget } = req.query;
  let list = db.gigs.map(view);
  if (category) list = list.filter(g => g.category === category);
  if (type) list = list.filter(g => g.type === type);
  if (payment_type) list = list.filter(g => g.payment_type === payment_type);
  if (status) list = list.filter(g => g.status === status);
  if (user_id) list = list.filter(g => g.user_id == user_id);
  if (min_budget) list = list.filter(g => g.budget != null && g.budget >= +min_budget);
  if (max_budget) list = list.filter(g => g.budget != null && g.budget <= +max_budget);
  if (q) list = list.filter(g => (g.title + ' ' + g.description).toLowerCase().includes(q.toLowerCase()));
  res.json(list.sort((a, b) => b.created_at.localeCompare(a.created_at)));
});
app.get('/gigs/:id', (q, r) => { const g = db.gigs.find(x => x.id == q.params.id); g ? r.json(view(g)) : bad(r, 'Gig not found', 404); });
app.post('/gigs', (req, res) => {
  const b = req.body, e = [];
  if (!db.users.some(u => u.id === +b.user_id)) e.push('Valid user required');
  if (!b.title || b.title.trim().length < 5) e.push('Title must be at least 5 characters');
  if (!b.description || b.description.trim().length < 10) e.push('Description must be at least 10 characters');
  if (!['Offering', 'Requesting'].includes(b.type)) e.push('Type must be Offering or Requesting');
  if (!['Programming', 'Design', 'Writing', 'Tutoring'].includes(b.category)) e.push('Invalid category');
  if (!['Paid', 'SkillSwap', 'Free'].includes(b.payment_type)) e.push('Invalid payment type');
  if (b.payment_type === 'Paid' && !(+b.budget > 0)) e.push('Paid gigs need a budget greater than 0');
  if (!b.deadline || b.deadline < today()) e.push('Deadline must be today or later');
  if (e.length) return bad(res, e.join('. '));
  const g = { id: nextId(db.gigs), user_id: +b.user_id, title: b.title.trim(), description: b.description.trim(), type: b.type, category: b.category, payment_type: b.payment_type, budget: b.payment_type === 'Paid' ? +b.budget : null, deadline: b.deadline, status: 'Open', accepted_applicant_id: null, created_at: new Date().toISOString() };
  db.gigs.push(g); save(); res.status(201).json(g);
});
app.patch('/gigs/:id', (req, res) => {
  const g = db.gigs.find(x => x.id == req.params.id); if (!g) return bad(res, 'Gig not found', 404);
  const { actor_id, status } = req.body;
  if (g.user_id !== +actor_id) return bad(res, 'Only the gig owner can change status', 403);
  const cur = view(g).status;
  const ok = (cur === 'Open' && ['In Progress', 'Cancelled'].includes(status)) || (cur === 'In Progress' && ['Completed', 'Cancelled'].includes(status));
  if (!ok) return bad(res, `Cannot move gig from ${cur} to ${status}`);
  if (status === 'In Progress' && !g.accepted_applicant_id) return bad(res, 'Accept an applicant to start the gig');
  g.status = status; save(); res.json(g);
});
// Applications
app.get('/applications', (req, res) => {
  const { gig_id, applicant_id } = req.query;
  let l = db.applications;
  if (gig_id) l = l.filter(a => a.gig_id == gig_id);
  if (applicant_id) l = l.filter(a => a.applicant_id == applicant_id);
  res.json(l.map(a => ({ ...a, applicant: db.users.find(u => u.id === a.applicant_id), gig: view(db.gigs.find(g => g.id === a.gig_id)) })));
});
app.post('/applications', (req, res) => {
  const { gig_id, applicant_id, message } = req.body;
  const g = db.gigs.find(x => x.id == gig_id);
  if (!g) return bad(res, 'Gig not found', 404);
  if (!db.users.some(u => u.id == applicant_id)) return bad(res, 'Valid applicant required');
  if (g.user_id == applicant_id) return bad(res, 'You cannot apply to your own gig', 403);
  if (view(g).status !== 'Open') return bad(res, `This gig is ${view(g).status} and not accepting applications`);
  if (db.applications.some(a => a.gig_id == gig_id && a.applicant_id == applicant_id)) return bad(res, 'You already applied to this gig', 409);
  if (!message || message.trim().length < 5) return bad(res, 'Message must be at least 5 characters');
  const a = { id: nextId(db.applications), gig_id: +gig_id, applicant_id: +applicant_id, message: message.trim(), status: 'Pending', created_at: new Date().toISOString() };
  db.applications.push(a); save(); res.status(201).json(a);
});
app.patch('/applications/:id', (req, res) => {
  const a = db.applications.find(x => x.id == req.params.id); if (!a) return bad(res, 'Application not found', 404);
  const g = db.gigs.find(x => x.id === a.gig_id);
  const { actor_id, status } = req.body;
  if (g.user_id !== +actor_id) return bad(res, 'Only the gig owner can review applications', 403);
  if (a.status !== 'Pending') return bad(res, 'Application already decided');
  if (!['Accepted', 'Rejected'].includes(status)) return bad(res, 'Status must be Accepted or Rejected');
  if (status === 'Accepted') {
    if (view(g).status !== 'Open') return bad(res, 'Gig is not open');
    a.status = 'Accepted';
    db.applications.filter(x => x.gig_id === g.id && x.id !== a.id && x.status === 'Pending').forEach(x => x.status = 'Rejected');
    g.status = 'In Progress'; g.accepted_applicant_id = a.applicant_id;
  } else a.status = 'Rejected';
  save(); res.json(a);
});
// Reviews
app.get('/reviews', (req, res) => {
  const { reviewee_id, gig_id } = req.query;
  let l = db.reviews;
  if (reviewee_id) l = l.filter(r => r.reviewee_id == reviewee_id);
  if (gig_id) l = l.filter(r => r.gig_id == gig_id);
  res.json(l.map(r => ({ ...r, reviewer: db.users.find(u => u.id === r.reviewer_id), gig: db.gigs.find(g => g.id === r.gig_id) })));
});
app.post('/reviews', (req, res) => {
  const { gig_id, reviewer_id, rating, comment } = req.body;
  const g = db.gigs.find(x => x.id == gig_id);
  if (!g) return bad(res, 'Gig not found', 404);
  if (g.status !== 'Completed') return bad(res, 'Reviews open only after completion');
  const rid = +reviewer_id;
  if (rid !== g.user_id && rid !== g.accepted_applicant_id) return bad(res, 'Only the owner and accepted applicant can review', 403);
  if (db.reviews.some(r => r.gig_id === g.id && r.reviewer_id === rid)) return bad(res, 'You already reviewed this gig', 409);
  if (!(Number.isInteger(+rating) && rating >= 1 && rating <= 5)) return bad(res, 'Rating must be 1 to 5');
  const r = { id: nextId(db.reviews), gig_id: g.id, reviewer_id: rid, reviewee_id: rid === g.user_id ? g.accepted_applicant_id : g.user_id, rating: +rating, comment: (comment || '').trim() };
  db.reviews.push(r); save(); res.status(201).json(r);
});
app.listen(5000, () => console.log("App + API running on http://localhost:5000"));
