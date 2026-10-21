const express = require('express');
const router = express.Router();
const { getDB, saveDB, enrichUser } = require('../data/db');

// GET /api/users - List all users (with dynamic stats)
router.get('/', (req, res) => {
  const db = getDB();
  let users = db.users.map(u => enrichUser(u));

  const { q, major, skill } = req.query;

  if (q) {
    const term = q.toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.major.toLowerCase().includes(term) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(term)))
    );
  }

  if (major) {
    users = users.filter(u => u.major.toLowerCase().includes(major.toLowerCase()));
  }

  if (skill) {
    users = users.filter(u => u.skills && u.skills.some(s => s.toLowerCase() === skill.toLowerCase()));
  }

  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// GET /api/users/:id - Get single user with details and reviews
router.get('/:id', (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const enriched = enrichUser(user);

  // Reviews received
  const reviewsReceived = db.reviews
    .filter(r => r.revieweeId === user.id)
    .map(r => {
      const reviewer = db.users.find(u => u.id === r.reviewerId);
      const gig = db.gigs.find(g => g.id === r.gigId);
      return {
        ...r,
        reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, avatar: reviewer.avatar } : null,
        gigTitle: gig ? gig.title : 'Gig'
      };
    });

  // User's gigs (as owner)
  const ownedGigs = db.gigs.filter(g => g.ownerId === user.id);

  res.json({
    success: true,
    data: {
      ...enriched,
      reviewsReceived,
      ownedGigsCount: ownedGigs.length
    }
  });
});

// POST /api/users - Create new student profile
router.post('/', (req, res) => {
  const db = getDB();
  const { name, email, major, semester, bio, skills, avatar } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name is required (at least 2 characters)' });
  }
  if (!major || major.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Major is required' });
  }

  let formattedSkills = [];
  if (Array.isArray(skills)) {
    formattedSkills = skills.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof skills === 'string') {
    formattedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
  }

  const id = `usr-${Date.now()}`;
  const newUser = {
    id,
    name: name.trim(),
    email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    major: major.trim(),
    semester: semester ? semester.trim() : 'Semester 1',
    bio: bio ? bio.trim() : 'Campus member ready to swap skills and collaborate.',
    skills: formattedSkills.length > 0 ? formattedSkills : ['Communication', 'Teamwork']
  };

  db.users.push(newUser);
  saveDB();

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: enrichUser(newUser)
  });
});

// PATCH /api/users/:id - Update student profile
router.patch('/:id', (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { name, major, semester, bio, skills, avatar } = req.body;

  if (name !== undefined) user.name = String(name).trim();
  if (major !== undefined) user.major = String(major).trim();
  if (semester !== undefined) user.semester = String(semester).trim();
  if (bio !== undefined) user.bio = String(bio).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();

  if (skills !== undefined) {
    if (Array.isArray(skills)) {
      user.skills = skills.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      user.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  saveDB();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: enrichUser(user)
  });
});

module.exports = router;
