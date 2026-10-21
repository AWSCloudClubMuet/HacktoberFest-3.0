import { Router } from 'express';
import { db, userStats, withGig } from '../db.js';
import { requireUser } from '../middleware.js';

const r = Router();

r.get('/', (_req, res) => res.json(db.users.map(userStats)));

r.get('/:id', (req, res) => {
  const u = db.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'User not found' });
  const reviews = db.reviews
    .filter((rv) => rv.reviewee_id === u.id)
    .map((rv) => ({ ...rv, reviewer_name: db.users.find((x) => x.id === rv.reviewer_id)?.name }));
  const gigs = db.gigs.filter((g) => g.user_id === u.id).map(withGig);
  res.json({ ...userStats(u), reviews, gigs });
});

// Edit own profile (average rating is NOT editable, it is computed)
r.patch('/:id', requireUser, (req, res) => {
  const u = db.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own profile' });
  const { name, major, semester, bio, skills } = req.body;
  if (name !== undefined) u.name = name;
  if (major !== undefined) u.major = major;
  if (semester !== undefined) u.semester = Number(semester);
  if (bio !== undefined) u.bio = bio;
  if (Array.isArray(skills)) u.skills = skills.map((s) => s.trim()).filter(Boolean);
  res.json(userStats(u));
});

export default r;