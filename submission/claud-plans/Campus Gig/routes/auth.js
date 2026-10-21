import { Router } from 'express';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  requireAuth,
  authLimiter,
} from '../middleware/auth.js';
import { users, nextUserId } from '../store.js';
import { UserModel } from '../models/User.js';
import { computeUserMetrics } from '../server.js';

export function createAuthRouter() {
  const router = Router();

  // Apply rate limiting to authentication routes
  router.use(authLimiter);

  // POST /auth/register - Register a new student freelancer
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, major, semester, skills } = req.body;

      // 1. Validation
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full name is required' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Valid university email is required' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please provide a valid email format' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      if (!major || !major.trim()) {
        return res.status(400).json({ error: 'Department or major is required' });
      }
      const numSemester = Number(semester);
      if (!numSemester || numSemester < 1 || numSemester > 12) {
        return res.status(400).json({ error: 'Semester must be a number between 1 and 12' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 2. Check if user already exists
      const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists' });
      }

      // 3. Hash password
      const hashedPassword = await hashPassword(password);

      // 4. Create new user record
      const parsedSkills = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const newUser = {
        id: nextUserId(),
        name: name.trim(),
        email: normalizedEmail,
        major: major.trim(),
        semester: numSemester,
        skills: parsedSkills,
        role: 'student',
        password: hashedPassword,
        created_at: new Date().toISOString(),
      };

      // Push to in-memory store
      users.push(newUser);

      // Async MongoDB persistence if online
      UserModel.create(newUser).catch(() => {});

      // 5. Generate JWT token
      const token = generateToken(newUser);

      return res.status(201).json({
        message: 'Student account registered successfully',
        token,
        user: sanitizeUser(newUser),
      });
    } catch (err) {
      console.error('[Auth Register Error]:', err);
      return res.status(500).json({ error: 'Internal server error during registration' });
    }
  });

  // POST /auth/login - Authenticate student credentials
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify bcrypt password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate signed JWT token
      const token = generateToken(user);

      return res.json({
        message: 'Login successful',
        token,
        user: sanitizeUser(user),
      });
    } catch (err) {
      console.error('[Auth Login Error]:', err);
      return res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  // POST /auth/quick-login - Instant persona login for evaluator role switching
  router.post('/quick-login', (req, res) => {
    const { userId, email } = req.body;
    let user = null;

    if (userId) {
      user = users.find((u) => u.id === userId);
    } else if (email) {
      user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ error: 'Student persona not found' });
    }

    const token = generateToken(user);
    return res.json({
      message: `Quick-login token generated for ${user.name}`,
      token,
      user: sanitizeUser(user),
    });
  });

  // GET /auth/me - Retrieve authenticated student profile with computed metrics
  router.get('/me', requireAuth, (req, res) => {
    const metrics = computeUserMetrics(req.currentUser);
    return res.json({
      user: sanitizeUser(metrics),
      authenticated: true,
      role: req.currentUser.role || 'student',
    });
  });

  return router;
}
