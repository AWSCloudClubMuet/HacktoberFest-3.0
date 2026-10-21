// The CampusConnect HTTP API. createApp() builds the Express app around a store, so tests
// can run it against a throwaway database file.
import express from 'express';
import { parseGigQuery, hasErrors } from '../shared/validation.js';
import { filterGigs, sortGigs } from '../shared/rules.js';
import { ApiError, notFound } from './errors.js';
import * as services from './services.js';
import * as views from './views.js';

/**
 * Demo sign-in: the client says who is acting with an `X-User-Id` header.
 * A real deployment would read the user from a session or token instead; every
 * permission check below would stay exactly the same.
 */
function requireActor(req, db) {
  const id = req.get('X-User-Id');
  if (!id) throw new ApiError('UNAUTHENTICATED', 'Choose who you are acting as: send an X-User-Id header (e.g. u1).');
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new ApiError('UNKNOWN_USER', `No user with id "${id}".`);
  return user;
}

/** Reads are allowed without a user; an unknown id is treated as an anonymous visitor. */
function optionalViewerId(req, db) {
  const id = req.get('X-User-Id');
  return id && db.users.some((u) => u.id === id) ? id : null;
}

function jsonBody(req) {
  if (req.body === undefined) return {};
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    throw new ApiError('VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
  return req.body;
}

function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`));
  next();
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server. Please try again.' } });
}

export const ENDPOINTS = [
  'GET    /health',
  'GET    /users?q=&sort=rating|name',
  'GET    /users/:id',
  'PATCH  /users/:id',
  'GET    /gigs?q=&category=&type=&payment_type=&min_budget=&max_budget=&status=&user_id=&sort=',
  'GET    /gigs/:id',
  'POST   /gigs',
  'PATCH  /gigs/:id',
  'GET    /applications?applicant_id=&gig_id=&status=',
  'POST   /applications',
  'PATCH  /applications/:id',
  'GET    /reviews?user_id=&reviewer_id=&gig_id=',
  'POST   /reviews',
  'GET    /dashboard',
];

export function createApp({ store, now = () => Date.now(), log = false }) {
  const app = express();
  app.disable('x-powered-by');
  if (log) app.use(requestLogger);
  app.use(cors);
  app.use(express.json({ limit: '50kb' }));

  /** Runs a write inside a transaction: it either fully succeeds and is saved, or changes nothing. */
  const write = (req, operation) => store.transaction((db) => operation(db, requireActor(req, db), now()));

  app.get('/', (req, res) => res.json({ name: 'CampusConnect API', endpoints: ENDPOINTS }));
  app.get('/health', (req, res) => res.json({ ok: true }));

  // ---------------------------------------------------------------- users
  app.get('/users', (req, res) => {
    res.json(views.listUsers(store.read(), req.query));
  });

  app.get('/users/:id', (req, res) => {
    const db = store.read();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) throw notFound('User', req.params.id);
    res.json(views.userProfile(user, db, now()));
  });

  app.patch('/users/:id', (req, res) => {
    const user = write(req, (db, actor) => services.updateProfile(db, actor, req.params.id, jsonBody(req)));
    res.json(views.presentUser(user, store.read()));
  });

  // ---------------------------------------------------------------- gigs
  app.get('/gigs', (req, res) => {
    const { filters, errors } = parseGigQuery(req.query);
    if (hasErrors(errors)) throw new ApiError('VALIDATION_ERROR', 'Some search filters are invalid.', errors);
    const db = store.read();
    const time = now();
    const gigs = sortGigs(filterGigs(db.gigs, filters, time), filters.sort);
    res.json(gigs.map((gig) => views.presentGig(gig, db, time)));
  });

  app.get('/gigs/:id', (req, res) => {
    const db = store.read();
    const gig = db.gigs.find((g) => g.id === req.params.id);
    if (!gig) throw notFound('Gig', req.params.id);
    res.json(views.gigDetail(gig, db, optionalViewerId(req, db), now()));
  });

  app.post('/gigs', (req, res) => {
    const gig = write(req, (db, actor, time) => services.createGig(db, actor, jsonBody(req), time));
    res.status(201).json(views.presentGig(gig, store.read(), now()));
  });

  app.patch('/gigs/:id', (req, res) => {
    const result = write(req, (db, actor, time) => services.updateGig(db, actor, req.params.id, jsonBody(req), time));
    res.json({ ...views.presentGig(result.gig, store.read(), now()), auto_rejected_ids: result.auto_rejected_ids });
  });

  // ---------------------------------------------------------------- applications
  app.get('/applications', (req, res) => {
    const db = store.read();
    const viewer = requireActor(req, db);
    res.json(views.listApplications(db, viewer.id, req.query, now()));
  });

  app.post('/applications', (req, res) => {
    const application = write(req, (db, actor, time) => services.applyToGig(db, actor, jsonBody(req), time));
    res.status(201).json(views.presentApplication(application, store.read(), now()));
  });

  app.patch('/applications/:id', (req, res) => {
    const result = write(req, (db, actor, time) => services.decideApplication(db, actor, req.params.id, jsonBody(req), time));
    res.json({ ...views.presentApplication(result.application, store.read(), now()), auto_rejected_ids: result.auto_rejected_ids });
  });

  // ---------------------------------------------------------------- reviews
  app.get('/reviews', (req, res) => {
    res.json(views.listReviews(store.read(), req.query));
  });

  app.post('/reviews', (req, res) => {
    const review = write(req, (db, actor, time) => services.createReview(db, actor, jsonBody(req), time));
    res.status(201).json(views.presentReview(review, store.read()));
  });

  // ---------------------------------------------------------------- dashboard
  app.get('/dashboard', (req, res) => {
    const db = store.read();
    res.json(views.dashboard(db, requireActor(req, db), now()));
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `There is no ${req.method} ${req.path} endpoint.` } });
  });
  app.use(errorHandler);
  return app;
}
