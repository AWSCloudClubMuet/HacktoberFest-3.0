import { Router } from 'express';
import { db, nextId } from '../db.js';
import { requireUser } from '../middleware.js';

const r = Router();
const name = (id) => db.users.find((u) => u.id === id)?.name;
const enrich = (rv) => ({ ...rv, reviewer_name: name(rv.reviewer_id), reviewee_name: name(rv.reviewee_id) });

// GET /reviews?gig_id=&reviewee_id=
r.get('/', (req, res) => {
  const { gig_id, reviewee_id } = req.query;
  let list = db.reviews;
  if (gig_id) list = list.filter((x) => x.gig_id === Number(gig_id));
  if (reviewee_id) list = list.filter((x) => x.reviewee_id === Number(reviewee_id));
  res.json(list.map(enrich));
});

r.post('/', requireUser, (req, res) => {
  const { gig_id, rating, comment } = req.body;
  const gig = db.gigs.find((g) => g.id === Number(gig_id));
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.status !== 'Completed') return res.status(400).json({ error: 'Reviews are only allowed after a gig is Completed' });

  const me = req.user.id;
  const isOwner = gig.user_id === me;
  const isAccepted = gig.accepted_applicant_id === me;
  if (!isOwner && !isAccepted) return res.status(403).json({ error: 'Only the owner or accepted applicant can review' });

  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' });
  if (db.reviews.some((x) => x.gig_id === gig.id && x.reviewer_id === me))
    return res.status(409).json({ error: 'You have already reviewed this gig' });

  const review = {
    id: nextId(db.reviews), gig_id: gig.id, reviewer_id: me,
    reviewee_id: isOwner ? gig.accepted_applicant_id : gig.user_id, // always the other party
    rating: n, comment: (comment || '').trim(),
  };
  db.reviews.push(review);
  res.status(201).json(enrich(review));
});

export default r;