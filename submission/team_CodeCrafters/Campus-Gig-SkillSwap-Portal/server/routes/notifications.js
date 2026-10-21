import { Router } from 'express';
import { db, formatNotification } from '../db.js';

const router = Router();

// GET /api/notifications - List notifications for user
router.get('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || 'usr_1';
    const rows = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(authUserId);

    res.json(rows.map(formatNotification));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || 'usr_1';
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(authUserId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications', details: error.message });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (authUserId && authUserId !== notif.user_id) {
      return res.status(403).json({ error: 'Unauthorized: Cannot modify notifications of other users' });
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    res.json(formatNotification(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

export default router;
