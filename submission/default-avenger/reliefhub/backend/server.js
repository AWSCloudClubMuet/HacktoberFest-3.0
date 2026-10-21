const express = require('express');
const rateLimit = require('express-rate-limit');
const { createHash, randomBytes } = require('node:crypto');
const { hashPassword, verifyPassword, createSessionToken, tokenHash } = require('./security');
const { ApiError, createDispatch, updateDispatch } = require('./operations');

const SESSION_HOURS = 8;
const SAFE_USER_COLUMNS = 'id, username, name, role, active, created_at';
const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(32).toString('hex'));

function parseLimit(value, fallback = 50) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) throw new ApiError(400, 'limit must be an integer from 1 to 100.');
  return parsed;
}

function parseOffset(value) {
  const parsed = Number(value ?? 0);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1000000) throw new ApiError(400, 'offset must be a non-negative integer.');
  return parsed;
}

function createApp(pool, { frontendOrigins = [] } = {}) {
  if (!pool || typeof pool.query !== 'function' || typeof pool.connect !== 'function') {
    throw new Error('A PostgreSQL pool is required.');
  }
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb', strict: true }));
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && frontendOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin && frontendOrigins.includes(origin) ? 204 : 403);
    next();
  });
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => console.log(JSON.stringify({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
    })));
    next();
  });

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res, next) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ready', database: 'connected' });
    } catch (error) {
      next(error);
    }
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many sign-in attempts. Try again later.' } },
  });

  app.post('/api/v1/auth/login', loginLimiter, async (req, res, next) => {
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!/^[a-z0-9._-]{3,64}$/.test(username) || !password || password.length > 1024) {
        throw new ApiError(400, 'Provide a valid username and password.');
      }
      const result = await pool.query(
        `SELECT ${SAFE_USER_COLUMNS}, password_hash FROM users WHERE username = $1 AND active = TRUE`,
        [username],
      );
      const user = result.rows[0];
      const valid = await verifyPassword(password, user?.password_hash || await DUMMY_PASSWORD_HASH);
      if (!user || !valid) throw new ApiError(401, 'Invalid username or password.');

      const { token, tokenHash: hashedToken } = createSessionToken();
      const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO auth_sessions(user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, hashedToken, expires],
      );
      const { password_hash: _passwordHash, ...safeUser } = user;
      res.status(200).json({ accessToken: token, tokenType: 'Bearer', expiresAt: expires.toISOString(), user: safeUser });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/v1', async (req, _res, next) => {
    try {
      const match = /^Bearer ([A-Za-z0-9_-]{40,64})$/.exec(req.get('authorization') || '');
      if (!match) throw new ApiError(401, 'Authentication is required.');
      const result = await pool.query(
        `SELECT u.id, u.username, u.name, u.role, u.active, s.id AS session_id
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active = TRUE`,
        [tokenHash(match[1])],
      );
      if (!result.rowCount) throw new ApiError(401, 'Session is invalid or expired. Sign in again.');
      req.actor = result.rows[0];
      next();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/v1/auth/logout', async (req, res, next) => {
    try {
      await pool.query('DELETE FROM auth_sessions WHERE id = $1', [req.actor.session_id]);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  const requireRoles = (...roles) => (req, _res, next) => {
    if (!roles.includes(req.actor.role)) return next(new ApiError(403, 'Your account is not authorized for this action.'));
    next();
  };
  const list = (table, fields, extra = '', params = []) => async (req, res, next) => {
    try {
      const limit = parseLimit(req.query.limit);
      const offset = parseOffset(req.query.offset);
      const result = await pool.query(
        `SELECT ${fields} FROM ${table} ${extra} ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      );
      const count = await pool.query(`SELECT count(*)::integer AS total FROM ${table} ${extra}`, params);
      res.json({ data: result.rows, pagination: { limit, offset, total: count.rows[0].total } });
    } catch (error) {
      next(error);
    }
  };

  app.get('/api/v1/camps', list('camps', '*'));
  app.get('/api/v1/inventory', async (req, res, next) => {
    try {
      const limit = parseLimit(req.query.limit);
      const offset = parseOffset(req.query.offset);
      const result = await pool.query(
        `SELECT i.*, p.reserved, p.available
         FROM inventory_items i JOIN inventory_stock_position p ON p.item_id = i.id
         ORDER BY i.id LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const count = await pool.query('SELECT count(*)::integer AS total FROM inventory_items');
      res.json({ data: result.rows, pagination: { limit, offset, total: count.rows[0].total } });
    } catch (error) {
      next(error);
    }
  });
  app.get('/api/v1/needs', list('camp_needs', '*'));
  app.get('/api/v1/dispatches', list('dispatches', '*'));
  app.get('/api/v1/donations', requireRoles('system_administrator', 'finance_audit_officer'),
    list('donations', '*'));
  app.get('/api/v1/audit-logs', requireRoles('system_administrator', 'finance_audit_officer'),
    list('audit_logs', '*'));

  app.post('/api/v1/dispatches', requireRoles('system_administrator', 'relief_coordinator', 'warehouse_manager'), async (req, res, next) => {
    try {
      const created = await createDispatch(pool, req.actor, req.get('idempotency-key'), req.body || {});
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/v1/dispatches/:id/status', async (req, res, next) => {
    try {
      const allowedRoles = ['system_administrator', 'relief_coordinator', 'warehouse_manager', 'field_volunteer'];
      if (!allowedRoles.includes(req.actor.role)) throw new ApiError(403, 'Your account is not authorized for dispatch updates.');
      const updated = await updateDispatch(pool, req.actor, req.get('idempotency-key'), req.params.id, req.body || {});
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, _res, next) => next(new ApiError(404, 'API endpoint not found.')));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(JSON.stringify({ event: 'api_error', message: error.message }));
    res.status(status).json({
      error: {
        code: status >= 500 ? 'internal_error' : 'request_error',
        message: status >= 500 ? 'An unexpected server error occurred.' : error.message,
      },
    });
  });
  return app;
}

if (require.main === module) {
  const { Pool } = require('pg');
  const port = Number(process.env.API_PORT || 8000);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT must be a valid TCP port.');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
    max: Number(process.env.PG_POOL_SIZE || 10),
  });
  const frontendOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  const app = createApp(pool, { frontendOrigins });
  const server = app.listen(port, '0.0.0.0', () => console.log(`ReliefHub production API listening on ${port}`));
  const shutdown = async () => {
    server.close();
    await pool.end();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { createApp };
