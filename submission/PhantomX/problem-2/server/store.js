import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let state = { users: [], gigs: [], applications: [], reviews: [], messages: [] };
let loadedMtime = -1;

export function dataFile() {
  return process.env.DATA_PATH || path.join(__dirname, '..', 'data', 'db.json');
}

function readFromDisk() {
  const file = dataFile();
  state = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(state.messages)) state.messages = [];
  loadedMtime = fs.statSync(file).mtimeMs;
}

export function load() {
  readFromDisk();
}

// Pick up a new file when `npm run seed` rewrites it.
export function ensureFresh() {
  const file = dataFile();
  if (!fs.existsSync(file)) return;
  const mtime = fs.statSync(file).mtimeMs;
  if (mtime !== loadedMtime) readFromDisk();
}

export function save() {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
  loadedMtime = fs.statSync(file).mtimeMs;
}

export function getDb() {
  return state;
}

export function nextId(list, prefix) {
  let max = 0;
  for (const item of list) {
    const match = String(item.id).match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(2, '0')}`;
}
