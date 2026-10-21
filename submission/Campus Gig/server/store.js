// A tiny JSON-file database. All data lives in memory and every change is saved to disk,
// so it survives page refreshes and API restarts.
import fs from 'node:fs';
import path from 'node:path';

const COLLECTIONS = ['users', 'gigs', 'applications', 'reviews'];

export class JsonStore {
  /**
   * @param {string} file  path of the JSON file
   * @param {{ seed?: () => object }} options  `seed` builds the starting data when the file doesn't exist yet
   */
  constructor(file, { seed } = {}) {
    this.file = file;
    this.data = this.#load(seed);
  }

  #load(seed) {
    if (!fs.existsSync(this.file)) {
      if (!seed) throw new Error(`Database file not found: ${this.file}`);
      const data = seed();
      this.#save(data);
      return data;
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (err) {
      throw new Error(`Could not read ${this.file}: ${err.message}. Run "npm run reset-db" to restore the demo data.`);
    }
    const missing = COLLECTIONS.filter((name) => !Array.isArray(data?.[name]));
    if (missing.length > 0) {
      throw new Error(`${this.file} is missing: ${missing.join(', ')}. Run "npm run reset-db" to restore the demo data.`);
    }
    return data;
  }

  /** Current data. Treat it as read-only; change data only through transaction(). */
  read() {
    return this.data;
  }

  /**
   * Runs `mutate` on a copy of the data, saves the copy, then makes it live.
   * If `mutate` throws (e.g. a validation error), nothing is saved: changes are all-or-nothing.
   *
   * This is synchronous on purpose. Node runs one piece of JavaScript at a time, so no other
   * request can run between a transaction's checks and its writes. That is what stops two
   * simultaneous "accept" clicks from leaving a gig with two accepted applicants.
   */
  transaction(mutate) {
    const draft = structuredClone(this.data);
    const result = mutate(draft);
    this.#save(draft);
    this.data = draft;
    return result;
  }

  #save(data) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const json = `${JSON.stringify(data, null, 2)}\n`;
    // Write to a temp file and rename it over the real one, so a crash mid-write
    // can never leave a half-written database behind.
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, json);
    try {
      fs.renameSync(tmp, this.file);
    } catch (err) {
      // Windows refuses the rename if another program (an editor, antivirus) has the file open.
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
      fs.writeFileSync(this.file, json);
      fs.rmSync(tmp, { force: true });
    }
  }
}
