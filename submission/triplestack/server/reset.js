// Restores server/db.json from server/seed.json. Stop the API first: a running
// server keeps its data in memory and would overwrite this file on its next
// write. (While the API is running, use the "Reset demo data" button instead.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
fs.copyFileSync(path.join(dir, 'seed.json'), path.join(dir, 'db.json'));
console.log('server/db.json has been reset to the seed data.');
