import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth } from './middleware.js';
import { resetDb, saveDb } from './db.js';
import users from './routes/users.js';
import gigs from './routes/gigs.js';
import applications from './routes/applications.js';
import reviews from './routes/reviews.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serves the frontend
app.use((req, res, next) => {            // persist after every successful mutation
  if (req.method !== 'GET') res.on('finish', () => res.statusCode < 400 && saveDb());
  next();
});
app.use(auth);

app.use('/users', users);
app.use('/gigs', gigs);
app.use('/applications', applications);
app.use('/reviews', reviews);
app.post('/reset', (_req, res) => { resetDb(); res.json({ ok: true }); });

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.listen(4000, () => console.log('API + UI running on http://localhost:4000'));