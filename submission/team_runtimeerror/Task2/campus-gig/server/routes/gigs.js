import { Router } from 'express';
import { db, nextId, today, withGig } from '../db.js';
import { requireUser } from '../middleware.js';

const r = Router();
export const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];

function validate(b) {
  const e = [];
  if (!b.title || b.title.trim().length < 5) e.push('Title must be at least 5 characters');
  if (!b.description || b.description.trim().length < 10) e.push('Description must be at least 10 characters');
  if (!['Offering', 'Requesting'].includes(b.type)) e.push('Type must be Offering or Requesting');
  if (!CATEGORIES.includes(b.category)) e.push(`Category must be one of ${CATEGORIES.join(', ')}`);
  if (!['Paid', 'SkillSwap', 'Free'].includes(b.payment_type)) e.push('Payment type must be Paid, SkillSwap or Free');
  if (b.payment_type === 'Paid' && !(Number(b.budget) > 0)) e.push('Paid gigs need a budget greater than 0');
  if (!b.deadline || isNaN(Date.parse(b.deadline))) e.push('A valid deadline is required');
  else if (b.deadline < today()) e.push('Deadline cannot be in the past');
  return e;
}

// GET /gigs?category=&type=&payment_type=&min_budget=&max_budget=&q=&status=&user_id=
r.get('/', (req, res) => {
  const { category, type, payment_type, min_budget, max_budget, q, status, user_id } = req.query;
  let list = db.gigs.map(withGig);
  if (category) list = list.filter((g) => g.category === category);
  if (type) list = list.filter((g) => g.type === type);
  if (payment_type) list = list.filter((g) => g.payment_type === payment_type);
  if (status) list = list.filter((g) => g.status === status);
  if (user_id) list = list.filter((g) => g.user_id === Number(user_id));
  if (min_budget) list = list.filter((g) => g.budget != null && g.budget >= Number(min_budget));
  if (max_budget) list = list.filter((g) => g.budget != null && g.budget <= Number(max_budget));
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((g) => `${g.title} ${g.description}`.toLowerCase().includes(s));
  }
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(list);
});

r.get('/:id', (req, res) => {
  const g = db.gigs.find((x) => x.id === Number(req.params.id));
  if (!g) return res.status(404).json({ error: 'Gig not found' });
  res.json(withGig(g));
});

r.post('/', requireUser, (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('. ') });
  const b = req.body;
  const gig = {
    id: nextId(db.gigs), user_id: req.user.id,
    title: b.title.trim(), description: b.description.trim(),
    type: b.type, category: b.category, payment_type: b.payment_type,
    budget: b.payment_type === 'Paid' ? Number(b.budget) : null,
    deadline: b.deadline, status: 'Open', accepted_applicant_id: null,
    created_at: new Date().toISOString(),
  };
  db.gigs.push(gig);
  res.status(201).json(withGig(gig));
});

// ===== PATCH added in Milestone 3 goes here (before export) =====// PATCH /gigs/:id  { status?, ...editable fields }  (owner only)
r.patch('/:id', requireUser, (req, res) => {
  const g = db.gigs.find((x) => x.id === Number(req.params.id));
  if (!g) return res.status(404).json({ error: 'Gig not found' });
  if (g.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can modify this gig' });

  const { status, ...edits } = req.body;

  if (Object.keys(edits).length) {
    if (g.status !== 'Open') return res.status(400).json({ error: 'Only Open gigs can be edited' });
    const errors = validate({ ...g, ...edits });
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });
  }

  if (status && status !== g.status) {
    if (status === 'Completed') {
      if (g.status !== 'In Progress') return res.status(400).json({ error: 'Only In Progress gigs can be completed' });
    } else if (status === 'Cancelled') {
      if (!['Open', 'In Progress'].includes(g.status)) return res.status(400).json({ error: `Cannot cancel a ${g.status} gig` });
    } else if (status === 'In Progress') {
      return res.status(400).json({ error: 'Accept an applicant to move a gig to In Progress' });
    } else {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    g.status = status;
    if (status === 'Cancelled') {
      // a cancelled gig has no assignee: reject Pending and the previously Accepted application
      db.applications.filter((a) => a.gig_id === g.id && ['Pending', 'Accepted'].includes(a.status)).forEach((a) => { a.status = 'Rejected'; });
      g.accepted_applicant_id = null;
    }
  }

  ['title', 'description', 'category', 'payment_type', 'deadline', 'type'].forEach((k) => {
    if (edits[k] !== undefined) g[k] = edits[k];
  });
  if (edits.payment_type || edits.budget !== undefined)
    g.budget = g.payment_type === 'Paid' ? Number(edits.budget ?? g.budget) : null;

  res.json(withGig(g));
});

r.delete('/:id', requireUser, (req, res) => {
  const i = db.gigs.findIndex((x) => x.id === Number(req.params.id));
  if (i < 0) return res.status(404).json({ error: 'Gig not found' });
  const g = db.gigs[i];
  if (g.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can delete this gig' });
  if (['In Progress', 'Completed'].includes(g.status)) return res.status(400).json({ error: `Cannot delete a ${g.status} gig` });
  db.gigs.splice(i, 1);
  db.applications = db.applications.filter((a) => a.gig_id !== g.id);
  res.json({ ok: true });
});
export default r;
export { validate };