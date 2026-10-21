import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dataFile, ensureFresh, getDb, load, nextId, save } from './store.js';
import { writeSeed } from './seed.js';
import fs from 'fs';

function jwtSecret() {
  return process.env.JWT_SECRET || 'campus-gig-dev-secret';
}

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

function publicUser(user) {
  const safe = withStats(user);
  delete safe.password_hash;
  return safe;
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret(), { expiresIn: '7d' });
}

function authenticate(req) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) return { status: 401, error: 'Authentication required' };
  try {
    const payload = jwt.verify(match[1], jwtSecret());
    const user = getDb().users.find((item) => item.id === payload.sub);
    if (!user) return { status: 401, error: 'Authentication required' };
    return { user };
  } catch {
    return { status: 401, error: 'Invalid or expired token' };
  }
}

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

function requireUser(req, res) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  return req.user;
}

function requireText(value, field, max) {
  if (typeof value !== 'string' || value.trim() === '') return `${field} is required`;
  if (value.trim().length > max) return `${field} must be ${max} characters or fewer`;
  return null;
}

function optionalText(value, field, max) {
  if (value == null || value === '') return { value: null };
  if (typeof value !== 'string') return { error: `${field} must be text` };
  const trimmed = value.trim();
  if (trimmed === '') return { value: null };
  if (trimmed.length > max) return { error: `${field} must be ${max} characters or fewer` };
  return { value: trimmed };
}

function optionalUrl(value, field) {
  const text = optionalText(value, field, 500);
  if (text.error || text.value == null) return text;
  let url;
  try {
    url = new URL(text.value);
  } catch {
    return { error: `${field} must be a valid URL` };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: `${field} must be an http or https URL` };
  }
  return { value: text.value };
}

function presentApplication(application) {
  return {
    id: application.id,
    gig_id: application.gig_id,
    applicant_id: application.applicant_id,
    message: application.message,
    status: application.status,
    created_at: application.created_at,
    availability: application.availability || null,
    portfolio_link: application.portfolio_link || null,
    swap_offer: application.swap_offer || null,
    rejection_note: application.rejection_note || null,
  };
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

  app.use((req, res, next) => {
    if (req.path.startsWith('/auth/')) return next();
    const result = authenticate(req);
    if (!result.user) return sendError(res, result.status, result.error);
    req.user = result.user;
    return next();
  });

  app.post('/auth/signup', (req, res) => {
    const result = validateSignup(req.body || {});
    if (result.error) return sendError(res, result.status, result.error);
    const { name, email, password, major, semester, bio, skills } = result;
    const user = {
      id: nextId(getDb().users, 'u'),
      name,
      email,
      password_hash: bcrypt.hashSync(password, 10),
      major,
      semester,
      bio,
      skills,
    };
    getDb().users.push(user);
    save();
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = findByEmail(email);
    if (!user || typeof password !== 'string' || !bcrypt.compareSync(password, user.password_hash)) {
      return sendError(res, 401, 'Invalid email or password');
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  });

  app.get('/auth/me', (req, res) => {
    const result = authenticate(req);
    if (!result.user) return sendError(res, result.status, result.error);
    return res.json(publicUser(result.user));
  });

  app.get('/users', (req, res) => {
    res.json(getDb().users.map(publicUser));
  });

  app.get('/users/:id', (req, res) => {
    const user = getDb().users.find((item) => item.id === req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    return res.json(publicUser(user));
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
    return res.json(applications.map(presentApplication));
  });

  app.post('/applications', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return undefined;
    const body = req.body || {};
    const { gig_id: gigId, message } = body;
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

    const availability = optionalText(body.availability, 'availability', 200);
    if (availability.error) return sendError(res, 400, availability.error);
    const portfolio = optionalUrl(body.portfolio_link, 'portfolio_link');
    if (portfolio.error) return sendError(res, 400, portfolio.error);
    const swap = optionalText(body.swap_offer, 'swap_offer', 300);
    if (swap.error) return sendError(res, 400, swap.error);
    if (swap.value && gig.payment_type !== 'SkillSwap') {
      return sendError(res, 400, 'swap_offer is only allowed when payment_type is SkillSwap');
    }

    const application = {
      id: nextId(getDb().applications, 'a'),
      gig_id: gig.id,
      applicant_id: user.id,
      message: message.trim(),
      status: 'Pending',
      created_at: new Date().toISOString(),
      availability: availability.value,
      portfolio_link: portfolio.value,
      swap_offer: swap.value,
    };
    getDb().applications.push(application);
    save();
    return res.status(201).json(presentApplication(application));
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
      const note = optionalText((req.body || {}).rejection_note, 'rejection_note', 200);
      if (note.error) return sendError(res, 400, note.error);
      application.status = 'Rejected';
      application.rejection_note = note.value;
      save();
      return res.json(presentApplication(application));
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
    return res.json(presentApplication(application));
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

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function findByEmail(email) {
  const normal = normalizeEmail(email);
  if (!normal) return null;
  return getDb().users.find((user) => user.email === normal) || null;
}

function validateSignup(body) {
  const nameError = requireText(body.name, 'name', 80);
  if (nameError) return { status: 400, error: nameError };
  const email = normalizeEmail(body.email);
  if (!email) return { status: 400, error: 'email is required' };
  if (!isEmail(email)) return { status: 400, error: 'email must be a valid email address' };
  if (typeof body.password !== 'string' || body.password === '') return { status: 400, error: 'password is required' };
  if (body.password.length < 8) return { status: 400, error: 'password must be at least 8 characters' };
  if (body.password.length > 72) return { status: 400, error: 'password must be 72 characters or fewer' };
  const majorError = requireText(body.major, 'major', 80);
  if (majorError) return { status: 400, error: majorError };
  const semester = readSemester(body.semester);
  if (body.semester === undefined || body.semester === null || body.semester === '') {
    return { status: 400, error: 'semester is required' };
  }
  if (semester === null) return { status: 400, error: 'semester must be an integer from 1 to 12' };

  let bio = '';
  if (body.bio !== undefined && body.bio !== null && body.bio !== '') {
    if (typeof body.bio !== 'string') return { status: 400, error: 'bio must be a string' };
    if (body.bio.trim().length > 500) return { status: 400, error: 'bio must be 500 characters or fewer' };
    bio = body.bio.trim();
  }

  let skills = [];
  if (body.skills !== undefined && body.skills !== null) {
    if (!Array.isArray(body.skills) || body.skills.some((item) => typeof item !== 'string' || item.trim() === '')) {
      return { status: 400, error: 'skills must be an array of non-empty strings' };
    }
    if (body.skills.length > 12) return { status: 400, error: 'skills must include 12 items or fewer' };
    skills = body.skills.map((item) => item.trim());
  }

  if (findByEmail(email)) return { status: 409, error: 'An account with this email already exists' };
  return {
    name: body.name.trim(),
    email,
    password: body.password,
    major: body.major.trim(),
    semester,
    bio,
    skills,
  };
}

function readSemester(value) {
  const number = typeof value === 'number' ? value : (typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN);
  if (!Number.isInteger(number) || number < 1 || number > 12) return null;
  return number;
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
