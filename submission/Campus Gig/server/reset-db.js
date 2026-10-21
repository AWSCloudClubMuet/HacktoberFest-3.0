// `npm run reset-db`: replaces the database with fresh demo data (dates relative to now).
// Restart the API afterwards, because a running API keeps its data in memory.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonStore } from './store.js';
import { buildSeedData } from './seed.js';

const DB_FILE = path.resolve(process.env.DB_FILE || fileURLToPath(new URL('./data/db.json', import.meta.url)));
const data = buildSeedData();

if (fs.existsSync(DB_FILE)) {
  // Constructing a store would fail on a corrupted file, which is exactly when a reset is needed.
  fs.rmSync(DB_FILE);
}
new JsonStore(DB_FILE, { seed: () => data });

console.log(`Demo data written to ${DB_FILE}`);
console.log(`${data.users.length} users, ${data.gigs.length} gigs, ${data.applications.length} applications, ${data.reviews.length} reviews`);
console.log('Restart the API (npm run api) if it is running.');
