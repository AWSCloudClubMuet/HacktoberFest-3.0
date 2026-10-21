/* Mock REST API + static file server. Zero dependencies.
 *   node server/server.js   ->  http://localhost:3000
 *
 *   GET    /api/<collection>            list  (?field=value  ?q=text  ?_sort=f&_order=desc)
 *   GET    /api/<collection>/<id>
 *   POST   /api/<collection>            create
 *   PUT|PATCH /api/<collection>/<id>    update
 *   DELETE /api/<collection>/<id>
 *   POST   /api/_reset                  restore seed data
 * Role is sent in the X-Role header ("admin" | "volunteer"; default admin).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./store');
const { mutate, HttpError } = require('./rules');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const SEARCH_FIELDS = {
  camps: ['name', 'district'], inventory: ['name', 'category'],
  volunteers: ['name', 'skill'], donations: ['category', 'donor', 'type'],
  needs: ['priority'], dispatches: ['status'],
};

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Role',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) { reject(new HttpError(413, 'Body too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        resolve(parsed);
      } catch (_) { reject(new HttpError(400, 'Request body must be a JSON object')); }
    });
    req.on('error', reject);
  });
}

function list(col, params) {
  let rows = store.db[col].slice();
  for (const [k, v] of params) {
    if (k === 'q' || k.startsWith('_')) continue;
    rows = rows.filter((r) => String(r[k]) === v);          // ?camp_id=null works too
  }
  const q = (params.get('q') || '').trim().toLowerCase();
  if (q) {
    const fields = SEARCH_FIELDS[col];
    rows = rows.filter((r) => fields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)));
  }
  const sort = params.get('_sort');
  if (sort) {
    const dir = params.get('_order') === 'desc' ? -1 : 1;
    rows.sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * dir);
  }
  const limit = parseInt(params.get('_limit'), 10);
  return limit > 0 ? rows.slice(0, limit) : rows;
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);     // ['api', col, id]
  const role = req.headers['x-role'] === 'volunteer' ? 'volunteer' : 'admin';
  const col = parts[1];

  if (col === 'health') return send(res, 200, { ok: true, collections: store.COLLECTIONS.map((c) => [c, store.db[c].length]) });
  if (col === '_reset') {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST');
    if (role !== 'admin') throw new HttpError(403, 'Only the Relief Coordinator can reset data');
    store.reset();
    return send(res, 200, { reset: true });
  }
  if (!store.COLLECTIONS.includes(col)) throw new HttpError(404, `Unknown collection "${col}"`);
  const id = parts[2] === undefined ? undefined : Number(parts[2]);
  if (parts[2] !== undefined && !Number.isInteger(id)) throw new HttpError(404, 'Record not found');

  if (req.method === 'GET') {
    if (id === undefined) return send(res, 200, list(col, url.searchParams));
    const rec = store.find(col, id);
    if (!rec) throw new HttpError(404, 'Record not found');
    return send(res, 200, rec);
  }
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) throw new HttpError(405, 'Method not allowed');
  if (req.method === 'POST' && id !== undefined) throw new HttpError(405, 'POST goes to the collection URL');

  const body = req.method === 'DELETE' ? {} : await readBody(req);
  const snapshot = JSON.stringify(store.db);                 // all-or-nothing writes
  try {
    const out = mutate({ col, method: req.method, id, body, role, store });
    store.save();
    return send(res, out.status, out.body);
  } catch (err) {
    store.db = JSON.parse(snapshot);
    throw err;
  }
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function createServer() {
  store.load();
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, {});
    try {
      if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
      else serveStatic(req, res, url);
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, details: err.details });
      console.error(err);
      send(res, 500, { error: 'Internal server error' });
    }
  });
}

module.exports = { createServer };

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Relief Camp API + app running at http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/api/camps`);
  });
}