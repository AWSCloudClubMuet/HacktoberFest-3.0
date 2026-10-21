import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './seed.js';

// ---- File persistence: data survives restarts (server/data/db.json) ----
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function load() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (d.users && d.gigs && d.applications && d.reviews) return d;
  } catch { /* no saved data yet -> seed */ }
  return seed();
}

export const db = load();

export function saveDb() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(db, null, 2));
    fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
  } catch (e) { console.error('Could not save data:', e.message); }
}

export const resetDb = () => { Object.assign(db, seed()); saveDb(); };

export const today = () => new Date().toISOString().slice(0, 10);
export const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

// Open gigs past their deadline are reported as Expired (computed, never stored)
export const effectiveStatus = (g) => (g.status === 'Open' && g.deadline < today() ? 'Expired' : g.status);

export const withGig = (g) => {
  const o = db.users.find((u) => u.id === g.user_id);
  return {
    ...g,
    status: effectiveStatus(g),
    owner: { id: o.id, name: o.name, major: o.major },
    application_count: db.applications.filter((a) => a.gig_id === g.id).length,
  };
};

// Profile stats and the average rating are ALWAYS computed from stored reviews
export function userStats(u) {
  const revs = db.reviews.filter((r) => r.reviewee_id === u.id);
  return {
    ...u,
    gigs_posted: db.gigs.filter((g) => g.user_id === u.id).length,
    gigs_completed: db.gigs.filter(
      (g) => g.status === 'Completed' && (g.user_id === u.id || g.accepted_applicant_id === u.id)
    ).length,
    average_rating: revs.length ? +(revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(2) : null,
    review_count: revs.length,
  };
}