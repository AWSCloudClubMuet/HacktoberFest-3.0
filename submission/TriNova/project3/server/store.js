/* Tiny JSON-file store. Node is single-threaded, so each request handler runs to
 * completion before the next starts - multi-step updates (reserve stock + create
 * dispatch, etc.) are therefore atomic with respect to other requests. */
'use strict';
const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');

const COLLECTIONS = ['camps', 'inventory', 'needs', 'dispatches', 'donations', 'volunteers'];
const FILE = process.env.DB_FILE || path.join(__dirname, 'db.json');

const store = {
  COLLECTIONS,
  db: null,

  load() {
    try {
      const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (!COLLECTIONS.every((c) => Array.isArray(data[c]))) throw new Error('incomplete db');
      this.db = data;
    } catch (_) {
      this.reset();
    }
    return this.db;
  },

  save() {
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
    fs.renameSync(tmp, FILE);              // atomic replace: no half-written db.json
  },

  reset() {
    this.db = buildSeed();
    this.save();
    return this.db;
  },

  nextId(col) {
    return this.db[col].reduce((m, r) => Math.max(m, r.id), 0) + 1;
  },

  find(col, id) {
    return this.db[col].find((r) => r.id === id);
  },
};

module.exports = store;