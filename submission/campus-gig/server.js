const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./src/data/db');

const usersRouter = require('./src/routes/users');
const gigsRouter = require('./src/routes/gigs');
const applicationsRouter = require('./src/routes/applications');
const reviewsRouter = require('./src/routes/reviews');
const statsRouter = require('./src/routes/stats');

// Initialize database
initDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/gigs', gigsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/stats', statsRouter);

// API Health check / info
app.get('/api', (req, res) => {
  res.json({
    name: 'Campus Gig & SkillSwap Portal REST API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      users: '/api/users',
      gigs: '/api/gigs',
      applications: '/api/applications',
      reviews: '/api/reviews',
      stats: '/api/stats',
      reset: 'POST /api/stats/reset'
    }
  });
});

// 404 handler for unknown /api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`
    });
  }
  next();
});

// Fallback to index.html for SPA-like navigation
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath);
});

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Campus Gig & SkillSwap Portal is running!`);
    console.log(`📡 Local URL: http://localhost:${PORT}`);
    console.log(`📚 REST API:  http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
