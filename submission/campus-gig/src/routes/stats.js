const express = require('express');
const router = express.Router();
const { getDB, resetDB } = require('../data/db');

// GET /api/stats - High level portal metrics
router.get('/', (req, res) => {
  const db = getDB();

  const totalUsers = db.users.length;
  const totalGigs = db.gigs.length;
  const openGigs = db.gigs.filter(g => g.status === 'open').length;
  const inProgressGigs = db.gigs.filter(g => g.status === 'in_progress').length;
  const completedGigs = db.gigs.filter(g => g.status === 'completed').length;
  const totalApplications = db.applications.length;
  const totalReviews = db.reviews.length;

  const categoryCounts = {
    Programming: db.gigs.filter(g => g.category === 'Programming').length,
    Design: db.gigs.filter(g => g.category === 'Design').length,
    Writing: db.gigs.filter(g => g.category === 'Writing').length,
    Tutoring: db.gigs.filter(g => g.category === 'Tutoring').length
  };

  const paymentCounts = {
    Paid: db.gigs.filter(g => g.paymentType === 'Paid').length,
    'Skill Swap': db.gigs.filter(g => g.paymentType === 'Skill Swap').length,
    Free: db.gigs.filter(g => g.paymentType === 'Free').length
  };

  res.json({
    success: true,
    data: {
      totalUsers,
      totalGigs,
      openGigs,
      inProgressGigs,
      completedGigs,
      totalApplications,
      totalReviews,
      categoryCounts,
      paymentCounts
    }
  });
});

// POST /api/reset - Reset database to initial seed data
router.post('/reset', (req, res) => {
  const freshDB = resetDB();
  res.json({
    success: true,
    message: 'Database successfully reset to initial seed data.',
    counts: {
      users: freshDB.users.length,
      gigs: freshDB.gigs.length,
      applications: freshDB.applications.length,
      reviews: freshDB.reviews.length
    }
  });
});

module.exports = router;
