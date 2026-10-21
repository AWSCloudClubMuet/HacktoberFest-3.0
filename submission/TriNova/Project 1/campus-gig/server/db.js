import fs from 'fs';

const FILE = new URL('./db.json', import.meta.url);

export function loadDb() {
  if (!fs.existsSync(FILE)) {
    return { users: [], gigs: [], applications: [], reviews: [] };
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

export function saveDb(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}