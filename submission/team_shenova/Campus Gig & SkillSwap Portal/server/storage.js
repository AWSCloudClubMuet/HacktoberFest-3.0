// server/storage.js
// JSON-file persistence layer for Campus Gig & SkillSwap Portal

const fs = require('fs');
const path = require('path');
const { getSeedData } = require('./seedData');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Storage {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.resetToSeed();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        JSON.parse(raw);
      } catch (err) {
        console.error("Corrupted DB file detected, reinitializing with seed data:", err);
        this.resetToSeed();
      }
    }
    // Perform overdue gig check on startup
    this.checkOverdueGigs();
  }

  resetToSeed() {
    const seed = getSeedData();
    this.saveData(seed);
    return seed;
  }

  readData() {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error reading database file:", err);
      return this.resetToSeed();
    }
  }

  saveData(data) {
    const tempFile = `${DB_FILE}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // Check and update any Open gigs past their deadline to Expired
  checkOverdueGigs() {
    const data = this.readData();
    const now = new Date();
    let changed = false;

    data.gigs = data.gigs.map(gig => {
      if (gig.status === 'Open' && gig.deadline) {
        const deadlineDate = new Date(gig.deadline);
        if (deadlineDate < now) {
          gig.status = 'Expired';
          changed = true;
        }
      }
      return gig;
    });

    if (changed) {
      this.saveData(data);
    }
    return data;
  }

  // --- Users ---
  getUsers() {
    const data = this.readData();
    return data.users.map(u => this.enrichUserProfile(u, data));
  }

  getUserById(id) {
    const data = this.readData();
    const user = data.users.find(u => u.id === id);
    if (!user) return null;
    return this.enrichUserProfile(user, data);
  }

  getUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const data = this.readData();
    const user = data.users.find(u => u.email && u.email.trim().toLowerCase() === normalized);
    if (!user) return null;
    return this.enrichUserProfile(user, data);
  }

  createUser(userData) {
    const data = this.readData();
    const newId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const major = (userData.major || userData.department || '').trim();

    const newUser = {
      id: newId,
      name: userData.name.trim(),
      major: major,
      department: major,
      semester: (userData.semester || '').trim(),
      bio: (userData.bio || '').trim(),
      skills: Array.isArray(userData.skills)
        ? userData.skills.map(s => String(s).trim()).filter(Boolean)
        : [],
      created_at: new Date().toISOString()
    };

    if (userData.email && userData.email.trim()) {
      newUser.email = userData.email.trim().toLowerCase();
    }

    data.users.push(newUser);
    this.saveData(data);
    return this.enrichUserProfile(newUser, data);
  }

  updateUser(id, updates) {
    const data = this.readData();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    // Allowed updatable fields: name, major, department, semester, bio, skills
    const allowed = ['name', 'major', 'department', 'semester', 'bio', 'skills'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        data.users[index][key] = updates[key];
      }
    }

    // Sync major and department
    if (updates.department && !updates.major) {
      data.users[index].major = updates.department;
    } else if (updates.major && !updates.department) {
      data.users[index].department = updates.major;
    } else if (!data.users[index].department && data.users[index].major) {
      data.users[index].department = data.users[index].major;
    }

    this.saveData(data);
    return this.enrichUserProfile(data.users[index], data);
  }

  // Enrich user with computed metrics
  enrichUserProfile(user, data) {
    const gigsPosted = data.gigs.filter(g => g.user_id === user.id).length;
    
    // Gigs completed where user was either poster or accepted applicant
    const gigsCompleted = data.gigs.filter(g => 
      g.status === 'Completed' && (g.user_id === user.id || g.accepted_applicant_id === user.id)
    ).length;

    // Reviews received
    const reviewsReceived = data.reviews.filter(r => r.reviewee_id === user.id);
    const reviewCount = reviewsReceived.length;
    const averageRating = reviewCount > 0
      ? Number((reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : 0;

    return {
      ...user,
      department: user.department || user.major,
      gigs_posted: gigsPosted,
      gigs_completed: gigsCompleted,
      average_rating: averageRating,
      review_count: reviewCount
    };
  }

  // --- Gigs ---
  getGigs(filters = {}) {
    this.checkOverdueGigs();
    const data = this.readData();
    let gigs = [...data.gigs];

    const searchParam = filters.search || filters.q;
    if (searchParam) {
      const q = searchParam.toLowerCase().trim();
      gigs = gigs.filter(g => 
        (g.title && g.title.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (Array.isArray(g.skills_required) && g.skills_required.some(s => s.toLowerCase().includes(q))) ||
        (Array.isArray(g.skills_offered) && g.skills_offered.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (filters.category && filters.category !== 'all') {
      gigs = gigs.filter(g => g.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.type && filters.type !== 'all') {
      gigs = gigs.filter(g => g.type.toLowerCase() === filters.type.toLowerCase());
    }

    if (filters.payment_type && filters.payment_type !== 'all') {
      gigs = gigs.filter(g => g.payment_type.toLowerCase() === filters.payment_type.toLowerCase());
    }

    if (filters.status && filters.status !== 'all') {
      gigs = gigs.filter(g => g.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.user_id) {
      gigs = gigs.filter(g => g.user_id === filters.user_id);
    }

    if (filters.applicant_id) {
      // Find gigs where this user applied or was accepted
      const userAppGigIds = new Set(
        data.applications
          .filter(a => a.applicant_id === filters.applicant_id)
          .map(a => a.gig_id)
      );
      gigs = gigs.filter(g => userAppGigIds.has(g.id) || g.accepted_applicant_id === filters.applicant_id);
    }

    if (filters.min_budget !== undefined && filters.min_budget !== '') {
      const min = Number(filters.min_budget);
      if (!isNaN(min)) {
        gigs = gigs.filter(g => g.budget !== null && g.budget >= min);
      }
    }

    if (filters.max_budget !== undefined && filters.max_budget !== '') {
      const max = Number(filters.max_budget);
      if (!isNaN(max)) {
        gigs = gigs.filter(g => g.budget !== null && g.budget <= max);
      }
    }

    // Sorting
    const sort = filters.sort || 'latest';
    if (sort === 'latest') {
      gigs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      gigs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'deadline') {
      gigs.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sort === 'budget_desc') {
      gigs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (sort === 'budget_asc') {
      gigs.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    }

    // Attach owner info & applications count
    return gigs.map(gig => this.enrichGig(gig, data));
  }

  getGigById(id) {
    this.checkOverdueGigs();
    const data = this.readData();
    const gig = data.gigs.find(g => g.id === id);
    if (!gig) return null;
    return this.enrichGig(gig, data);
  }

  enrichGig(gig, data) {
    const owner = data.users.find(u => u.id === gig.user_id) || null;
    const acceptedApplicant = gig.accepted_applicant_id
      ? data.users.find(u => u.id === gig.accepted_applicant_id) || null
      : null;
    const gigApplications = data.applications.filter(a => a.gig_id === gig.id);
    const gigReviews = data.reviews.filter(r => r.gig_id === gig.id);

    return {
      ...gig,
      owner: owner ? this.enrichUserProfile(owner, data) : null,
      accepted_applicant: acceptedApplicant ? this.enrichUserProfile(acceptedApplicant, data) : null,
      applications_count: gigApplications.length,
      reviews_count: gigReviews.length
    };
  }

  createGig(gigData) {
    const data = this.readData();
    const newId = `gig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newGig = {
      id: newId,
      user_id: gigData.user_id,
      title: gigData.title.trim(),
      description: gigData.description.trim(),
      type: gigData.type,
      category: gigData.category,
      payment_type: gigData.payment_type,
      budget: gigData.payment_type === 'Paid' ? Number(gigData.budget) : null,
      deadline: gigData.deadline,
      status: 'Open',
      accepted_applicant_id: null,
      created_at: new Date().toISOString()
    };

    data.gigs.unshift(newGig);
    this.saveData(data);
    return this.enrichGig(newGig, data);
  }

  updateGig(id, updates) {
    const data = this.readData();
    const index = data.gigs.findIndex(g => g.id === id);
    if (index === -1) return null;

    const existing = data.gigs[index];

    // Allowed field modifications
    const allowed = ['title', 'description', 'type', 'category', 'payment_type', 'budget', 'deadline', 'status', 'accepted_applicant_id'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'budget') {
          existing.budget = updates.payment_type === 'Paid' || existing.payment_type === 'Paid'
            ? Number(updates[key])
            : null;
        } else {
          existing[key] = updates[key];
        }
      }
    }

    data.gigs[index] = existing;
    this.saveData(data);
    return this.enrichGig(existing, data);
  }

  deleteGig(id) {
    const data = this.readData();
    const index = data.gigs.findIndex(g => g.id === id);
    if (index === -1) return false;

    data.gigs.splice(index, 1);
    // Also remove associated applications and reviews to maintain referential integrity
    data.applications = data.applications.filter(a => a.gig_id !== id);
    data.reviews = data.reviews.filter(r => r.gig_id !== id);

    this.saveData(data);
    return true;
  }

  // --- Applications ---
  getApplications(filters = {}) {
    const data = this.readData();
    let apps = [...data.applications];

    if (filters.gig_id) {
      apps = apps.filter(a => a.gig_id === filters.gig_id);
    }
    if (filters.applicant_id) {
      apps = apps.filter(a => a.applicant_id === filters.applicant_id);
    }
    if (filters.status) {
      apps = apps.filter(a => a.status === filters.status);
    }

    return apps.map(app => {
      const applicant = data.users.find(u => u.id === app.applicant_id) || null;
      const gig = data.gigs.find(g => g.id === app.gig_id) || null;
      return {
        ...app,
        applicant: applicant ? this.enrichUserProfile(applicant, data) : null,
        gig: gig ? { id: gig.id, title: gig.title, status: gig.status, user_id: gig.user_id, payment_type: gig.payment_type, budget: gig.budget } : null
      };
    });
  }

  getApplicationById(id) {
    const data = this.readData();
    const app = data.applications.find(a => a.id === id);
    if (!app) return null;
    const applicant = data.users.find(u => u.id === app.applicant_id) || null;
    const gig = data.gigs.find(g => g.id === app.gig_id) || null;
    return {
      ...app,
      applicant: applicant ? this.enrichUserProfile(applicant, data) : null,
      gig: gig ? { id: gig.id, title: gig.title, status: gig.status, user_id: gig.user_id } : null
    };
  }

  createApplication({ gig_id, applicant_id, message }) {
    const data = this.readData();
    const newId = `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newApp = {
      id: newId,
      gig_id,
      applicant_id,
      message: message.trim(),
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    data.applications.push(newApp);
    this.saveData(data);
    return this.getApplicationById(newId);
  }

  updateApplication(id, updates) {
    const data = this.readData();
    const index = data.applications.findIndex(a => a.id === id);
    if (index === -1) return null;

    if (updates.status) {
      data.applications[index].status = updates.status;
    }
    if (updates.message) {
      data.applications[index].message = updates.message.trim();
    }

    this.saveData(data);
    return this.getApplicationById(id);
  }

  // Accept one applicant: Marks app accepted, sets gig.accepted_applicant_id, gig.status = 'In Progress', rejects other pending apps
  acceptApplication(applicationId) {
    const data = this.readData();
    const appIndex = data.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return { error: "Application not found", status: 404 };

    const targetApp = data.applications[appIndex];
    if (targetApp.status === 'Accepted') {
      return { error: "Cannot accept an application that is already Accepted", status: 400 };
    }
    if (targetApp.status === 'Rejected') {
      return { error: "Cannot accept a Rejected application. Only Pending applications can be accepted.", status: 400 };
    }
    if (targetApp.status !== 'Pending') {
      return { error: `Cannot accept application with status '${targetApp.status}'. Must be 'Pending'.`, status: 400 };
    }

    const gigIndex = data.gigs.findIndex(g => g.id === targetApp.gig_id);
    if (gigIndex === -1) return { error: "Gig not found", status: 404 };

    const gig = data.gigs[gigIndex];

    if (gig.accepted_applicant_id) {
      return { error: "Gig already has an accepted applicant", status: 400 };
    }

    // Status transition verification: only Open gigs can transition to In Progress via acceptance
    if (gig.status !== 'Open') {
      return { error: `Cannot accept applicant for a gig with status '${gig.status}'. Must be 'Open'.`, status: 400 };
    }

    // 1. Mark target application as Accepted
    data.applications[appIndex].status = 'Accepted';

    // 2. Set gig's accepted_applicant_id
    gig.accepted_applicant_id = targetApp.applicant_id;

    // 3. Change gig status to In Progress
    gig.status = 'In Progress';

    // 4. Reject all other Pending applications for this gig
    data.applications.forEach((app, idx) => {
      if (app.gig_id === gig.id && app.id !== applicationId && app.status === 'Pending') {
        data.applications[idx].status = 'Rejected';
      }
    });

    this.saveData(data);
    return {
      success: true,
      application: this.getApplicationById(applicationId),
      gig: this.enrichGig(gig, data)
    };
  }

  rejectApplication(applicationId) {
    const data = this.readData();
    const appIndex = data.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return { error: "Application not found", status: 404 };

    const targetApp = data.applications[appIndex];
    if (targetApp.status === 'Accepted') {
      return { error: "Cannot reject an application that has already been Accepted", status: 400 };
    }
    if (targetApp.status === 'Rejected') {
      return { error: "Application is already Rejected", status: 400 };
    }
    if (targetApp.status !== 'Pending') {
      return { error: `Cannot reject application with status '${targetApp.status}'. Only Pending applications can be rejected.`, status: 400 };
    }

    targetApp.status = 'Rejected';
    this.saveData(data);
    return {
      success: true,
      application: this.getApplicationById(applicationId)
    };
  }

  // --- Reviews ---
  getReviews(filters = {}) {
    const data = this.readData();
    let revs = [...data.reviews];

    if (filters.gig_id) {
      revs = revs.filter(r => r.gig_id === filters.gig_id);
    }
    if (filters.reviewer_id) {
      revs = revs.filter(r => r.reviewer_id === filters.reviewer_id);
    }
    if (filters.reviewee_id) {
      revs = revs.filter(r => r.reviewee_id === filters.reviewee_id);
    }

    return revs.map(r => {
      const reviewer = data.users.find(u => u.id === r.reviewer_id) || null;
      const reviewee = data.users.find(u => u.id === r.reviewee_id) || null;
      const gig = data.gigs.find(g => g.id === r.gig_id) || null;
      return {
        ...r,
        reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, major: reviewer.major } : null,
        reviewee: reviewee ? { id: reviewee.id, name: reviewee.name, major: reviewee.major } : null,
        gig_title: gig ? gig.title : 'Gig'
      };
    });
  }

  createReview({ gig_id, reviewer_id, reviewee_id, rating, comment }) {
    const data = this.readData();
    const newId = `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRev = {
      id: newId,
      gig_id,
      reviewer_id,
      reviewee_id,
      rating: Number(rating),
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    data.reviews.push(newRev);
    this.saveData(data);

    const reviewer = data.users.find(u => u.id === reviewer_id) || null;
    const reviewee = data.users.find(u => u.id === reviewee_id) || null;
    const gig = data.gigs.find(g => g.id === gig_id) || null;

    return {
      ...newRev,
      reviewer: reviewer ? { id: reviewer.id, name: reviewer.name } : null,
      reviewee: reviewee ? { id: reviewee.id, name: reviewee.name } : null,
      gig_title: gig ? gig.title : 'Gig'
    };
  }
}

const storage = new Storage();
module.exports = storage;
