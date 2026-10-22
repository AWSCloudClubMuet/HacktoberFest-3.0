import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/applications - List applications with optional filtering
router.get('/', (req, res) => {
  try {
    const { gig_id, applicant_id, status } = req.query;
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];

    if (gig_id) {
      query += ' AND gig_id = ?';
      params.push(gig_id);
    }
    if (applicant_id) {
      query += ' AND applicant_id = ?';
      params.push(applicant_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
});

// POST /api/applications - Submit an application for an open gig
router.post('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || req.body.applicant_id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required: Missing x-user-id header' });
    }

    const { gig_id, message } = req.body;

    if (!gig_id) {
      return res.status(400).json({ error: 'Gig ID is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Application message is required' });
    }

    const applicant = db.prepare('SELECT * FROM users WHERE id = ?').get(authUserId);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant user not found' });
    }

    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig_id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Business rule: Own-gig application prevention
    if (gig.user_id === applicant.id) {
      return res.status(400).json({ error: 'You cannot apply to your own gig' });
    }

    // Business rule: Check gig status & expiration
    const today = new Date().toISOString().split('T')[0];
    if (gig.status !== 'Open' || (gig.deadline && gig.deadline < today)) {
      return res.status(400).json({ error: 'This gig is no longer open for applications' });
    }

    // Business rule: Duplicate application prevention
    const existing = db.prepare(`
      SELECT id FROM applications WHERE gig_id = ? AND applicant_id = ?
    `).get(gig.id, applicant.id);

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted an application for this gig' });
    }

    const newAppId = `app_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const applyTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO applications (
          id, gig_id, applicant_id, applicant_name, applicant_avatar,
          applicant_major, applicant_semester, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      `).run(
        newAppId,
        gig.id,
        applicant.id,
        applicant.name,
        applicant.avatar,
        applicant.major,
        applicant.semester,
        message.trim(),
        nowIso
      );

      // Increment applicants count
      db.prepare('UPDATE gigs SET applicants_count = applicants_count + 1 WHERE id = ?').run(gig.id);

      // Create notification for gig owner
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, 'application', 0, ?)
      `).run(
        `notif_${Date.now()}`,
        gig.user_id,
        'New Application Received',
        `${applicant.name} applied to your gig: "${gig.title}".`,
        'Just now'
      );
    });

    applyTransaction();

    const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(newAppId);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  }
});

// PATCH /api/applications/:id/accept - Accept an application (Atomic Milestone 3 logic)
router.patch('/:id/accept', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(app.gig_id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Ownership check: Only the gig owner can accept applicants
    if (authUserId && authUserId !== gig.user_id) {
      return res.status(403).json({ error: 'Unauthorized: Only the gig owner can accept applications' });
    }

    // Status check
    if (gig.status !== 'Open') {
      return res.status(400).json({ error: `Cannot accept application: Gig is already in "${gig.status}" status` });
    }

    const poster = db.prepare('SELECT name FROM users WHERE id = ?').get(gig.user_id);
    const posterName = poster ? poster.name : 'The gig owner';

    // ATOMIC TRANSACTION:
    // 1. Accept this application
    // 2. Reject all other pending applications for this same gig
    // 3. Set gig status to 'In Progress' and assign accepted_applicant_id
    // 4. Create notification for the accepted applicant
    const acceptTransaction = db.transaction(() => {
      // 1. Accept target application
      db.prepare("UPDATE applications SET status = 'Accepted' WHERE id = ?").run(app.id);

      // 2. Reject competing pending applications for the same gig
      const rejectStmt = db.prepare("UPDATE applications SET status = 'Rejected' WHERE gig_id = ? AND id != ? AND status = 'Pending'");
      rejectStmt.run(gig.id, app.id);

      // 3. Update gig status to In Progress
      db.prepare("UPDATE gigs SET status = 'In Progress', accepted_applicant_id = ? WHERE id = ?").run(app.applicant_id, gig.id);

      // 4. Send notification to accepted applicant
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, 'status', 0, ?)
      `).run(
        `notif_${Date.now()}`,
        app.applicant_id,
        'Application Accepted! 🎉',
        `${posterName} accepted your application for "${gig.title}". You can now start collaborating!`,
        'Just now'
      );
    });

    acceptTransaction();

    const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(app.id);
    const updatedGig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig.id);

    res.json({
      success: true,
      application: updatedApp,
      gig: updatedGig,
      message: `Accepted ${app.applicant_name}! Gig is now In Progress.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept application', details: error.message });
  }
});

// PATCH /api/applications/:id/reject - Reject an individual application
router.patch('/:id/reject', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(app.gig_id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (authUserId && authUserId !== gig.user_id) {
      return res.status(403).json({ error: 'Unauthorized: Only the gig owner can manage applications' });
    }

    db.prepare("UPDATE applications SET status = 'Rejected' WHERE id = ?").run(app.id);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(app.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject application', details: error.message });
  }
});

export default router;
