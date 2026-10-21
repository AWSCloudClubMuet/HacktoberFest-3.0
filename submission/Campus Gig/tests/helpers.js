// Test helpers: every API test gets its own temporary database file and a controllable
// clock, so tests never touch server/data/db.json and never depend on today's date.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { JsonStore } from '../server/store.js';
import { buildSeedData } from '../server/seed.js';
import { DAY_MS } from '../shared/constants.js';

export const NOW = Date.parse('2026-10-21T10:00:00.000Z');
export { DAY_MS };

export function tempDbFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusconnect-test-'));
  return { file: path.join(dir, 'db.json'), cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

export async function startServer({ dbFile } = {}) {
  const temp = dbFile ? null : tempDbFile();
  const file = dbFile ?? temp.file;
  const clock = { now: NOW };
  const store = new JsonStore(file, { seed: () => buildSeedData(NOW) });
  const app = createApp({ store, now: () => clock.now });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  /** request('POST', '/gigs', { as: 'u1', body: {...} }) -> { status, body } */
  async function request(method, url, { as, body, rawBody } = {}) {
    const headers = {};
    if (as) headers['X-User-Id'] = as;
    if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + url, {
      method,
      headers,
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  async function close() {
    await new Promise((resolve) => server.close(resolve));
    temp?.cleanup();
  }

  return { request, close, clock, store, file };
}

/** A valid gig body; override any field. Deadline defaults to 10 days after the test clock. */
export function gigInput(overrides = {}) {
  return {
    title: 'Need help with a React portfolio',
    description: 'Looking for someone to review my React portfolio and suggest improvements.',
    type: 'Requesting',
    category: 'Programming',
    payment_type: 'Paid',
    budget: 3000,
    deadline: new Date(NOW + 10 * DAY_MS).toISOString(),
    ...overrides,
  };
}
