import { Router } from 'express';
import { db, formatGig } from '../db.js';

const router = Router();

// Helper: auto-expire open gigs whose deadline has passed
function autoExpireGigs() {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE gigs
    SET status = 'Expired'
    WHERE status = 'Open' AND deadline < ?
  `).run(today);
}

// GET /api/gigs - List gigs with filtering, search, and sorting
router.get('/', (req, res) => {
  try {
    autoExpireGigs();

    const {
      search,
      category,
      type,
      payment_type,
      status,
      user_id,
      accepted_applicant_id,
      min_budget,
      max_budget,
      sort
    } = req.query;

    let query = 'SELECT * FROM gigs WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (type && type !== 'All') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (payment_type && payment_type !== 'All') {
      query += ' AND payment_type = ?';
      params.push(payment_type);
    }

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (accepted_applicant_id) {
      query += ' AND accepted_applicant_id = ?';
      params.push(accepted_applicant_id);
    }

    if (min_budget !== undefined && min_budget !== '') {
      query += ' AND budget >= ?';
      params.push(Number(min_budget));
    }

    if (max_budget !== undefined && max_budget !== '') {
      query += ' AND budget <= ?';
      params.push(Number(max_budget));
    }

    // Sorting
    switch (sort) {
      case 'deadline':
        query += ' ORDER BY deadline ASC';
        break;
      case 'budget_high':
        query += ' ORDER BY budget DESC NULLS LAST';
        break;
      case 'budget_low':
        query += ' ORDER BY budget ASC NULLS LAST';
        break;
      case 'rating':
        query += ' ORDER BY poster_rating DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY created_at DESC';
        break;
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(formatGig));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gigs', details: error.message });
  }
});

// GET /api/gigs/:id - Get single gig details
router.get('/:id', (req, res) => {
  try {
    autoExpireGigs();

    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Include applications count and poster user details
    const poster = db.prepare('SELECT * FROM users WHERE id = ?').get(gig.user_id);
    const applications = db.prepare('SELECT * FROM applications WHERE gig_id = ?').all(gig.id);

    res.json({
      ...formatGig(gig),
      poster_details: poster ? {
        id: poster.id,
        name: poster.name,
        avatar: poster.avatar,
        major: poster.major,
        semester: poster.semester,
        rating: poster.rating,
        reviews_count: poster.reviews_count
      } : null,
      applications_count: applications.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gig details', details: error.message });
  }
});

// POST /api/gigs - Create new gig
router.post('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || req.body.user_id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required: Missing x-user-id header' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(authUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      title,
      description,
      type,
      category,
      payment_type,
      budget,
      deadline,
      skills_required,
      image
    } = req.body;

    // Validation
    const errors = [];
    if (!title || !title.trim()) errors.push('Title is required');
    if (!description || !description.trim()) errors.push('Description is required');
    if (!type || !['Offering', 'Requesting'].includes(type)) errors.push('Type must be Offering or Requesting');
    if (!category || !['Programming', 'Design', 'Writing', 'Tutoring'].includes(category)) {
      errors.push('Category must be Programming, Design, Writing, or Tutoring');
    }
    if (!payment_type || !['Paid', 'Skill Swap', 'Free'].includes(payment_type)) {
      errors.push('Payment type must be Paid, Skill Swap, or Free');
    }
    if (payment_type === 'Paid') {
      if (budget === undefined || budget === null || Number(budget) <= 0) {
        errors.push('A positive budget amount is required for Paid gigs');
      }
    }
    if (!deadline) {
      errors.push('Deadline date is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const newGigId = `gig_${Date.now()}`;
    const skillsJson = Array.isArray(skills_required)
      ? JSON.stringify(skills_required)
      : JSON.stringify([category]);

    const gigImage = image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80";

    const createTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO gigs (
          id, user_id, poster_name, poster_avatar, poster_rating,
          title, description, type, category, payment_type, budget,
          deadline, status, accepted_applicant_id, created_at,
          applicants_count, skills_required, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', NULL, ?, 0, ?, ?)
      `).run(
        newGigId,
        user.id,
        user.name,
        user.avatar,
        user.rating,
        title.trim(),
        description.trim(),
        type,
        category,
        payment_type,
        payment_type === 'Paid' ? Number(budget) : null,
        deadline,
        new Date().toISOString(),
        skillsJson,
        gigImage
      );

      // Increment poster's gigs_posted count
      db.prepare('UPDATE users SET gigs_posted = gigs_posted + 1 WHERE id = ?').run(user.id);
    });

    createTransaction();

    const created = db.prepare('SELECT * FROM gigs WHERE id = ?').get(newGigId);
    res.status(201).json(formatGig(created));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create gig', details: error.message });
  }
});

// PATCH /api/gigs/:id - Edit gig or update status (e.g. In Progress -> Completed)
router.patch('/:id', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const { status, title, description, category, type, payment_type, budget, deadline, skills_required } = req.body;

    // Status transition handling
    if (status) {
      if (status === 'Completed') {
        // Enforce: only participants (owner or accepted applicant) can complete the gig
        if (authUserId && authUserId !== gig.user_id && authUserId !== gig.accepted_applicant_id) {
          return res.status(403).json({ error: 'Unauthorized: Only project participants can complete this gig' });
        }

        // Enforce: must transition from 'In Progress' to 'Completed'
        if (gig.status !== 'In Progress') {
          return res.status(400).json({ error: `Cannot complete gig: Status is currently "${gig.status}", must be "In Progress"` });
        }

        const completeTransaction = db.transaction(() => {
          db.prepare("UPDATE gigs SET status = 'Completed' WHERE id = ?").run(gig.id);

          // Increment gigs_completed for both participants
          db.prepare('UPDATE users SET gigs_completed = gigs_completed + 1 WHERE id = ?').run(gig.user_id);
          if (gig.accepted_applicant_id) {
            db.prepare('UPDATE users SET gigs_completed = gigs_completed + 1 WHERE id = ?').run(gig.accepted_applicant_id);

            // Notify counterpart
            const counterpartId = authUserId === gig.user_id ? gig.accepted_applicant_id : gig.user_id;
            const caller = db.prepare('SELECT name FROM users WHERE id = ?').get(authUserId || gig.user_id);
            const callerName = caller ? caller.name : 'Your collaborator';

            db.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
              VALUES (?, ?, ?, ?, 'review', 0, ?)
            `).run(
              `notif_${Date.now()}`,
              counterpartId,
              'Gig Completed! ⭐',
              `"${gig.title}" was marked as Completed by ${callerName}. You can now leave a mutual review!`,
              'Just now'
            );
          }
        });

        completeTransaction();
        const updated = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig.id);
        return res.json(formatGig(updated));
      }

      // Other direct status changes require owner permission
      if (authUserId && authUserId !== gig.user_id) {
        return res.status(403).json({ error: 'Unauthorized: Only the gig owner can update this gig status' });
      }

      db.prepare('UPDATE gigs SET status = ? WHERE id = ?').run(status, gig.id);
    }

    // Editable fields require owner
    if (title || description || category || type || payment_type || budget !== undefined || deadline) {
      if (authUserId && authUserId !== gig.user_id) {
        return res.status(403).json({ error: 'Unauthorized: Only the gig owner can edit gig details' });
      }

      const updatedTitle = title !== undefined ? title.trim() : gig.title;
      const updatedDesc = description !== undefined ? description.trim() : gig.description;
      const updatedCat = category !== undefined ? category : gig.category;
      const updatedType = type !== undefined ? type : gig.type;
      const updatedPayType = payment_type !== undefined ? payment_type : gig.payment_type;
      const updatedBudget = payment_type === 'Paid' ? Number(budget) : (payment_type ? null : gig.budget);
      const updatedDeadline = deadline !== undefined ? deadline : gig.deadline;
      const updatedSkills = skills_required !== undefined
        ? (Array.isArray(skills_required) ? JSON.stringify(skills_required) : skills_required)
        : gig.skills_required;

      db.prepare(`
        UPDATE gigs
        SET title = ?, description = ?, category = ?, type = ?, payment_type = ?, budget = ?, deadline = ?, skills_required = ?
        WHERE id = ?
      `).run(updatedTitle, updatedDesc, updatedCat, updatedType, updatedPayType, updatedBudget, updatedDeadline, updatedSkills, gig.id);
    }

    const finalGig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig.id);
    res.json(formatGig(finalGig));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update gig', details: error.message });
  }
});

// DELETE /api/gigs/:id - Delete gig (Owner only)
router.delete('/:id', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'];
    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (authUserId && authUserId !== gig.user_id) {
      return res.status(403).json({ error: 'Unauthorized: Only the gig owner can delete this gig' });
    }

    const deleteTransaction = db.transaction(() => {
      db.prepare('DELETE FROM applications WHERE gig_id = ?').run(gig.id);
      db.prepare('DELETE FROM bookmarks WHERE gig_id = ?').run(gig.id);
      db.prepare('DELETE FROM reviews WHERE gig_id = ?').run(gig.id);
      db.prepare('DELETE FROM gigs WHERE id = ?').run(gig.id);
      db.prepare('UPDATE users SET gigs_posted = MAX(0, gigs_posted - 1) WHERE id = ?').run(gig.user_id);
    });

    deleteTransaction();
    res.json({ success: true, message: 'Gig deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gig', details: error.message });
  }
});

export default router;
