const express = require('express');
const router = express.Router();
const { getDB, saveDB, enrichGig } = require('../data/db');

const VALID_CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
const VALID_PAYMENT_TYPES = ['Paid', 'Skill Swap', 'Free'];
const VALID_TYPES = ['Offering', 'Requesting'];

// GET /api/gigs - Search and filter gigs
router.get('/', (req, res) => {
  const db = getDB();
  let gigs = db.gigs.map(g => enrichGig(g));

  const {
    q,
    category,
    type,
    paymentType,
    status,
    ownerId,
    minBudget,
    maxBudget,
    sort
  } = req.query;

  // Filter by owner
  if (ownerId) {
    gigs = gigs.filter(g => g.ownerId === ownerId);
  }

  // Filter by category
  if (category && category !== 'All') {
    gigs = gigs.filter(g => g.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by gig type (Offering vs Requesting)
  if (type && type !== 'All') {
    gigs = gigs.filter(g => g.type.toLowerCase() === type.toLowerCase());
  }

  // Filter by payment type (Paid, Skill Swap, Free)
  if (paymentType && paymentType !== 'All') {
    gigs = gigs.filter(g => g.paymentType.toLowerCase() === paymentType.toLowerCase());
  }

  // Filter by status (open, in_progress, completed)
  if (status && status !== 'All') {
    gigs = gigs.filter(g => g.status.toLowerCase() === status.toLowerCase());
  }

  // Filter by budget
  if (minBudget !== undefined && minBudget !== '') {
    const min = parseFloat(minBudget);
    if (!isNaN(min)) {
      gigs = gigs.filter(g => (g.budget || 0) >= min);
    }
  }

  if (maxBudget !== undefined && maxBudget !== '') {
    const max = parseFloat(maxBudget);
    if (!isNaN(max)) {
      gigs = gigs.filter(g => (g.budget || 0) <= max);
    }
  }

  // Keyword search across title, description, and tags
  if (q) {
    const term = q.toLowerCase();
    gigs = gigs.filter(g =>
      g.title.toLowerCase().includes(term) ||
      g.description.toLowerCase().includes(term) ||
      (g.tags && g.tags.some(t => t.toLowerCase().includes(term))) ||
      (g.owner && g.owner.name.toLowerCase().includes(term))
    );
  }

  // Sorting
  if (sort === 'oldest') {
    gigs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === 'budget-high') {
    gigs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
  } else if (sort === 'budget-low') {
    gigs.sort((a, b) => (a.budget || 0) - (b.budget || 0));
  } else {
    // Default newest first
    gigs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json({
    success: true,
    count: gigs.length,
    data: gigs
  });
});

// GET /api/gigs/:id - Get single gig
router.get('/:id', (req, res) => {
  const db = getDB();
  const gig = db.gigs.find(g => g.id === req.params.id);

  if (!gig) {
    return res.status(404).json({ success: false, error: 'Gig not found' });
  }

  const enriched = enrichGig(gig);

  // Also include applications for this gig
  const applications = db.applications
    .filter(a => a.gigId === gig.id)
    .map(a => {
      const applicant = db.users.find(u => u.id === a.applicantId);
      return {
        ...a,
        applicant: applicant ? {
          id: applicant.id,
          name: applicant.name,
          avatar: applicant.avatar,
          major: applicant.major,
          semester: applicant.semester,
          skills: applicant.skills
        } : null
      };
    });

  // Also include reviews if completed
  const reviews = db.reviews.filter(r => r.gigId === gig.id);

  res.json({
    success: true,
    data: {
      ...enriched,
      applications,
      reviews
    }
  });
});

// POST /api/gigs - Create new gig
router.post('/', (req, res) => {
  const db = getDB();
  const {
    title,
    description,
    category,
    paymentType,
    type,
    budget,
    deadline,
    ownerId,
    tags
  } = req.body;

  // Validation
  if (!title || title.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Title is required (at least 3 characters)' });
  }

  if (!description || description.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Description is required (at least 10 characters)' });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
  }

  if (!paymentType || !VALID_PAYMENT_TYPES.includes(paymentType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid payment type. Must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`
    });
  }

  const gigType = type || 'Offering';
  if (!VALID_TYPES.includes(gigType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  if (!ownerId) {
    return res.status(400).json({ success: false, error: 'Owner ID is required' });
  }

  const ownerExists = db.users.some(u => u.id === ownerId);
  if (!ownerExists) {
    return res.status(400).json({ success: false, error: 'Invalid owner ID. User does not exist.' });
  }

  let parsedBudget = 0;
  if (paymentType === 'Paid') {
    parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ success: false, error: 'Paid gigs must specify a valid non-negative budget amount.' });
    }
  }

  let formattedTags = [];
  if (Array.isArray(tags)) {
    formattedTags = tags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof tags === 'string' && tags.trim()) {
    formattedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  const id = `gig-${Date.now()}`;
  const newGig = {
    id,
    title: title.trim(),
    description: description.trim(),
    type: gigType,
    category,
    paymentType,
    budget: parsedBudget,
    deadline: deadline ? String(deadline).trim() : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    ownerId,
    status: 'open',
    acceptedApplicantId: null,
    createdAt: new Date().toISOString(),
    tags: formattedTags.length > 0 ? formattedTags : [category]
  };

  db.gigs.unshift(newGig);
  saveDB();

  res.status(201).json({
    success: true,
    message: 'Gig created successfully',
    data: enrichGig(newGig)
  });
});

// PATCH /api/gigs/:id - Update gig / transition status
router.patch('/:id', (req, res) => {
  const db = getDB();
  const gig = db.gigs.find(g => g.id === req.params.id);

  if (!gig) {
    return res.status(404).json({ success: false, error: 'Gig not found' });
  }

  const { status, title, description, category, paymentType, budget, deadline, tags } = req.body;

  // Status transitions
  if (status !== undefined && status !== gig.status) {
    const validTransitions = {
      open: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const allowed = validTransitions[gig.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from "${gig.status}" to "${status}". Allowed transitions: ${allowed.join(', ') || 'None'}`
      });
    }

    if (status === 'completed') {
      if (!gig.acceptedApplicantId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete a gig without an accepted applicant.'
        });
      }
      gig.completedAt = new Date().toISOString();
    }

    gig.status = status;
  }

  // Updating other editable fields
  if (title !== undefined && title.trim().length >= 3) gig.title = title.trim();
  if (description !== undefined && description.trim().length >= 10) gig.description = description.trim();
  if (category !== undefined && VALID_CATEGORIES.includes(category)) gig.category = category;
  if (paymentType !== undefined && VALID_PAYMENT_TYPES.includes(paymentType)) gig.paymentType = paymentType;
  if (budget !== undefined) gig.budget = Math.max(0, parseFloat(budget) || 0);
  if (deadline !== undefined) gig.deadline = String(deadline).trim();
  if (tags !== undefined) {
    gig.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
  }

  saveDB();

  res.json({
    success: true,
    message: 'Gig updated successfully',
    data: enrichGig(gig)
  });
});

module.exports = router;
