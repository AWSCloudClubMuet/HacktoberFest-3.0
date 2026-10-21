import { Router } from 'express';
import { db, formatGig } from '../db.js';

const router = Router();

// POST /api/ai/query - CampusLoop Rule-Based Intelligent Assistant backed by real DB data
router.post('/query', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || req.body.user_id || 'usr_1';
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const q = query.toLowerCase().trim();

    let text = '';
    let suggestedGigs = [];
    let chips = [];
    let action = null;

    if (q.includes('programming') || q.includes('coding') || q.includes('react') || q.includes('python') || q.includes('web')) {
      const rows = db.prepare(`
        SELECT * FROM gigs
        WHERE category = 'Programming' AND status = 'Open'
        ORDER BY created_at DESC LIMIT 3
      `).all();
      suggestedGigs = rows.map(formatGig);
      text = `Here are active programming opportunities currently open in the database:`;
      chips = ['Show high-paying gigs', 'How do I apply to a gig?'];
    } else if (q.includes('high-paying') || q.includes('highest paying') || q.includes('paid') || q.includes('budget')) {
      const rows = db.prepare(`
        SELECT * FROM gigs
        WHERE payment_type = 'Paid' AND status = 'Open'
        ORDER BY budget DESC LIMIT 3
      `).all();
      suggestedGigs = rows.map(formatGig);
      text = `Here are top-budget paid gigs currently available:`;
      chips = ['Find me programming gigs', 'Where are my applications?'];
    } else if (q.includes('design') || q.includes('ui/ux') || q.includes('figma') || q.includes('logo')) {
      const rows = db.prepare(`
        SELECT * FROM gigs
        WHERE category = 'Design' AND status = 'Open'
        ORDER BY created_at DESC LIMIT 3
      `).all();
      suggestedGigs = rows.map(formatGig);
      text = `Here are open design gigs right now:`;
      chips = ['How does Skill Swap work?', 'Where are my applications?'];
    } else if (q.includes('my application') || q.includes('applications') || q.includes('where are my')) {
      const myApps = db.prepare('SELECT * FROM applications WHERE applicant_id = ?').all(authUserId);
      text = `You currently have ${myApps.length} submitted application(s) in the database. You can track their status on your Student Dashboard.`;
      action = { label: 'Go to Dashboard', screen: 'dashboard' };
      chips = ['Find me programming gigs', 'Show high-paying gigs'];
    } else if (q.includes('skill swap') || q.includes('swap')) {
      text = `CampusLoop Skill Swap lets you exchange your expertise (like UI design) for another student's skills (like backend coding or math tutoring) with zero cash needed. Both students complete their agreed milestones and leave mutual reviews to build reputation!`;
      const rows = db.prepare(`
        SELECT * FROM gigs
        WHERE payment_type = 'Skill Swap' AND status = 'Open'
        ORDER BY created_at DESC LIMIT 3
      `).all();
      suggestedGigs = rows.map(formatGig);
      chips = ['Find me programming gigs', 'How do I apply to a gig?'];
    } else if (q.includes('apply') || q.includes('how to apply')) {
      text = `To apply to any open gig:\n1. Browse Explore or recommendations.\n2. Click "Apply Now" on any open gig.\n3. Write your pitch highlighting relevant experience.\n4. When the gig poster accepts your proposal, the gig status automatically moves to "In Progress"!`;
      chips = ['Find me programming gigs', 'Show high-paying gigs'];
    } else {
      // General keyword search on gigs
      const rows = db.prepare(`
        SELECT * FROM gigs
        WHERE status = 'Open' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)
        LIMIT 3
      `).all(`%${q}%`, `%${q}%`);

      if (rows.length > 0) {
        suggestedGigs = rows.map(formatGig);
        text = `I found ${rows.length} relevant gig(s) matching "${query}" in our database:`;
      } else {
        text = `I couldn't find an exact match for "${query}". You can browse all categories in Explore or ask me for programming, design, writing, or tutoring opportunities.`;
      }
      chips = ['Find me programming gigs', 'Show high-paying gigs', 'How does Skill Swap work?'];
    }

    res.json({
      query,
      text,
      suggestedGigs,
      chips,
      action
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process AI query', details: error.message });
  }
});

export default router;
