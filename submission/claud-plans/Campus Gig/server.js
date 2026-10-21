import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {
  users,
  gigs,
  applications,
  reviews,
  nextGigId,
  nextAppId,
  nextRevId,
  resetStore,
} from './store.js';
import { connectDB, getMongoStatus } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB asynchronously (app runs smoothly whether MongoDB is online or in-memory)
connectDB().catch((err) => {
  console.log('[MongoDB] Running with in-memory store.');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Current user reader from x-user-id header
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  req.currentUser = users.find((u) => u.id === userId) || null;
  next();
});

// Helper: err(res, code, msg) so every error looks like { error: '...' }
export const err = (res, code, msg) => {
  return res.status(code).json({ error: msg });
};

// Helper: effectiveStatus(gig) returns 'Expired' if status is Open and deadline is before now, else gig.status.
export const effectiveStatus = (gig) => {
  if (!gig) return 'Expired';
  if (gig.status === 'Open' && gig.deadline && new Date(gig.deadline).getTime() < Date.now()) {
    return 'Expired';
  }
  return gig.status;
};

// Helper: compute user metrics dynamically (never stored)
export const computeUserMetrics = (user) => {
  if (!user) return null;
  const userId = user.id;

  const gigsPosted = gigs.filter((g) => g.owner_id === userId).length;
  const gigsCompleted = gigs.filter(
    (g) => g.status === 'Completed' && (g.owner_id === userId || g.accepted_applicant_id === userId)
  ).length;

  const userReviews = reviews.filter((r) => r.reviewee_id === userId);
  const reviewCount = userReviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((userReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : null;

  return {
    ...user,
    gigsPosted,
    gigsCompleted,
    averageRating,
    reviewCount,
  };
};

// ==========================================
// 1. HEALTH & DEBUG ROUTES
// ==========================================

// GET /health - Checkpoint A
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getMongoStatus(),
  });
});

// GET /debug/counts - Checkpoint B
app.get('/debug/counts', (req, res) => {
  res.json({
    users: users.length,
    gigs: gigs.length,
    applications: applications.length,
    reviews: reviews.length,
  });
});

// POST /debug/reset - Reset to original seed
app.post('/debug/reset', (req, res) => {
  const counts = resetStore();
  res.json({ message: 'Store reset successfully to initial seed data', counts });
});

// ==========================================
// 2. USERS API (Block C & Block E)
// ==========================================

// GET /users - list all users with computed metrics
app.get('/users', (req, res) => {
  const list = users.map((u) => computeUserMetrics(u));
  res.json(list);
});

// GET /users/:id - get single user profile with computed metrics
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return err(res, 404, 'User not found');
  }
  res.json(computeUserMetrics(user));
});

// ==========================================
// 3. GIGS API (Block C)
// ==========================================

// GET /gigs - query params: category, type, payment_type, minBudget, maxBudget, q, status
app.get('/gigs', (req, res) => {
  const { category, type, payment_type, minBudget, maxBudget, q, status } = req.query;

  let results = gigs.map((g) => {
    const owner = users.find((u) => u.id === g.owner_id);
    const effStatus = effectiveStatus(g);
    const appCount = applications.filter((a) => a.gig_id === g.id).length;
    return {
      ...g,
      status: effStatus,
      owner_name: owner ? owner.name : 'Unknown User',
      owner_major: owner ? owner.major : '',
      application_count: appCount,
    };
  });

  if (category) {
    results = results.filter((g) => g.category.toLowerCase() === category.toLowerCase());
  }

  if (type) {
    results = results.filter((g) => g.type.toLowerCase() === type.toLowerCase());
  }

  if (payment_type) {
    results = results.filter((g) => g.payment_type.toLowerCase() === payment_type.toLowerCase());
  }

  if (minBudget !== undefined && minBudget !== '') {
    const min = Number(minBudget);
    results = results.filter((g) => g.budget !== null && g.budget >= min);
  }

  if (maxBudget !== undefined && maxBudget !== '') {
    const max = Number(maxBudget);
    results = results.filter((g) => g.budget !== null && g.budget <= max);
  }

  if (status) {
    results = results.filter((g) => g.status.toLowerCase() === status.toLowerCase());
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query)
    );
  }

  res.json(results);
});

// GET /gigs/:id - gig + owner + applications
app.get('/gigs/:id', (req, res) => {
  const gig = gigs.find((g) => g.id === req.params.id);
  if (!gig) {
    return err(res, 404, 'Gig not found');
  }

  const owner = users.find((u) => u.id === gig.owner_id) || null;
  const effStatus = effectiveStatus(gig);

  const gigApps = applications
    .filter((a) => a.gig_id === gig.id)
    .map((a) => {
      const applicant = users.find((u) => u.id === a.applicant_id);
      return {
        ...a,
        applicant_name: applicant ? applicant.name : 'Unknown Applicant',
        applicant_major: applicant ? applicant.major : '',
        applicant_skills: applicant ? applicant.skills : [],
      };
    });

  let acceptedApplicant = null;
  if (gig.accepted_applicant_id) {
    acceptedApplicant = users.find((u) => u.id === gig.accepted_applicant_id) || null;
  }

  res.json({
    ...gig,
    status: effStatus,
    owner,
    accepted_applicant: acceptedApplicant,
    applications: gigApps,
  });
});

// POST /gigs - create a gig with validation rules
app.post('/gigs', (req, res) => {
  const { title, description, category, type, payment_type, budget, deadline } = req.body;

  // Title & description required
  if (!title || !title.trim()) {
    return err(res, 400, 'Title is required');
  }
  if (!description || !description.trim()) {
    return err(res, 400, 'Description is required');
  }

  // Type in { Offering, Requesting }
  const validTypes = ['Offering', 'Requesting'];
  if (!type || !validTypes.includes(type)) {
    return err(res, 400, 'Type must be Offering or Requesting');
  }

  // Category in { Programming, Design, Writing, Tutoring }
  const validCategories = ['Programming', 'Design', 'Writing', 'Tutoring'];
  if (!category || !validCategories.includes(category)) {
    return err(res, 400, 'Category must be one of: Programming, Design, Writing, Tutoring');
  }

  // Payment type in { Paid, SkillSwap, Free }
  const validPayments = ['Paid', 'SkillSwap', 'Free'];
  if (!payment_type || !validPayments.includes(payment_type)) {
    return err(res, 400, 'Payment type must be Paid, SkillSwap, or Free');
  }

  // If Paid, budget must be a number > 0. If SkillSwap/Free, forced to null.
  let finalBudget = null;
  if (payment_type === 'Paid') {
    const numBudget = Number(budget);
    if (budget === undefined || budget === null || isNaN(numBudget) || numBudget <= 0) {
      return err(res, 400, 'Budget must be a positive number for Paid gigs');
    }
    finalBudget = numBudget;
  } else {
    finalBudget = null;
  }

  // Deadline required and must be in the future
  if (!deadline) {
    return err(res, 400, 'Deadline is required');
  }
  const deadlineTime = new Date(deadline).getTime();
  if (isNaN(deadlineTime) || deadlineTime <= Date.now()) {
    return err(res, 400, 'Deadline must be a valid future date and time');
  }

  // Determine owner from currentUser or header or fallback to u1
  const ownerId = req.currentUser ? req.currentUser.id : req.body.owner_id || 'u1';

  const newGig = {
    id: nextGigId(),
    title: title.trim(),
    description: description.trim(),
    category,
    type,
    payment_type,
    budget: finalBudget,
    deadline: new Date(deadline).toISOString(),
    status: 'Open',
    owner_id: ownerId,
    accepted_applicant_id: null,
    created_at: new Date().toISOString(),
  };

  gigs.push(newGig);
  res.status(201).json(newGig);
});

// PATCH /gigs/:id - owner only. Allowed transitions: In Progress -> Completed, Open -> Cancelled.
app.patch('/gigs/:id', (req, res) => {
  const gig = gigs.find((g) => g.id === req.params.id);
  if (!gig) {
    return err(res, 404, 'Gig not found');
  }

  // Owner only check
  if (!req.currentUser || req.currentUser.id !== gig.owner_id) {
    return err(res, 403, 'Forbidden: Only the gig owner can modify this gig');
  }

  const { status: targetStatus } = req.body;
  if (!targetStatus) {
    return err(res, 400, 'Target status is required');
  }

  const currentStatus = effectiveStatus(gig);

  // Transition: In Progress -> Completed
  if (targetStatus === 'Completed') {
    if (currentStatus !== 'In Progress') {
      return err(res, 400, 'Cannot complete a gig that is not In Progress');
    }
    gig.status = 'Completed';
    return res.json({ message: 'Gig marked as Completed', gig });
  }

  // Transition: Open -> Cancelled
  if (targetStatus === 'Cancelled') {
    if (currentStatus !== 'Open') {
      return err(res, 400, 'Cannot cancel a gig that is not currently Open');
    }
    gig.status = 'Cancelled';
    return res.json({ message: 'Gig marked as Cancelled', gig });
  }

  return err(res, 400, `Invalid status transition from ${currentStatus} to ${targetStatus}`);
});

// ==========================================
// 4. APPLICATIONS API (Block D)
// ==========================================

// POST /applications - apply to a gig
app.post('/applications', (req, res) => {
  const { gig_id, message } = req.body;
  const applicantId = req.currentUser ? req.currentUser.id : req.body.applicant_id;

  if (!applicantId) {
    return err(res, 401, 'Please select or log in as a user before applying');
  }

  // 1. Gig exists
  const gig = gigs.find((g) => g.id === gig_id);
  if (!gig) {
    return err(res, 404, 'Gig not found');
  }

  // 2. Effective status is Open (not Expired / In Progress / Completed / Cancelled)
  const effStatus = effectiveStatus(gig);
  if (effStatus !== 'Open') {
    return err(res, 400, `Cannot apply to a gig with status: ${effStatus}`);
  }

  // 3. Applicant is not the gig owner
  if (applicantId === gig.owner_id) {
    return err(res, 400, 'You cannot apply to your own gig');
  }

  // 4. No existing application for the same (gig_id, applicant_id)
  const existingApp = applications.find(
    (a) => a.gig_id === gig_id && a.applicant_id === applicantId
  );
  if (existingApp) {
    return err(res, 409, 'You have already applied to this gig');
  }

  // 5. Message not empty
  if (!message || !message.trim()) {
    return err(res, 400, 'Application proposal message cannot be empty');
  }

  // Create with status Pending
  const newApplication = {
    id: nextAppId(),
    gig_id,
    applicant_id: applicantId,
    message: message.trim(),
    status: 'Pending',
    created_at: new Date().toISOString(),
  };

  applications.push(newApplication);
  res.status(201).json(newApplication);
});

// PATCH /applications/:id with { status: 'Accepted' | 'Rejected' }
// Only the gig owner. Application must be Pending.
// On Accepted: atomic cascade
app.patch('/applications/:id', (req, res) => {
  const application = applications.find((a) => a.id === req.params.id);
  if (!application) {
    return err(res, 404, 'Application not found');
  }

  const gig = gigs.find((g) => g.id === application.gig_id);
  if (!gig) {
    return err(res, 404, 'Associated gig not found');
  }

  // Owner only check
  if (!req.currentUser || req.currentUser.id !== gig.owner_id) {
    return err(res, 403, 'Forbidden: Only the gig owner can accept or reject applications');
  }

  // Application must be Pending
  if (application.status !== 'Pending') {
    return err(res, 400, `Application has already been ${application.status}`);
  }

  const { status: targetStatus } = req.body;
  if (!['Accepted', 'Rejected'].includes(targetStatus)) {
    return err(res, 400, 'Status must be Accepted or Rejected');
  }

  if (targetStatus === 'Accepted') {
    // 3-step atomic cascade (no async gaps):
    // (1) this application = Accepted
    application.status = 'Accepted';

    // (2) gig.status = In Progress and gig.accepted_applicant_id = applicant_id
    gig.status = 'In Progress';
    gig.accepted_applicant_id = application.applicant_id;

    // (3) every other Pending application on that gig = Rejected
    applications.forEach((a) => {
      if (a.gig_id === gig.id && a.id !== application.id && a.status === 'Pending') {
        a.status = 'Rejected';
      }
    });

    return res.json({
      message: 'Application accepted, gig marked In Progress, other pending applications rejected',
      application,
      gig,
    });
  }

  if (targetStatus === 'Rejected') {
    application.status = 'Rejected';
    return res.json({ message: 'Application rejected', application });
  }
});

// GET /applications?applicant_id=
app.get('/applications', (req, res) => {
  const { applicant_id } = req.query;
  const targetApplicant = applicant_id || (req.currentUser ? req.currentUser.id : null);

  let list = applications;
  if (targetApplicant) {
    list = list.filter((a) => a.applicant_id === targetApplicant);
  }

  const enhanced = list.map((a) => {
    const gig = gigs.find((g) => g.id === a.gig_id);
    const owner = gig ? users.find((u) => u.id === gig.owner_id) : null;
    return {
      ...a,
      gig_title: gig ? gig.title : 'Deleted Gig',
      gig_category: gig ? gig.category : '',
      gig_payment_type: gig ? gig.payment_type : '',
      gig_budget: gig ? gig.budget : null,
      effective_gig_status: gig ? effectiveStatus(gig) : 'Unknown',
      gig_owner_name: owner ? owner.name : 'Unknown Owner',
    };
  });

  res.json(enhanced);
});

// ==========================================
// 5. REVIEWS API (Block E)
// ==========================================

// POST /reviews { gig_id, reviewer_id, reviewee_id, rating, comment }
app.post('/reviews', (req, res) => {
  const { gig_id, reviewer_id, reviewee_id, rating, comment } = req.body;
  const activeReviewerId = req.currentUser ? req.currentUser.id : reviewer_id;

  // 1. Gig exists & is Completed
  const gig = gigs.find((g) => g.id === gig_id);
  if (!gig) {
    return err(res, 404, 'Gig not found');
  }
  if (gig.status !== 'Completed') {
    return err(res, 400, 'Reviews can only be submitted for Completed gigs');
  }

  // 2. Reviewer is owner or accepted applicant
  const isOwner = activeReviewerId === gig.owner_id;
  const isApplicant = activeReviewerId === gig.accepted_applicant_id;
  if (!isOwner && !isApplicant) {
    return err(res, 403, 'Forbidden: Only the gig owner or accepted applicant can leave a review');
  }

  // 3. Reviewee is the OTHER one of the two
  const expectedRevieweeId = isOwner ? gig.accepted_applicant_id : gig.owner_id;
  if (reviewee_id !== expectedRevieweeId) {
    return err(res, 400, 'Reviewee must be the other participant in the gig');
  }

  // 4. Rating is an integer 1-5
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return err(res, 400, 'Rating must be an integer between 1 and 5');
  }

  // 5. Comment not empty
  if (!comment || !comment.trim()) {
    return err(res, 400, 'Review comment cannot be empty');
  }

  // 6. No existing review with the same (gig_id, reviewer_id)
  const existingReview = reviews.find(
    (r) => r.gig_id === gig_id && r.reviewer_id === activeReviewerId
  );
  if (existingReview) {
    return err(res, 409, 'You have already submitted a review for this gig');
  }

  const newReview = {
    id: nextRevId(),
    gig_id,
    reviewer_id: activeReviewerId,
    reviewee_id,
    rating: numRating,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

// GET /reviews?user_id=
app.get('/reviews', (req, res) => {
  const { user_id, gig_id } = req.query;
  let list = reviews;

  if (user_id) {
    list = list.filter((r) => r.reviewee_id === user_id);
  }
  if (gig_id) {
    list = list.filter((r) => r.gig_id === gig_id);
  }

  const enhanced = list.map((r) => {
    const reviewer = users.find((u) => u.id === r.reviewer_id);
    const reviewee = users.find((u) => u.id === r.reviewee_id);
    const gig = gigs.find((g) => g.id === r.gig_id);
    return {
      ...r,
      reviewer_name: reviewer ? reviewer.name : 'Unknown User',
      reviewer_major: reviewer ? reviewer.major : '',
      reviewee_name: reviewee ? reviewee.name : 'Unknown User',
      gig_title: gig ? gig.title : 'Gig',
    };
  });

  res.json(enhanced);
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Campus Gig & SkillSwap Portal Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: /health, /debug/counts, /gigs, /users, /applications, /reviews`);
  console.log(`=======================================================`);
});

export default app;
