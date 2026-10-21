const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'public', 'db', 'db.json');

function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const collections = ['camps', 'inventory', 'needs', 'dispatches', 'donations', 'volunteers'];

collections.forEach(collection => {
  // GET all / GET with query params
  app.get(`/${collection}`, (req, res) => {
    const db = readDB();
    let results = db[collection] || [];
    
    Object.keys(req.query).forEach(key => {
      results = results.filter(item => String(item[key]) === req.query[key]);
    });
    
    res.json(results);
  });

  // GET by ID
  app.get(`/${collection}/:id`, (req, res) => {
    const db = readDB();
    const item = (db[collection] || []).find(i => i.id === req.params.id);
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
  });

  // POST create
  app.post(`/${collection}`, (req, res) => {
    const db = readDB();
    const newItem = { ...req.body, id: `${collection}-${Date.now()}` };
    db[collection].push(newItem);
    writeDB(db);
    res.status(201).json(newItem);
  });

  // PUT update (full)
  app.put(`/${collection}/:id`, (req, res) => {
    const db = readDB();
    const index = db[collection].findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...req.body };
      writeDB(db);
      res.json(db[collection][index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // PATCH update (partial)
  app.patch(`/${collection}/:id`, (req, res) => {
    const db = readDB();
    const index = db[collection].findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...req.body };
      writeDB(db);
      res.json(db[collection][index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // DELETE
  app.delete(`/${collection}/:id`, (req, res) => {
    const db = readDB();
    db[collection] = db[collection].filter(i => i.id !== req.params.id);
    writeDB(db);
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  collections.forEach(c => {
    console.log(`  http://localhost:${PORT}/${c}`);
  });
});