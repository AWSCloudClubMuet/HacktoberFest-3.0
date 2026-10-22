import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/reviews - List reviews with optional filters
router.get('/', (req, res) => {
  try {
    const { gig_id, reviewee_id, reviewer_id } = req.query;
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];

    if (gig_id) {
      query += ' AND gig_id = ?';
      params.push(gig_id);
    }
    if (reviewee_id) {
      query += ' AND reviewee_id = ?';
      params.push(reviewee_id);
    }
    if (reviewer_id) {
      query += ' AND reviewer_id = ?';
      params.push(reviewer_id);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

// POST /api/reviews - Submit mutual review for a completed gig
router.post('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || req.body.reviewer_id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required: Missing x-user-id header' });
    }

    const { gig_id, reviewee_id, rating, comment } = req.body;

    if (!gig_id) return res.status(400).json({ error: 'Gig ID is required' });
    if (!reviewee_id) return res.status(400).json({ error: 'Reviewee ID is required' });
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Review comment is required' });
    }

    const reviewer = db.prepare('SELECT * FROM users WHERE id = ?').get(authUserId);
    if (!reviewer) return res.status(404).json({ error: 'Reviewer user not found' });

    const reviewee = db.prepare('SELECT * FROM users WHERE id = ?').get(reviewee_id);
    if (!reviewee) return res.status(404).json({ error: 'Reviewee user not found' });

    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig_id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    // Enforce: gig must be Completed
    if (gig.status !== 'Completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed gigs' });
    }

    // Enforce: reviewer must be a participant (owner or accepted applicant)
    const isOwner = gig.user_id === reviewer.id;
    const isAcceptedApplicant = gig.accepted_applicant_id === reviewer.id;
    if (!isOwner && !isAcceptedApplicant) {
      return res.status(403).json({ error: 'Unauthorized: You were not a participant in this gig' });
    }

    // Enforce: reviewee must be the counterpart
    const expectedRevieweeId = isOwner ? gig.accepted_applicant_id : gig.user_id;
    if (reviewee_id !== expectedRevieweeId) {
      return res.status(400).json({ error: 'You can only review the counterpart participant of this gig' });
    }

    // Enforce: duplicate review prevention
    const existing = db.prepare(`
      SELECT id FROM reviews WHERE gig_id = ? AND reviewer_id = ?
    `).get(gig.id, reviewer.id);

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a review for this gig' });
    }

    const newReviewId = `rev_${Date.now()}`;
    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating))));

    const reviewTransaction = db.transaction(() => {
      // 1. Insert review
      db.prepare(`
        INSERT INTO reviews (
          id, gig_id, reviewer_id, reviewer_name, reviewer_avatar,
          reviewee_id, reviewee_name, rating, comment, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newReviewId,
        gig.id,
        reviewer.id,
        reviewer.name,
        reviewer.avatar,
        reviewee.id,
        reviewee.name,
        cleanRating,
        comment.trim(),
        new Date().toISOString()
      );

      // 2. Recalculate average rating & review count for reviewee from stored reviews
      const stats = db.prepare(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as count
        FROM reviews
        WHERE reviewee_id = ?
      `).get(reviewee.id);

      const newAvgRating = stats.avg_rating ? Number(stats.avg_rating.toFixed(1)) : 5.0;
      const newReviewCount = stats.count || 0;

      db.prepare(`
        UPDATE users
        SET rating = ?, reviews_count = ?
        WHERE id = ?
      `).run(newAvgRating, newReviewCount, reviewee.id);

      // 3. Send notification to reviewee
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, 'review', 0, ?)
      `).run(
        `notif_${Date.now()}`,
        reviewee.id,
        `New Review Received (${cleanRating}★)`,
        `${reviewer.name} left you a ${cleanRating}-star review for "${gig.title}".`,
        'Just now'
      );
    });

    reviewTransaction();

    const createdReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(newReviewId);
    const updatedReviewee = db.prepare('SELECT id, rating, reviews_count FROM users WHERE id = ?').get(reviewee.id);

    res.status(201).json({
      review: createdReview,
      updated_user: updatedReviewee
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
});

export default router;
