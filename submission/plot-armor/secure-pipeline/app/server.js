// reliefhub camp status api
// sample app for our devsecops pipeline demo (issue #2)
// plain node + express, no build step, dummy data only

const express = require('express');
const crypto = require('crypto');
const { query } = require('./db');

const app = express();
app.use(express.json());

// intentionally vulnerable - demo target for security scanning (dummy data only)
// fake aws credentials, these are the canonical example values from the aws docs, not real keys
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// intentionally vulnerable - demo target for security scanning (dummy data only)
// fake jwt signing secret, obviously should come from the environment instead
const JWT_SECRET = 'super-secret-jwt-key-change-me';

// dummy camp data so the api has something to serve
const camps = [
  { id: 1, name: 'Riverside Relief Camp', zone: 'north', capacity: 250, occupants: 198, status: 'operational' },
  { id: 2, name: 'Hilltop Shelter', zone: 'south', capacity: 120, occupants: 121, status: 'over-capacity' },
  { id: 3, name: 'Central Medical Camp', zone: 'east', capacity: 400, occupants: 265, status: 'operational' },
  { id: 4, name: 'Lakeside Emergency Camp', zone: 'west', capacity: 180, occupants: 44, status: 'winding-down' },
];

// health endpoint - the pipeline smoke test hits this
app.get('/', (req, res) => {
  res.json({ app: 'reliefhub camp status api', status: 'ok', uptime: process.uptime() });
});

// overall camp status summary
app.get('/api/status', (req, res) => {
  const totalCapacity = camps.reduce((sum, c) => sum + c.capacity, 0);
  const totalOccupants = camps.reduce((sum, c) => sum + c.occupants, 0);
  res.json({
    ok: true,
    camps: camps.length,
    totalCapacity,
    totalOccupants,
    utilization: `${Math.round((totalOccupants / totalCapacity) * 100)}%`,
    generatedAt: new Date().toISOString(),
  });
});

// intentionally vulnerable - demo target for security scanning (dummy data only)
// eval on a user-supplied query param, classic rce demo - never do this for real
app.get('/api/calc', (req, res) => {
  const expr = req.query.expr || '0';
  try {
    const result = eval(expr);
    res.json({ expr, result });
  } catch (err) {
    res.status(400).json({ error: 'invalid expression' });
  }
});

// camp lookup by id - goes through the mock db layer
// intentionally vulnerable - demo target for security scanning (dummy data only)
// sql built by dropping the user input straight into the string -> injection demo
app.get('/api/camps/:id', async (req, res) => {
  const rows = await query(`SELECT * FROM camps WHERE id = ${req.params.id}`);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'camp not found' });
  }
  res.json(rows[0]);
});

// camp search by name, same unsafe pattern
// intentionally vulnerable - demo target for security scanning (dummy data only)
app.get('/api/camps', async (req, res) => {
  const name = req.query.name || '';
  const rows = await query(`SELECT * FROM camps WHERE name LIKE '%${name}%'`);
  res.json(rows);
});

// intentionally vulnerable - demo target for security scanning (dummy data only)
// weak md5 hashing for the demo "password hash" helper
function hashPassword(plain) {
  return crypto.createHash('md5').update(plain).digest('hex');
}

// demo route showing the weak hash in action (hashes whatever word you post)
app.post('/api/hash-password', (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'password is required' });
  }
  res.json({ algorithm: 'md5', hash: hashPassword(password) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`camp status api listening on port ${PORT}`);
});
