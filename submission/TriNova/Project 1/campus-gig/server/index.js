import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { loadDb, saveDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
const TYPES = ['Offering', 'Requesting'];
const PAYMENTS = ['Paid', 'SkillSwap', 'Free'];

// Open gig jiski deadline guzar gayi ho, woh Expired dikhegi
function withStatus(gig) {
  if (gig.status === 'Open' && gig.deadline < today()) {
    return { ...gig, status: 'Expired' };
  }
  return gig;
}

// Profile stats: reviews se average calculate hota hai
function profile(db, u) {
  const posted = db.gigs.filter((g) => g.user_id === u.id).length;
  const completed = db.gigs.filter(
    (g) => g.status === 'Completed' && (g.user_id === u.id || g.accepted_applicant_id === u.id)
  ).length;
  const received = db.reviews.filter((r) => r.reviewee_id === u.id);
  const avg = received.length
    ? Math.round((received.reduce((s, r) => s + r.rating, 0) / received.length) * 10) / 10
    : 0;
  return { ...u, gigs_posted: posted, gigs_completed: completed, average_rating: avg, review_count: received.length };
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ---------- USERS ----------
app.get('/users', (req, res) => {
  const db = loadDb();
  res.json(db.users.map((u) => profile(db, u)));
});

app.get('/users/:id', (req, res) => {
  const db = loadDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(profile(db, user));
});

// ---------- GIGS ----------
// GET /gigs?category=&type=&payment_type=&status=&minBudget=&maxBudget=&q=
app.get('/gigs', (req, res) => {
  const db = loadDb();
  const { category, type, payment_type, status, minBudget, maxBudget, q } = req.query;

  let list = db.gigs.map(withStatus);

  if (category) list = list.filter((g) => g.category === category);
  if (type) list = list.filter((g) => g.type === type);
  if (payment_type) list = list.filter((g) => g.payment_type === payment_type);
  if (status) list = list.filter((g) => g.status === status);
  if (minBudget) list = list.filter((g) => g.budget !== null && g.budget >= Number(minBudget));
  if (maxBudget) list = list.filter((g) => g.budget !== null && g.budget <= Number(maxBudget));
  if (q) {
    const s = q.toLowerCase();
    list = list.filter(
      (g) => g.title.toLowerCase().includes(s) || g.description.toLowerCase().includes(s)
    );
  }

  res.json(list);
});

app.get('/gigs/:id', (req, res) => {
  const db = loadDb();
  const gig = db.gigs.find((g) => g.id === req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  res.json(withStatus(gig));
});

// CREATE GIG
app.post('/gigs', (req, res) => {
  const db = loadDb();
  const { user_id, title, description, type, category, payment_type, budget, deadline } = req.body;

  if (!db.users.find((u) => u.id === user_id)) return res.status(400).json({ error: 'Valid user_id is required' });
  if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters' });
  if (!description || description.trim().length < 10) return res.status(400).json({ error: 'Description must be at least 10 characters' });
  if (!TYPES.includes(type)) return res.status(400).json({ error: 'Type must be Offering or Requesting' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (!PAYMENTS.includes(payment_type)) return res.status(400).json({ error: 'Invalid payment type' });
  if (payment_type === 'Paid' && !(Number(budget) > 0)) return res.status(400).json({ error: 'Budget is required for Paid gigs' });
  if (!deadline || isNaN(new Date(deadline))) return res.status(400).json({ error: 'Valid deadline is required' });
  if (deadline < today()) return res.status(400).json({ error: 'Deadline cannot be in the past' });

  const gig = {
    id: 'g' + nanoid(6),
    user_id,
    title: title.trim(),
    description: description.trim(),
    type,
    category,
    payment_type,
    budget: payment_type === 'Paid' ? Number(budget) : null,
    deadline,
    status: 'Open',
    accepted_applicant_id: null,
    created_at: today(),
  };
  db.gigs.push(gig);
  saveDb(db);
  res.status(201).json(gig);
});

// CHANGE GIG STATUS (sirf owner)
// Body: { user_id, status: "Completed" ya "Cancelled" }
app.patch('/gigs/:id', (req, res) => {
  const db = loadDb();
  const { user_id, status } = req.body;

  const gig = db.gigs.find((g) => g.id === req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.user_id !== user_id) return res.status(403).json({ error: 'Only the gig owner can do this' });

  const current = withStatus(gig).status;

  if (status === 'Completed') {
    if (current !== 'In Progress') return res.status(400).json({ error: 'Only an In Progress gig can be completed' });
  } else if (status === 'Cancelled') {
    if (!['Open', 'In Progress'].includes(current)) return res.status(400).json({ error: 'Gig cannot be cancelled now' });
  } else {
    return res.status(400).json({ error: 'Status must be Completed or Cancelled. Use application accept to start a gig.' });
  }

  gig.status = status;
  saveDb(db);
  res.json(gig);
});

// ---------- APPLICATIONS ----------
// GET /applications?gig_id=...  ya  GET /applications?applicant_id=...
app.get('/applications', (req, res) => {
  const db = loadDb();
  const { gig_id, applicant_id } = req.query;
  let list = db.applications;
  if (gig_id) list = list.filter((a) => a.gig_id === gig_id);
  if (applicant_id) list = list.filter((a) => a.applicant_id === applicant_id);
  res.json(list);
});

// APPLY
app.post('/applications', (req, res) => {
  const db = loadDb();
  const { gig_id, user_id, message } = req.body;

  const gigRaw = db.gigs.find((g) => g.id === gig_id);
  if (!gigRaw) return res.status(404).json({ error: 'Gig not found' });
  if (!db.users.find((u) => u.id === user_id)) return res.status(400).json({ error: 'Valid user_id is required' });

  const gig = withStatus(gigRaw);
  if (gig.status !== 'Open') return res.status(400).json({ error: `Gig is ${gig.status}, applications are closed` });
  if (gig.user_id === user_id) return res.status(400).json({ error: 'You cannot apply to your own gig' });
  if (db.applications.find((a) => a.gig_id === gig_id && a.applicant_id === user_id))
    return res.status(409).json({ error: 'You already applied to this gig' });
  if (!message || message.trim().length < 5 || message.length > 300)
    return res.status(400).json({ error: 'Message must be 5 to 300 characters' });

  const application = {
    id: 'a' + nanoid(6),
    gig_id,
    applicant_id: user_id,
    message: message.trim(),
    status: 'Pending',
    created_at: today(),
  };
  db.applications.push(application);
  saveDb(db);
  res.status(201).json(application);
});

// ACCEPT / REJECT (sirf gig owner)
// Body: { user_id, status: "Accepted" ya "Rejected" }
app.patch('/applications/:id', (req, res) => {
  const db = loadDb();
  const { user_id, status } = req.body;

  const application = db.applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  const gig = db.gigs.find((g) => g.id === application.gig_id);
  if (gig.user_id !== user_id) return res.status(403).json({ error: 'Only the gig owner can do this' });
  if (!['Accepted', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Status must be Accepted or Rejected' });
  if (application.status !== 'Pending') return res.status(400).json({ error: 'Application is already ' + application.status });
  if (withStatus(gig).status !== 'Open') return res.status(400).json({ error: 'Gig is not Open' });

  application.status = status;

  if (status === 'Accepted') {
    gig.status = 'In Progress';
    gig.accepted_applicant_id = application.applicant_id;
    // baaki sab Pending applications reject
    db.applications.forEach((a) => {
      if (a.gig_id === gig.id && a.id !== application.id && a.status === 'Pending') {
        a.status = 'Rejected';
      }
    });
  }

  saveDb(db);
  res.json({ application, gig });
});

// ---------- REVIEWS ----------
// GET /reviews?gig_id=...  ya  GET /reviews?reviewee_id=...
app.get('/reviews', (req, res) => {
  const db = loadDb();
  const { gig_id, reviewee_id } = req.query;
  let list = db.reviews;
  if (gig_id) list = list.filter((r) => r.gig_id === gig_id);
  if (reviewee_id) list = list.filter((r) => r.reviewee_id === reviewee_id);
  res.json(list);
});

// Body: { gig_id, reviewer_id, rating (1-5), comment }
app.post('/reviews', (req, res) => {
  const db = loadDb();
  const { gig_id, reviewer_id, rating, comment } = req.body;

  const gig = db.gigs.find((g) => g.id === gig_id);
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.status !== 'Completed') return res.status(400).json({ error: 'Reviews are allowed only after the gig is Completed' });

  const isOwner = gig.user_id === reviewer_id;
  const isApplicant = gig.accepted_applicant_id === reviewer_id;
  if (!isOwner && !isApplicant) return res.status(403).json({ error: 'Only the owner or accepted applicant can review' });

  if (db.reviews.find((r) => r.gig_id === gig_id && r.reviewer_id === reviewer_id))
    return res.status(409).json({ error: 'You already reviewed this gig' });

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
  if (!comment || comment.trim().length < 3) return res.status(400).json({ error: 'Comment is required' });

  const review = {
    id: 'r' + nanoid(6),
    gig_id,
    reviewer_id,
    reviewee_id: isOwner ? gig.accepted_applicant_id : gig.user_id,
    rating: r,
    comment: comment.trim(),
  };
  db.reviews.push(review);
  saveDb(db);
  res.status(201).json(review);
});

app.listen(4000, () => {
  console.log('API running on http://localhost:4000');
});