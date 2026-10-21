import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  SEED_USERS,
  SEED_GIGS,
  SEED_APPLICATIONS,
  SEED_REVIEWS,
  SEED_NOTIFICATIONS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_BOOKMARKS
} from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, 'campusloop.db');

export const db = new Database(dbPath);

// Enable WAL mode for concurrency and foreign key constraints
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      initials TEXT,
      major TEXT,
      semester TEXT,
      bio TEXT,
      skills TEXT,
      gigs_posted INTEGER DEFAULT 0,
      gigs_completed INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      email TEXT,
      joinedDate TEXT
    );

    CREATE TABLE IF NOT EXISTS gigs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      poster_name TEXT NOT NULL,
      poster_avatar TEXT,
      poster_rating REAL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Offering', 'Requesting')),
      category TEXT NOT NULL CHECK(category IN ('Programming', 'Design', 'Writing', 'Tutoring')),
      payment_type TEXT NOT NULL CHECK(payment_type IN ('Paid', 'Skill Swap', 'Free')),
      budget REAL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Completed', 'Expired')),
      accepted_applicant_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      applicants_count INTEGER DEFAULT 0,
      skills_required TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      applicant_name TEXT NOT NULL,
      applicant_avatar TEXT,
      applicant_major TEXT,
      applicant_semester TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Accepted', 'Rejected')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewer_name TEXT NOT NULL,
      reviewer_avatar TEXT,
      reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gig_id TEXT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, gig_id)
    );
  `);
}

// Format user row for API responses
export function formatUser(row) {
  if (!row) return null;
  return {
    ...row,
    skills: typeof row.skills === 'string' ? JSON.parse(row.skills || '[]') : (row.skills || [])
  };
}

// Format gig row for API responses
export function formatGig(row) {
  if (!row) return null;
  return {
    ...row,
    skills_required: typeof row.skills_required === 'string' ? JSON.parse(row.skills_required || '[]') : (row.skills_required || [])
  };
}

// Format notification row for API responses
export function formatNotification(row) {
  if (!row) return null;
  return {
    ...row,
    read: Boolean(row.read)
  };
}

// Seed the database
export function seedDatabase(force = false) {
  initSchema();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount > 0 && !force) {
    console.log(`Database already populated with ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('Seeding SQLite database with CampusLoop dataset...');

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, avatar, initials, major, semester, bio, skills, gigs_posted, gigs_completed, rating, reviews_count, email, joinedDate)
    VALUES (@id, @name, @avatar, @initials, @major, @semester, @bio, @skills, @gigs_posted, @gigs_completed, @rating, @reviews_count, @email, @joinedDate)
  `);

  const insertGig = db.prepare(`
    INSERT OR REPLACE INTO gigs (id, user_id, poster_name, poster_avatar, poster_rating, title, description, type, category, payment_type, budget, deadline, status, accepted_applicant_id, created_at, applicants_count, skills_required, image)
    VALUES (@id, @user_id, @poster_name, @poster_avatar, @poster_rating, @title, @description, @type, @category, @payment_type, @budget, @deadline, @status, @accepted_applicant_id, @created_at, @applicants_count, @skills_required, @image)
  `);

  const insertApplication = db.prepare(`
    INSERT OR REPLACE INTO applications (id, gig_id, applicant_id, applicant_name, applicant_avatar, applicant_major, applicant_semester, message, status, created_at)
    VALUES (@id, @gig_id, @applicant_id, @applicant_name, @applicant_avatar, @applicant_major, @applicant_semester, @message, @status, @created_at)
  `);

  const insertReview = db.prepare(`
    INSERT OR REPLACE INTO reviews (id, gig_id, reviewer_id, reviewer_name, reviewer_avatar, reviewee_id, reviewee_name, rating, comment, created_at)
    VALUES (@id, @gig_id, @reviewer_id, @reviewer_name, @reviewer_avatar, @reviewee_id, @reviewee_name, @rating, @comment, @created_at)
  `);

  const insertNotification = db.prepare(`
    INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, read, created_at)
    VALUES (@id, @user_id, @title, @message, @type, @read, @created_at)
  `);

  const insertConversation = db.prepare(`
    INSERT OR REPLACE INTO conversations (id, user1_id, user2_id, updated_at)
    VALUES (@id, @user1_id, @user2_id, @updated_at)
  `);

  const insertMessage = db.prepare(`
    INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, text, created_at)
    VALUES (@id, @conversation_id, @sender_id, @text, @created_at)
  `);

  const insertBookmark = db.prepare(`
    INSERT OR REPLACE INTO bookmarks (user_id, gig_id)
    VALUES (@user_id, @gig_id)
  `);

  const seedTransaction = db.transaction(() => {
    if (force) {
      db.exec(`
        DELETE FROM messages;
        DELETE FROM conversations;
        DELETE FROM bookmarks;
        DELETE FROM notifications;
        DELETE FROM reviews;
        DELETE FROM applications;
        DELETE FROM gigs;
        DELETE FROM users;
      `);
    }

    for (const u of SEED_USERS) insertUser.run(u);
    for (const g of SEED_GIGS) insertGig.run(g);
    for (const a of SEED_APPLICATIONS) insertApplication.run(a);
    for (const r of SEED_REVIEWS) insertReview.run(r);
    for (const n of SEED_NOTIFICATIONS) insertNotification.run(n);
    for (const c of SEED_CONVERSATIONS) insertConversation.run(c);
    for (const m of SEED_MESSAGES) insertMessage.run(m);
    for (const b of SEED_BOOKMARKS) insertBookmark.run(b);
  });

  seedTransaction();
  console.log('Database seeded successfully:');
  console.log(`- ${SEED_USERS.length} users`);
  console.log(`- ${SEED_GIGS.length} gigs`);
  console.log(`- ${SEED_APPLICATIONS.length} applications`);
  console.log(`- ${SEED_REVIEWS.length} reviews`);
  console.log(`- ${SEED_NOTIFICATIONS.length} notifications`);
}

// Automatically init schema when imported
initSchema();

// Run directly from CLI: `node server/db.js --seed`
if (process.argv.includes('--seed')) {
  seedDatabase(true);
}
