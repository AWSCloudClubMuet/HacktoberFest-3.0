const fs = require('fs');
const path = require('path');
const { users, gigs, applications, reviews } = require('./seedData');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getInitialData() {
  return {
    users: cloneDeep(users),
    gigs: cloneDeep(gigs),
    applications: cloneDeep(applications),
    reviews: cloneDeep(reviews)
  };
}

let dbCache = null;

function initDB() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    dbCache = initial;
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
    } catch (e) {
      console.warn('Error reading db.json, re-initializing from seed:', e.message);
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      dbCache = initial;
    }
  }
  return dbCache;
}

function saveDB() {
  if (!dbCache) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err.message);
  }
}

function getDB() {
  if (!dbCache) {
    initDB();
  }
  return dbCache;
}

function resetDB() {
  const initial = getInitialData();
  dbCache = initial;
  saveDB();
  return dbCache;
}

// Compute dynamic user stats
function getUserStats(userId) {
  const db = getDB();
  const userReviews = db.reviews.filter(r => r.revieweeId === userId);
  const reviewCount = userReviews.length;
  let averageRating = null;

  if (reviewCount > 0) {
    const sum = userReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    averageRating = Number((sum / reviewCount).toFixed(1));
  }

  const completedGigsCount = db.gigs.filter(
    g => g.status === 'completed' && (g.ownerId === userId || g.acceptedApplicantId === userId)
  ).length;

  return {
    averageRating,
    reviewCount,
    completedGigs: completedGigsCount
  };
}

function enrichUser(user) {
  if (!user) return null;
  const stats = getUserStats(user.id);
  return {
    ...user,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    completedGigs: stats.completedGigs
  };
}

function enrichGig(gig) {
  if (!gig) return null;
  const db = getDB();
  const owner = db.users.find(u => u.id === gig.ownerId);
  const enrichedOwner = owner ? enrichUser(owner) : null;

  const appCount = db.applications.filter(a => a.gigId === gig.id).length;

  let acceptedApplicant = null;
  if (gig.acceptedApplicantId) {
    const applicantUser = db.users.find(u => u.id === gig.acceptedApplicantId);
    if (applicantUser) {
      acceptedApplicant = enrichUser(applicantUser);
    }
  }

  return {
    ...gig,
    owner: enrichedOwner,
    applicantCount: appCount,
    acceptedApplicant
  };
}

module.exports = {
  initDB,
  getDB,
  saveDB,
  resetDB,
  getUserStats,
  enrichUser,
  enrichGig
};
