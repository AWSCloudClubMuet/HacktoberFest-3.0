import { Router } from 'express';
import { db, formatUser } from '../db.js';

const router = Router();

// GET /api/users - List all users
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
    res.json(rows.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// GET /api/users/:id - Get single user with profile and calculated reputation
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get live reviews received by user
    const reviewsReceived = db.prepare(`
      SELECT * FROM reviews WHERE reviewee_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    // Calculate rating stats from stored reviews
    let avgRating = user.rating;
    if (reviewsReceived.length > 0) {
      const sum = reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Number((sum / reviewsReceived.length).toFixed(1));
    }

    const ratingBreakdown = {
      5: reviewsReceived.filter(r => r.rating === 5).length,
      4: reviewsReceived.filter(r => r.rating === 4).length,
      3: reviewsReceived.filter(r => r.rating === 3).length,
      2: reviewsReceived.filter(r => r.rating === 2).length,
      1: reviewsReceived.filter(r => r.rating === 1).length
    };

    const formatted = formatUser(user);
    res.json({
      ...formatted,
      rating: avgRating,
      reviews_count: reviewsReceived.length,
      rating_breakdown: ratingBreakdown,
      reviews_received: reviewsReceived
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

// PATCH /api/users/:id - Update user profile (major, semester, bio, skills)
router.patch('/:id', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    if (authUserId && authUserId !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own profile' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { major, semester, bio, skills } = req.body;

    const updatedMajor = major !== undefined ? major : user.major;
    const updatedSemester = semester !== undefined ? semester : user.semester;
    const updatedBio = bio !== undefined ? bio : user.bio;
    const updatedSkills = skills !== undefined
      ? (typeof skills === 'string' ? skills : JSON.stringify(skills))
      : user.skills;

    db.prepare(`
      UPDATE users
      SET major = ?, semester = ?, bio = ?, skills = ?
      WHERE id = ?
    `).run(updatedMajor, updatedSemester, updatedBio, updatedSkills, req.params.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(formatUser(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile', details: error.message });
  }
});

export default router;
