const express = require('express');
const router = express.Router();
const { getDB, saveDB, enrichUser } = require('../data/db');

// Helper to enrich application
function enrichApplication(app) {
  const db = getDB();
  const applicant = db.users.find(u => u.id === app.applicantId);
  const gig = db.gigs.find(g => g.id === app.gigId);

  return {
    ...app,
    applicant: applicant ? enrichUser(applicant) : null,
    gig: gig ? {
      id: gig.id,
      title: gig.title,
      category: gig.category,
      paymentType: gig.paymentType,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId
    } : null
  };
}

// GET /api/applications - List applications with optional filters
router.get('/', (req, res) => {
  const db = getDB();
  let applications = [...db.applications];

  const { gigId, applicantId, status } = req.query;

  if (gigId) {
    applications = applications.filter(a => a.gigId === gigId);
  }

  if (applicantId) {
    applications = applications.filter(a => a.applicantId === applicantId);
  }

  if (status && status !== 'All') {
    applications = applications.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  // Sort newest first
  applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    count: applications.length,
    data: applications.map(enrichApplication)
  });
});

// GET /api/applications/:id - Get single application
router.get('/:id', (req, res) => {
  const db = getDB();
  const app = db.applications.find(a => a.id === req.params.id);

  if (!app) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  res.json({
    success: true,
    data: enrichApplication(app)
  });
});

// POST /api/applications - Apply for a gig
router.post('/', (req, res) => {
  const db = getDB();
  const { gigId, applicantId, message } = req.body;

  if (!gigId) {
    return res.status(400).json({ success: false, error: 'Gig ID is required' });
  }

  if (!applicantId) {
    return res.status(400).json({ success: false, error: 'Applicant ID is required' });
  }

  if (!message || message.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'Application message is required (at least 5 characters)'
    });
  }

  const gig = db.gigs.find(g => g.id === gigId);
  if (!gig) {
    return res.status(404).json({ success: false, error: 'Gig not found' });
  }

  const applicant = db.users.find(u => u.id === applicantId);
  if (!applicant) {
    return res.status(404).json({ success: false, error: 'Applicant user not found' });
  }

  // RULE 1: Only open gigs accept applications
  if (gig.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: `Cannot apply to this gig because it is currently "${gig.status}". Only open gigs accept applications.`
    });
  }

  // RULE 2: Prevent applying to own gig
  if (gig.ownerId === applicantId) {
    return res.status(400).json({
      success: false,
      error: 'You cannot apply to your own gig.'
    });
  }

  // RULE 3: Prevent duplicate applications
  const alreadyApplied = db.applications.some(
    a => a.gigId === gigId && a.applicantId === applicantId
  );
  if (alreadyApplied) {
    return res.status(400).json({
      success: false,
      error: 'You have already submitted an application for this gig.'
    });
  }

  const id = `app-${Date.now()}`;
  const newApp = {
    id,
    gigId,
    applicantId,
    message: message.trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.applications.unshift(newApp);
  saveDB();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: enrichApplication(newApp)
  });
});

// PATCH /api/applications/:id - Accept or reject an application
router.patch('/:id', (req, res) => {
  const db = getDB();
  const app = db.applications.find(a => a.id === req.params.id);

  if (!app) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  const gig = db.gigs.find(g => g.id === app.gigId);
  if (!gig) {
    return res.status(404).json({ success: false, error: 'Associated gig not found' });
  }

  const { status, actionUserId } = req.body;

  // RULE 4: If actionUserId is provided, verify it is the gig owner
  if (actionUserId && actionUserId !== gig.ownerId) {
    return res.status(403).json({
      success: false,
      error: 'Only the gig owner can accept or reject applications.'
    });
  }

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be either "accepted" or "rejected".'
    });
  }

  if (app.status !== 'pending' && app.status !== status) {
    return res.status(400).json({
      success: false,
      error: `Application is already ${app.status}.`
    });
  }

  if (status === 'accepted') {
    // Gig must be open to accept an applicant
    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: `Cannot accept application because gig status is already "${gig.status}".`
      });
    }

    // Accept this application
    app.status = 'accepted';

    // Transition gig to In Progress and assign accepted applicant
    gig.status = 'in_progress';
    gig.acceptedApplicantId = app.applicantId;

    // Automatically reject all other pending applications for this gig
    let rejectedCount = 0;
    db.applications.forEach(otherApp => {
      if (otherApp.gigId === gig.id && otherApp.id !== app.id && otherApp.status === 'pending') {
        otherApp.status = 'rejected';
        rejectedCount++;
      }
    });

    saveDB();

    return res.json({
      success: true,
      message: `Applicant accepted. Gig is now In Progress. (${rejectedCount} other pending applications were rejected).`,
      data: {
        application: enrichApplication(app),
        gig: gig
      }
    });
  } else if (status === 'rejected') {
    app.status = 'rejected';
    saveDB();

    return res.json({
      success: true,
      message: 'Application rejected.',
      data: enrichApplication(app)
    });
  }
});

module.exports = router;
