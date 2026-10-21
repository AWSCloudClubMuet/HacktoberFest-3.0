import { Router } from 'express';
import { db, nextId, effectiveStatus } from '../db.js';
import { requireUser } from '../middleware.js';

const r = Router();

const enrich = (a) => {
  const g = db.gigs.find((x) => x.id === a.gig_id);
  const u = db.users.find((x) => x.id === a.applicant_id);
  return { ...a, gig_title: g?.title, gig_status: g && effectiveStatus(g), applicant_name: u?.name };
};

// GET /applications?applicant_id=me  (my applications)  |  ?gig_id=X (owner only)
r.get('/', requireUser, (req, res) => {
  const { applicant_id, gig_id } = req.query;
  let list = db.applications;
  if (gig_id) {
    const g = db.gigs.find((x) => x.id === Number(gig_id));
    if (!g) return res.status(404).json({ error: 'Gig not found' });
    if (g.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can view applications' });
    list = list.filter((a) => a.gig_id === g.id);
  } else {
    if (Number(applicant_id) !== req.user.id)
      return res.status(403).json({ error: 'You can only view your own applications' });
    list = list.filter((a) => a.applicant_id === req.user.id);
  }
  res.json(list.map(enrich));
});

r.post('/', requireUser, (req, res) => {
  const { gig_id, message } = req.body;
  const gig = db.gigs.find((g) => g.id === Number(gig_id));
  if (!gig) return res.status(404).json({ error: 'Gig not found' });
  if (gig.user_id === req.user.id) return res.status(400).json({ error: 'You cannot apply to your own gig' });
  const st = effectiveStatus(gig);
  if (st !== 'Open') return res.status(400).json({ error: `This gig is ${st} and closed to applications` });
  if (!message || message.trim().length < 5) return res.status(400).json({ error: 'Please write a short message (min 5 chars)' });
  if (db.applications.some((a) => a.gig_id === gig.id && a.applicant_id === req.user.id))
    return res.status(409).json({ error: 'You have already applied to this gig' });

  const app = {
    id: nextId(db.applications), gig_id: gig.id, applicant_id: req.user.id,
    message: message.trim(), status: 'Pending', created_at: new Date().toISOString(),
  };
  db.applications.push(app);
  res.status(201).json(enrich(app));
});

// PATCH /applications/:id  { status: 'Accepted' | 'Rejected' }  (gig owner only)
r.patch('/:id', requireUser, (req, res) => {
  const a = db.applications.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Application not found' });
  const gig = db.gigs.find((g) => g.id === a.gig_id);
  if (gig.user_id !== req.user.id) return res.status(403).json({ error: 'Only the gig owner can review applications' });
  if (a.status !== 'Pending') return res.status(400).json({ error: `Application is already ${a.status}` });

  const { status } = req.body;
  if (status === 'Accepted') {
    if (effectiveStatus(gig) !== 'Open') return res.status(400).json({ error: 'Gig is not open for acceptance' });
    a.status = 'Accepted';
    gig.status = 'In Progress';                 // auto-transition
    gig.accepted_applicant_id = a.applicant_id;
    db.applications                              // auto-reject all other pending
      .filter((x) => x.gig_id === gig.id && x.id !== a.id && x.status === 'Pending')
      .forEach((x) => { x.status = 'Rejected'; });
  } else if (status === 'Rejected') {
    a.status = 'Rejected';
  } else {
    return res.status(400).json({ error: 'Status must be Accepted or Rejected' });
  }
  res.json(enrich(a));
});
r.delete('/:id', requireUser, (req, res) => {
  const i = db.applications.findIndex((x) => x.id === Number(req.params.id));
  if (i < 0) return res.status(404).json({ error: 'Application not found' });
  const a = db.applications[i];
  if (a.applicant_id !== req.user.id) return res.status(403).json({ error: 'You can only withdraw your own application' });
  if (a.status !== 'Pending') return res.status(400).json({ error: 'Only Pending applications can be withdrawn' });
  db.applications.splice(i, 1);
  res.json({ ok: true });
});

export default r;