import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JsonStore } from '../server/store.js';
import { tempDbFile } from './helpers.js';

const seed = () => ({ users: [{ id: 'u1', name: 'Test' }], gigs: [], applications: [], reviews: [] });
const onDisk = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('JSON file store', () => {
  let temp;
  afterEach(() => temp?.cleanup());

  test('creates the file from the seed when it does not exist', () => {
    temp = tempDbFile();
    const store = new JsonStore(temp.file, { seed });
    assert.equal(store.read().users.length, 1);
    assert.deepEqual(onDisk(temp.file), seed());
  });

  test('saves every transaction to disk and reloads it after a restart', () => {
    temp = tempDbFile();
    const store = new JsonStore(temp.file, { seed });
    store.transaction((db) => db.gigs.push({ id: 'g1', title: 'Saved gig' }));
    assert.equal(onDisk(temp.file).gigs[0].title, 'Saved gig');
    const restarted = new JsonStore(temp.file, { seed });
    assert.equal(restarted.read().gigs[0].title, 'Saved gig');
  });

  test('a transaction that throws changes nothing, in memory or on disk', () => {
    temp = tempDbFile();
    const store = new JsonStore(temp.file, { seed });
    assert.throws(() => store.transaction((db) => {
      db.gigs.push({ id: 'g1' });
      throw new Error('validation failed halfway');
    }), /halfway/);
    assert.equal(store.read().gigs.length, 0);
    assert.equal(onDisk(temp.file).gigs.length, 0);
  });

  test('leaves no temporary files behind', () => {
    temp = tempDbFile();
    const store = new JsonStore(temp.file, { seed });
    store.transaction((db) => db.reviews.push({ id: 'r1' }));
    const dir = temp.file.replace(/db\.json$/, '');
    assert.deepEqual(fs.readdirSync(dir), ['db.json']);
  });

  test('refuses to start on a corrupted file instead of silently wiping it', () => {
    temp = tempDbFile();
    fs.writeFileSync(temp.file, '{ "users": [ oops');
    assert.throws(() => new JsonStore(temp.file, { seed }), /reset-db/);
    assert.equal(fs.readFileSync(temp.file, 'utf8'), '{ "users": [ oops');
  });

  test('refuses a file that is missing collections', () => {
    temp = tempDbFile();
    fs.writeFileSync(temp.file, JSON.stringify({ users: [] }));
    assert.throws(() => new JsonStore(temp.file, { seed }), /missing: gigs, applications, reviews/);
  });
});
