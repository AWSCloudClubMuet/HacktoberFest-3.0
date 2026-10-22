import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { seedDatabase } from './db.js';

import usersRouter from './routes/users.js';
import gigsRouter from './routes/gigs.js';
import applicationsRouter from './routes/applications.js';
import reviewsRouter from './routes/reviews.js';
import conversationsRouter from './routes/conversations.js';
import notificationsRouter from './routes/notifications.js';
import bookmarksRouter from './routes/bookmarks.js';
import statsRouter from './routes/stats.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CampusLoop API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/gigs', gigsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);

// 404 Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Seed database on startup if empty
seedDatabase(false);

// Export for testing
export default app;

// Start server if executed directly (not imported as a test module)
const isDirectEntry = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('server\\index.js') ||
  process.argv[1].endsWith('server/index.js')
);

if (isDirectEntry && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 CampusLoop Backend running on http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`==================================================\n`);
  });
}
