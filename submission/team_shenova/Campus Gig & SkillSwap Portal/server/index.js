// server/index.js
// Express API Server for Campus Gig & SkillSwap Portal

const express = require('express');
const cors = require('cors');
const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger for debugging during dev & testing
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    // console.log(`[${req.method}] ${req.url}`);
  }
  next();
});

// Helper: Extract acting user id from headers or query or body
// Note: This project uses a demo-user persona switcher for testing campus peer roles,
// not real authentication (passwords, JWT, sessions). 'x-user-id' represents the acting persona.
function getActingUserId(req) {
  return req.headers['x-user-id'] || req.query.acting_user_id || (req.body && req.body.acting_user_id);
}

// Helper: Require and verify valid acting-user identity for protected operations
function getVerifiedActingUser(req, res) {
  const actingUserId = getActingUserId(req);
  if (!actingUserId) {
    res.status(401).json({ error: "Unauthorized: Acting user identity is required (provide via 'x-user-id' header or acting_user_id)" });
    return null;
  }

  const user = storage.getUserById(actingUserId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized: Invalid acting user (user not found in storage)" });
    return null;
  }

  return user;
}

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Campus Gig & SkillSwap Portal API'
  });
});

// -------------------------------------------------------------
// Users & Profiles
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  try {
    const users = storage.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve users", details: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { name, major, department, semester, bio, skills, email } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: "Student name is required and must be at least 2 characters long" });
    }

    // Validate major / department
    const userMajor = (major || department || '').trim();
    if (!userMajor) {
      return res.status(400).json({ error: "Major or department is required" });
    }

    // Validate semester
    if (!semester || typeof semester !== 'string' || !semester.trim()) {
      return res.status(400).json({ error: "Semester is required" });
    }

    // Email check (optional, but duplicate prevention if provided)
    if (email && typeof email === 'string' && email.trim()) {
      const emailTrimmed = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingUser = storage.getUserByEmail(emailTrimmed);
      if (existingUser) {
        return res.status(400).json({ error: "A student profile with this email already exists" });
      }
    }

    // Parse skills (support array or comma-separated string)
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      parsedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newUser = storage.createUser({
      name: name.trim(),
      major: userMajor,
      department: userMajor,
      semester: semester.trim(),
      bio: bio && typeof bio === 'string' ? bio.trim() : '',
      skills: parsedSkills,
      email: email && typeof email === 'string' ? email.trim() : undefined
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to create student profile", details: err.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Also include user's reviews received and given
    const reviewsReceived = storage.getReviews({ reviewee_id: user.id });
    const reviewsGiven = storage.getReviews({ reviewer_id: user.id });

    res.json({
      ...user,
      reviews_received: reviewsReceived,
      reviews_given: reviewsGiven
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve user", details: err.message });
  }
});

app.patch('/api/users/:id', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    if (actingUser.id !== req.params.id) {
      return res.status(403).json({ error: "Forbidden: Cannot edit another user's profile" });
    }

    const { name, major, department, semester, bio, skills } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Student name cannot be empty" });
      }
      updates.name = name.trim();
    }
    if (major !== undefined) updates.major = major.trim();
    if (department !== undefined) updates.department = department.trim();
    if (semester !== undefined) updates.semester = semester.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (skills !== undefined && Array.isArray(skills)) updates.skills = skills.map(s => s.trim()).filter(Boolean);

    const updated = storage.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user profile", details: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    if (actingUser.id !== req.params.id) {
      return res.status(403).json({ error: "Forbidden: Cannot edit another user's profile" });
    }

    const { name, major, department, semester, bio, skills } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Student name cannot be empty" });
      }
      updates.name = name.trim();
    }
    if (major !== undefined) updates.major = major.trim();
    if (department !== undefined) updates.department = department.trim();
    if (semester !== undefined) updates.semester = semester.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (skills !== undefined && Array.isArray(skills)) updates.skills = skills.map(s => s.trim()).filter(Boolean);

    const updated = storage.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user profile", details: err.message });
  }
});

// -------------------------------------------------------------
// Gigs
// -------------------------------------------------------------
const ALLOWED_TYPES = ['Offering', 'Requesting'];
const ALLOWED_CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
const ALLOWED_PAYMENT_TYPES = ['Paid', 'SkillSwap', 'Free'];
const ALLOWED_STATUSES = ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'];

app.get('/api/gigs', (req, res) => {
  try {
    const filters = {
      search: req.query.search || req.query.q,
      q: req.query.q || req.query.search,
      category: req.query.category,
      type: req.query.type,
      payment_type: req.query.payment_type,
      status: req.query.status,
      user_id: req.query.user_id,
      applicant_id: req.query.applicant_id,
      min_budget: req.query.min_budget,
      max_budget: req.query.max_budget,
      sort: req.query.sort
    };
    const gigs = storage.getGigs(filters);
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gigs", details: err.message });
  }
});

app.get('/api/gigs/:id', (req, res) => {
  try {
    const gig = storage.getGigById(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    // Attach applications info
    const applications = storage.getApplications({ gig_id: gig.id });
    const reviews = storage.getReviews({ gig_id: gig.id });

    res.json({
      ...gig,
      applications,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gig details", details: err.message });
  }
});

app.post('/api/gigs', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    // Prevent attempts to impersonate another user in request body
    if (req.body.user_id && req.body.user_id !== actingUser.id) {
      return res.status(403).json({ error: "Forbidden: Cannot create gig on behalf of another user" });
    }

    const { title, description, type, category, payment_type, budget, deadline } = req.body;

    // Validation: Title
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ error: "Title must be at least 5 characters long" });
    }

    // Validation: Description
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: "Description must be at least 10 characters long" });
    }

    // Validation: Type
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: `Type must be one of: ${ALLOWED_TYPES.join(', ')}` });
    }

    // Validation: Category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
    }

    // Validation: Payment Type
    if (!ALLOWED_PAYMENT_TYPES.includes(payment_type)) {
      return res.status(400).json({ error: `Payment type must be one of: ${ALLOWED_PAYMENT_TYPES.join(', ')}` });
    }

    // Validation: Budget
    if (payment_type === 'Paid') {
      const budgetNum = Number(budget);
      if (budget === undefined || budget === null || isNaN(budgetNum) || budgetNum <= 0) {
        return res.status(400).json({ error: "Paid gigs require a valid positive budget greater than 0" });
      }
    }

    // Validation: Deadline
    if (!deadline) {
      return res.status(400).json({ error: "Deadline is required" });
    }
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: "Invalid deadline date format" });
    }
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: "Deadline must be a future date" });
    }

    // Associate gig with verified acting user rather than trusting arbitrary body
    const created = storage.createGig({
      user_id: actingUser.id,
      title,
      description,
      type,
      category,
      payment_type,
      budget,
      deadline: deadlineDate.toISOString()
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create gig", details: err.message });
  }
});

app.patch('/api/gigs/:id', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    const gig = storage.getGigById(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    // Enforce ownership: only owner can update gig
    if (actingUser.id !== gig.user_id) {
      return res.status(403).json({ error: "Forbidden: Only the gig owner can update or cancel this gig" });
    }

    const updates = {};
    const { title, description, type, category, payment_type, budget, deadline, status } = req.body;

    // Status transition validation
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
      }

      const current = gig.status;
      if (current === status) {
        // No-op
      } else if (status === 'In Progress') {
        // Direct transition to In Progress is strictly prohibited
        return res.status(400).json({ error: "Invalid status transition: Direct transition to 'In Progress' is not permitted. A gig moves to 'In Progress' only when a pending applicant is accepted." });
      } else if (current === 'Completed') {
        return res.status(400).json({ error: "Cannot change status of a Completed gig" });
      } else if (current === 'Cancelled') {
        return res.status(400).json({ error: "Cannot change status of a Cancelled gig" });
      } else if (current === 'Expired') {
        return res.status(400).json({ error: "Cannot change status of an Expired gig" });
      } else if (status === 'Completed') {
        // Allow completion only from In Progress and only by the gig owner
        if (current !== 'In Progress') {
          return res.status(400).json({ error: "Invalid status transition: A gig can become Completed ONLY from In Progress" });
        }
        updates.status = status;
      } else if (status === 'Cancelled') {
        if (current !== 'Open' && current !== 'In Progress') {
          return res.status(400).json({ error: `Cannot cancel a gig with status '${current}'` });
        }
        updates.status = status;
      } else if (status === 'Open') {
        return res.status(400).json({ error: `Cannot transition from '${current}' back to 'Open'` });
      } else {
        updates.status = status;
      }
    }

    // Editable content fields (only allowed while Open)
    if (gig.status === 'Open') {
      if (title !== undefined) {
        if (title.trim().length < 5) return res.status(400).json({ error: "Title must be at least 5 chars" });
        updates.title = title.trim();
      }
      if (description !== undefined) {
        if (description.trim().length < 10) return res.status(400).json({ error: "Description must be at least 10 chars" });
        updates.description = description.trim();
      }
      if (type !== undefined) {
        if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: "Invalid type" });
        updates.type = type;
      }
      if (category !== undefined) {
        if (!ALLOWED_CATEGORIES.includes(category)) return res.status(400).json({ error: "Invalid category" });
        updates.category = category;
      }
      if (payment_type !== undefined) {
        if (!ALLOWED_PAYMENT_TYPES.includes(payment_type)) return res.status(400).json({ error: "Invalid payment type" });
        updates.payment_type = payment_type;
      }
      if (budget !== undefined || payment_type !== undefined) {
        const finalPaymentType = payment_type || gig.payment_type;
        if (finalPaymentType === 'Paid') {
          const val = budget !== undefined ? Number(budget) : Number(gig.budget);
          if (isNaN(val) || val <= 0) {
            return res.status(400).json({ error: "Paid gigs require a valid budget > 0" });
          }
          updates.budget = val;
        } else {
          updates.budget = null;
        }
      }
      if (deadline !== undefined) {
        const d = new Date(deadline);
        if (isNaN(d.getTime())) return res.status(400).json({ error: "Invalid deadline" });
        if (d <= new Date()) return res.status(400).json({ error: "Deadline must be in the future" });
        updates.deadline = d.toISOString();
      }
    } else {
      // If gig is not Open, reject changes to core details
      if (title || description || type || category || payment_type || budget || deadline) {
        return res.status(400).json({ error: `Cannot modify gig details when status is '${gig.status}'` });
      }
    }

    const updated = storage.updateGig(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update gig", details: err.message });
  }
});

app.delete('/api/gigs/:id', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    const gig = storage.getGigById(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    if (actingUser.id !== gig.user_id) {
      return res.status(403).json({ error: "Forbidden: Only the gig owner can delete this gig" });
    }

    if (gig.status === 'In Progress' || gig.status === 'Completed') {
      return res.status(400).json({ error: `Cannot delete gig while it is '${gig.status}'` });
    }

    storage.deleteGig(req.params.id);
    res.json({ success: true, message: "Gig deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete gig", details: err.message });
  }
});

// -------------------------------------------------------------
// Applications
// -------------------------------------------------------------
app.get('/api/applications', (req, res) => {
  try {
    const { gig_id, applicant_id, status } = req.query;
    const applications = storage.getApplications({ gig_id, applicant_id, status });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve applications", details: err.message });
  }
});

app.post('/api/applications', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    // Prevent attempts to impersonate another user in request body
    if (req.body.applicant_id && req.body.applicant_id !== actingUser.id) {
      return res.status(403).json({ error: "Forbidden: Cannot submit application on behalf of another user" });
    }

    // Derive applicant identity from verified acting user
    const applicantId = actingUser.id;

    const { gig_id, message, contact_link } = req.body;
    if (!gig_id) {
      return res.status(400).json({ error: "Gig ID is required" });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: "Application message must be at least 5 characters long" });
    }

    const gig = storage.getGigById(gig_id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    // 1. Prevent self-applications
    if (gig.user_id === applicantId) {
      return res.status(400).json({ error: "You cannot apply to your own gig" });
    }

    // 2. Block applications to expired or otherwise non-Open gigs
    if (gig.status !== 'Open') {
      return res.status(400).json({ error: `Applications are closed for this gig (Status: ${gig.status})` });
    }

    // Check if gig is overdue
    if (new Date(gig.deadline) <= new Date()) {
      storage.checkOverdueGigs();
      return res.status(400).json({ error: "Applications are closed because the gig deadline has passed" });
    }

    // 3. Prevent duplicate applications
    const existingApps = storage.getApplications({ gig_id, applicant_id: applicantId });
    if (existingApps.length > 0) {
      return res.status(400).json({ error: "You have already applied to this gig" });
    }

    const application = storage.createApplication({
      gig_id,
      applicant_id: applicantId,
      message,
      contact_link
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit application", details: err.message });
  }
});

// Applicant Selection and Status Management
app.patch('/api/applications/:id', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    const application = storage.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const gig = storage.getGigById(application.gig_id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    // Only gig owner can accept or reject applications
    if (actingUser.id !== gig.user_id) {
      return res.status(403).json({ error: "Forbidden: Only the gig owner can accept or reject applications" });
    }

    const { action, status } = req.body;
    const finalAction = action || (status === 'Accepted' ? 'accept' : status === 'Rejected' ? 'reject' : null);

    if (finalAction !== 'accept' && finalAction !== 'reject') {
      return res.status(400).json({ error: "Action must be either 'accept' or 'reject'" });
    }

    // Enforce valid application decisions:
    // Only Pending applications may be accepted or rejected
    if (application.status === 'Accepted') {
      return res.status(400).json({ error: "Cannot modify already Accepted application. Rejection of accepted applications is not permitted." });
    }
    if (application.status === 'Rejected') {
      return res.status(400).json({ error: "Cannot modify already Rejected application. Acceptance of rejected applications is not permitted." });
    }
    if (application.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot process application with status '${application.status}'. Only Pending applications can be decided.` });
    }

    if (finalAction === 'accept') {
      if (gig.status !== 'Open') {
        return res.status(400).json({ error: `Cannot accept applicant. Gig is currently '${gig.status}' (Must be 'Open')` });
      }
      if (gig.accepted_applicant_id) {
        return res.status(400).json({ error: "Cannot accept applicant: Gig already has an accepted applicant" });
      }

      const result = storage.acceptApplication(req.params.id);
      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }
      return res.json(result);
    } else if (finalAction === 'reject') {
      const result = storage.rejectApplication(req.params.id);
      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }
      return res.json({ success: true, application: result.application });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update application", details: err.message });
  }
});

// -------------------------------------------------------------
// Mutual Reviews
// -------------------------------------------------------------
app.get('/api/reviews', (req, res) => {
  try {
    const { gig_id, reviewer_id, reviewee_id } = req.query;
    const reviews = storage.getReviews({ gig_id, reviewer_id, reviewee_id });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve reviews", details: err.message });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const actingUser = getVerifiedActingUser(req, res);
    if (!actingUser) return;

    // Prevent attempts to impersonate another reviewer in request body
    if (req.body.reviewer_id && req.body.reviewer_id !== actingUser.id) {
      return res.status(403).json({ error: "Forbidden: Cannot submit review on behalf of another user" });
    }

    const reviewerId = actingUser.id;
    const { gig_id, reviewee_id, rating, comment } = req.body;

    if (!gig_id) {
      return res.status(400).json({ error: "Gig ID is required" });
    }

    const gig = storage.getGigById(gig_id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    // 1. Only after completion can reviews be submitted
    if (gig.status !== 'Completed') {
      return res.status(400).json({ error: `Reviews can only be submitted for Completed gigs (Current status: '${gig.status}')` });
    }

    // 2. Only eligible participants may review
    const isOwner = gig.user_id === reviewerId;
    const isAcceptedApplicant = gig.accepted_applicant_id === reviewerId;

    if (!isOwner && !isAcceptedApplicant) {
      return res.status(403).json({ error: "Forbidden: Only the gig owner or accepted applicant can review this gig" });
    }

    // Expected reviewee: owner reviews applicant, applicant reviews owner
    const targetRevieweeId = isOwner ? gig.accepted_applicant_id : gig.user_id;
    if (reviewee_id && reviewee_id !== targetRevieweeId) {
      return res.status(400).json({ error: `Invalid reviewee. Must be user '${targetRevieweeId}'` });
    }

    // 3. Integer rating 1-5 validation
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
    }

    // 4. Comments required
    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return res.status(400).json({ error: "Comment is required and must be at least 3 characters long" });
    }

    // 5. Each reviewer may review a particular gig only once
    const existing = storage.getReviews({ gig_id, reviewer_id: reviewerId });
    if (existing.length > 0) {
      return res.status(400).json({ error: "You have already submitted a review for this gig" });
    }

    const review = storage.createReview({
      gig_id,
      reviewer_id: reviewerId,
      reviewee_id: targetRevieweeId,
      rating: numRating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to create review", details: err.message });
  }
});

// -------------------------------------------------------------
// Seed Reset
// -------------------------------------------------------------
app.post('/api/seed/reset', (req, res) => {
  try {
    const data = storage.resetToSeed();
    res.json({
      message: "Database reset to initial seed data successfully",
      users_count: data.users.length,
      gigs_count: data.gigs.length,
      applications_count: data.applications.length,
      reviews_count: data.reviews.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset seed data", details: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Campus Gig & SkillSwap Portal API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
