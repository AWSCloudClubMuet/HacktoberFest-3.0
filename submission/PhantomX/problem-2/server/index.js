import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { dataFile, ensureFresh, getDb, load, nextId, save } from './store.js';
import { writeSeed } from './seed.js';
import fs from 'fs';

const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
const TYPES = ['Offering', 'Requesting'];
const PAYMENTS = ['Paid', 'SkillSwap', 'Free'];

export function effectiveStatus(gig, now = Date.now()) {
  if (gig.status === 'Open' && new Date(gig.deadline).getTime() < now) return 'Expired';
  return gig.status;
}

function toGig(gig) {
  return { ...gig, status: effectiveStatus(gig) };
}

function withStats(user) {
  const db = getDb();
  const ratings = db.reviews.filter((review) => review.reviewee_id === user.id).map((review) => review.rating);
  const average = ratings.length
    ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
    : null;
  return {
    ...user,
    gigs_posted: db.gigs.filter((gig) => gig.user_id === user.id).length,
    gigs_completed: db.gigs.filter((gig) => (
      gig.status === 'Completed' && (gig.user_id === user.id || gig.accepted_applicant_id === user.id)
    )).length,
    average_rating: average,
  };
}

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

function requireUser(req, res) {
  const id = req.get('x-user-id');
  if (!id) {
    sendError(res, 400, 'x-user-id header is required');
    return null;
  }
  const user = getDb().users.find((item) => item.id === id);
  if (!user) {
    sendError(res, 404, 'User not found');
    return null;
  }
  return user;
}

function requireText(value, field, max) {
  if (typeof value !== 'string' || value.trim() === '') return `${field} is required`;
  if (value.trim().length > max) return `${field} must be ${max} characters or fewer`;
  return null;
}

function initStore() {
  if (!fs.existsSync(dataFile())) writeSeed();
  load();
}

export function createApp() {
  initStore();
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  app.use(express.json());
  app.use((req, res, next) => {
    try {
      ensureFresh();
      return next();
    } catch (error) {
      return next(error);
    }
  });

  app.get('/users', (req, res) => {
    res.json(getDb().users.map(withStats));
  });

  app.get('/users/:id', (req, res) => {
    const user = getDb().users.find((item) => item.id === req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    return res.json(withStats(user));
  });

  app.get('/gigs', (req, res) => {
    const min = readBound(req.query.min, 'min');
    if (min.error) return sendError(res, 400, min.error);
    const max = readBound(req.query.max, 'max');
    if (max.error) return sendError(res, 400, max.error);

    const category = emptyToUndefined(req.query.category);
    const type = emptyToUndefined(req.query.type);
    const paymentType = emptyToUndefined(req.query.payment_type);
    const q = emptyToUndefined(req.query.q);
    const needle = q ? q.toLowerCase() : '';

    const gigs = getDb().gigs
      .filter((gig) => {
        if (category && gig.category !== category) return false;
        if (type && gig.type !== type) return false;
        if (paymentType && gig.payment_type !== paymentType) return false;
        if (min.value !== undefined && (gig.budget == null || gig.budget < min.value)) return false;
        if (max.value !== undefined && (gig.budget == null || gig.budget > max.value)) return false;
        if (needle) {
          const haystack = `${gig.title} ${gig.description}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(toGig);

    return res.json(gigs);
  });

  app.get('/gigs/:id', (req, res) => {
    const gig = getDb().gigs.find((item) => item.id === req.params.id);
    if (!gig) return sendError(res, 404, 'Gig not found');
    return res.json(toGig(gig));
  });

  app.post('/gigs', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const error = validateGigInput(req.body || {});
    if (error) return sendError(res, 400, error);

    const { title, description, category, type, payment_type, deadline, budget } = req.body;
    const gig = {
      id: nextId(getDb().gigs, 'g'),
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      payment_type,
      budget: payment_type === 'Paid' ? budget : null,
      deadline: new Date(deadline).toISOString(),
      status: 'Open',
      accepted_applicant_id: null,
      created_at: new Date().toISOString(),
    };
    getDb().gigs.push(gig);
    save();
    return res.status(201).json(toGig(gig));
  });

  app.patch('/gigs/:id', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const gig = getDb().gigs.find((item) => item.id === req.params.id);
    if (!gig) return sendError(res, 404, 'Gig not found');
    if (gig.user_id !== user.id) return sendError(res, 403, 'Only the gig owner can change the gig status');

    const { status } = req.body || {};
    if (!status) return sendError(res, 400, 'status is required');

    if (status === 'Completed') {
      if (gig.status !== 'In Progress') {
        return sendError(res, 409, 'A gig can only be completed from In Progress');
      }
      gig.status = 'Completed';
      save();
      return res.json(toGig(gig));
    }

    if (status === 'Cancelled') {
      if (gig.status === 'Completed') return sendError(res, 409, 'A completed gig cannot be cancelled');
      if (gig.status === 'Cancelled') return sendError(res, 409, 'Gig is already cancelled');
      if (gig.status !== 'Open' && gig.status !== 'In Progress') {
        return sendError(res, 409, 'Only an Open or In Progress gig can be cancelled');
      }
      gig.status = 'Cancelled';
      for (const application of getDb().applications) {
        if (application.gig_id === gig.id && application.status === 'Pending') {
          application.status = 'Rejected';
        }
      }
      save();
      return res.json(toGig(gig));
    }

    if (status === 'In Progress') {
      return sendError(res, 409, 'Set In Progress by accepting an applicant');
    }
    return sendError(res, 400, 'status must be Completed or Cancelled');
  });

  app.get('/applications', (req, res) => {
    const gigId = emptyToUndefined(req.query.gig_id);
    const applicantId = emptyToUndefined(req.query.applicant_id);
    const applications = getDb().applications.filter((application) => {
      if (gigId && application.gig_id !== gigId) return false;
      if (applicantId && application.applicant_id !== applicantId) return false;
      return true;
    });
    return res.json(applications);
  });

  app.post('/applications', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const { gig_id: gigId, message } = req.body || {};
    if (!gigId) return sendError(res, 400, 'gig_id is required');
    const gig = getDb().gigs.find((item) => item.id === gigId);
    if (!gig) return sendError(res, 404, 'Gig not found');

    const messageError = requireText(message, 'message', 500);
    if (messageError) return sendError(res, 400, messageError);
    if (gig.user_id === user.id) return sendError(res, 403, 'You cannot apply to your own gig');

    const duplicate = getDb().applications.some((application) => (
      application.gig_id === gig.id && application.applicant_id === user.id
    ));
    if (duplicate) return sendError(res, 409, 'You have already applied to this gig');

    const status = effectiveStatus(gig);
    if (status !== 'Open') {
      return sendError(res, 409, `You can only apply to Open gigs. This gig is ${status}.`);
    }

    const application = {
      id: nextId(getDb().applications, 'a'),
      gig_id: gig.id,
      applicant_id: user.id,
      message: message.trim(),
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    getDb().applications.push(application);
    save();
    return res.status(201).json(application);
  });

  app.patch('/applications/:id', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const application = getDb().applications.find((item) => item.id === req.params.id);
    if (!application) return sendError(res, 404, 'Application not found');
    const gig = getDb().gigs.find((item) => item.id === application.gig_id);
    if (!gig) return sendError(res, 404, 'Gig not found');
    if (gig.user_id !== user.id) {
      return sendError(res, 403, 'Only the gig owner can accept or reject applicants');
    }

    const { status } = req.body || {};
    if (status !== 'Accepted' && status !== 'Rejected') {
      return sendError(res, 400, 'status must be Accepted or Rejected');
    }
    if (application.status !== 'Pending') {
      return sendError(res, 409, `Only a pending application can be ${status === 'Accepted' ? 'accepted' : 'rejected'}`);
    }

    if (status === 'Rejected') {
      application.status = 'Rejected';
      save();
      return res.json(application);
    }

    const gigStatus = effectiveStatus(gig);
    if (gigStatus !== 'Open') {
      return sendError(res, 409, `Only an Open gig can accept an applicant. This gig is ${gigStatus}.`);
    }

    application.status = 'Accepted';
    gig.status = 'In Progress';
    gig.accepted_applicant_id = application.applicant_id;
    for (const other of getDb().applications) {
      if (other.gig_id === gig.id && other.id !== application.id && other.status === 'Pending') {
        other.status = 'Rejected';
      }
    }
    save();
    return res.json(application);
  });

  app.get('/reviews', (req, res) => {
    const revieweeId = emptyToUndefined(req.query.reviewee_id);
    const reviews = getDb().reviews.filter((review) => !revieweeId || review.reviewee_id === revieweeId);
    return res.json(reviews);
  });

  app.post('/reviews', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const { gig_id: gigId, reviewee_id: revieweeId, rating, comment } = req.body || {};
    if (!gigId) return sendError(res, 400, 'gig_id is required');
    const gig = getDb().gigs.find((item) => item.id === gigId);
    if (!gig) return sendError(res, 404, 'Gig not found');
    if (gig.status !== 'Completed') {
      return sendError(res, 409, 'Reviews are only allowed after the gig is completed');
    }

    const ownerId = gig.user_id;
    const applicantId = gig.accepted_applicant_id;
    if (user.id !== ownerId && user.id !== applicantId) {
      return sendError(res, 403, 'Only the gig owner or the accepted applicant can leave a review');
    }
    const expectedReviewee = user.id === ownerId ? applicantId : ownerId;
    if (revieweeId !== expectedReviewee) {
      return sendError(res, 400, 'reviewee_id must be the other participant on this gig');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendError(res, 400, 'rating must be an integer from 1 to 5');
    }
    const commentError = requireText(comment, 'comment', 500);
    if (commentError) return sendError(res, 400, commentError);

    const duplicate = getDb().reviews.some((review) => review.gig_id === gig.id && review.reviewer_id === user.id);
    if (duplicate) return sendError(res, 409, 'You have already reviewed this gig');

    const review = {
      id: nextId(getDb().reviews, 'r'),
      gig_id: gig.id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };
    getDb().reviews.push(review);
    save();
    return res.status(201).json(review);
  });

  app.use((req, res) => {
    sendError(res, 404, 'Not found');
  });

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400) {
      return sendError(res, 400, 'Request body must be valid JSON');
    }
    console.error(err);
    return sendError(res, 500, 'Internal server error');
  });

  return app;
}

function emptyToUndefined(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readBound(value, label) {
  if (value === undefined || value === '') return { value: undefined };
  const number = Number(value);
  if (!Number.isFinite(number)) return { error: `${label} must be a number` };
  return { value: number };
}

function validateGigInput(body) {
  const { title, description, category, type, payment_type: paymentType, deadline, budget } = body;
  const titleError = requireText(title, 'title', 140);
  if (titleError) return titleError;
  const descriptionError = requireText(description, 'description', 2000);
  if (descriptionError) return descriptionError;
  if (!CATEGORIES.includes(category)) return `category must be one of: ${CATEGORIES.join(', ')}`;
  if (!TYPES.includes(type)) return `type must be one of: ${TYPES.join(', ')}`;
  if (!PAYMENTS.includes(paymentType)) return `payment_type must be one of: ${PAYMENTS.join(', ')}`;
  if (!deadline) return 'deadline is required';
  const deadlineTime = new Date(deadline).getTime();
  if (Number.isNaN(deadlineTime)) return 'deadline must be a valid date';
  if (deadlineTime <= Date.now()) return 'deadline must be in the future';
  if (paymentType === 'Paid') {
    if (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0) {
      return 'budget is required and must be greater than 0 when payment_type is Paid';
    }
  } else if (budget !== null && budget !== undefined) {
    return 'budget must be null unless payment_type is Paid';
  }
  return null;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invoked === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3001;
  const app = createApp();
  app.listen(port, () => {
    console.log(`Campus Gig API listening on http://localhost:${port}`);
  });
}
