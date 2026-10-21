// Starts the CampusConnect API.  PORT (default 4000) and DB_FILE (default server/data/db.json)
// can be set as environment variables. The database is created from the seed on first start.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { JsonStore } from './store.js';
import { buildSeedData } from './seed.js';

const PORT = Number(process.env.PORT) || 4000;
const DB_FILE = path.resolve(process.env.DB_FILE || fileURLToPath(new URL('./data/db.json', import.meta.url)));

let store;
try {
  store = new JsonStore(DB_FILE, { seed: () => buildSeedData() });
} catch (err) {
  console.error(`\nCampusConnect API could not start:\n  ${err.message}\n`);
  process.exit(1);
}

const server = createApp({ store, log: true }).listen(PORT, () => {
  const { users, gigs, applications, reviews } = store.read();
  console.log(`CampusConnect API running at http://localhost:${PORT}`);
  console.log(`Data file: ${DB_FILE}`);
  console.log(`Loaded ${users.length} users, ${gigs.length} gigs, ${applications.length} applications, ${reviews.length} reviews`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Stop the other process or start with a different PORT.\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
