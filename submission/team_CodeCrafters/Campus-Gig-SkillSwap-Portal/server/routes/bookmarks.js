import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/bookmarks - Get bookmarked gig IDs for user
router.get('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || 'usr_1';
    const rows = db.prepare('SELECT gig_id FROM bookmarks WHERE user_id = ?').all(authUserId);
    res.json(rows.map(r => r.gig_id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmarks', details: error.message });
  }
});

// POST /api/bookmarks/:gigId - Toggle bookmark (add/remove)
router.post('/:gigId', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || 'usr_1';
    const gigId = req.params.gigId;

    const existing = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? AND gig_id = ?').get(authUserId, gigId);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND gig_id = ?').run(authUserId, gigId);
      return res.json({ bookmarked: false, gig_id: gigId, message: 'Removed from saved opportunities' });
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, gig_id) VALUES (?, ?)').run(authUserId, gigId);
      return res.json({ bookmarked: true, gig_id: gigId, message: 'Saved to bookmarked opportunities' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle bookmark', details: error.message });
  }
});

export default router;
