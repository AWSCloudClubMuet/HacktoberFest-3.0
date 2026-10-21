// reliefhub camp status api
// sample app for our devsecops pipeline demo (issue #2)
// plain node + express, no build step, dummy data only

const express = require('express');
const { query } = require('./db');

const app = express();
app.use(express.json());

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

// camp lookup by id - goes through the mock db layer
app.get('/api/camps/:id', async (req, res) => {
  const rows = await query('SELECT * FROM camps WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'camp not found' });
  }
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`camp status api listening on port ${PORT}`);
});
