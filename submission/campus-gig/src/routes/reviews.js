const express = require('express');
const router = express.Router();
const { getDB, saveDB, enrichUser, getUserStats } = require('../data/db');

// Helper to enrich a review
function enrichReview(review) {
  const db = getDB();
  const reviewer = db.users.find(u => u.id === review.reviewerId);
  const reviewee = db.users.find(u => u.id === review.revieweeId);
  const gig = db.gigs.find(g => g.id === review.gigId);

  return {
    ...review,
    reviewer: reviewer ? {
      id: reviewer.id,
      name: reviewer.name,
      avatar: reviewer.avatar,
      major: reviewer.major
    } : null,
    reviewee: reviewee ? {
      id: reviewee.id,
      name: reviewee.name,
      avatar: reviewee.avatar,
      major: reviewee.major
    } : null,
    gigTitle: gig ? gig.title : 'Gig'
  };
}

// GET /api/reviews - List reviews
router.get('/', (req, res) => {
  const db = getDB();
  let reviews = [...db.reviews];

  const { gigId, revieweeId, reviewerId } = req.query;

  if (gigId) {
    reviews = reviews.filter(r => r.gigId === gigId);
  }

  if (revieweeId) {
    reviews = reviews.filter(r => r.revieweeId === revieweeId);
  }

  if (reviewerId) {
    reviews = reviews.filter(r => r.reviewerId === reviewerId);
  }

  // Newest first
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    count: reviews.length,
    data: reviews.map(enrichReview)
  });
});

// POST /api/reviews - Submit review for completed gig
router.post('/', (req, res) => {
  const db = getDB();
  const { gigId, reviewerId, rating, comment } = req.body;

  if (!gigId) {
    return res.status(400).json({ success: false, error: 'Gig ID is required.' });
  }

  if (!reviewerId) {
    return res.status(400).json({ success: false, error: 'Reviewer ID is required.' });
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Rating must be an integer between 1 and 5.'
    });
  }

  if (!comment || comment.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Review comment is required (at least 3 characters).'
    });
  }

  const gig = db.gigs.find(g => g.id === gigId);
  if (!gig) {
    return res.status(404).json({ success: false, error: 'Gig not found.' });
  }

  // RULE 1: Only completed gigs can be reviewed
  if (gig.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: `Reviews can only be submitted for completed gigs. Current gig status is "${gig.status}".`
    });
  }

  // RULE 2: Only gig owner and accepted applicant can submit reviews
  const isOwner = gig.ownerId === reviewerId;
  const isAcceptedApplicant = gig.acceptedApplicantId === reviewerId;

  if (!isOwner && !isAcceptedApplicant) {
    return res.status(403).json({
      success: false,
      error: 'Only the gig owner and accepted applicant are eligible to review each other.'
    });
  }

  // Determine reviewee
  const revieweeId = isOwner ? gig.acceptedApplicantId : gig.ownerId;
  if (!revieweeId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot determine review recipient.'
    });
  }

  // RULE 3: Each party can only submit one review per gig
  const alreadyReviewed = db.reviews.some(
    r => r.gigId === gigId && r.reviewerId === reviewerId
  );
  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      error: 'You have already submitted a review for this gig.'
    });
  }

  const id = `rev-${Date.now()}`;
  const newReview = {
    id,
    gigId,
    reviewerId,
    revieweeId,
    rating: parsedRating,
    comment: comment.trim(),
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);
  saveDB();

  // Recalculate stats for reviewee
  const updatedStats = getUserStats(revieweeId);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully!',
    data: {
      review: enrichReview(newReview),
      revieweeStats: updatedStats
    }
  });
});

module.exports = router;
