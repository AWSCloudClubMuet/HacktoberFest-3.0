import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

const EMPTY_DB = { users: [], gigs: [], applications: [], reviews: [] };

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return { ...EMPTY_DB, ...JSON.parse(raw) };
  } catch {
    // file missing or invalid: start empty (run `npm run seed` to fill it)
    return structuredClone(EMPTY_DB);
  }
}

// In-memory data, shared by every file that imports this module
export const data = load();

// Write current memory to disk. Call after every create/update.
export function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Replace everything (used by the seed script) and save
export function reset(newData) {
  for (const key of Object.keys(EMPTY_DB)) {
    data[key] = newData[key] ?? [];
  }
  save();
}

// Next numeric id for a collection: max existing id + 1
export function nextId(collection) {
  const items = data[collection];
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}