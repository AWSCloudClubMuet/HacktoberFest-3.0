// End-to-end API tests: boots the real server on a throwaway copy of the seed
// data and exercises the business rules over HTTP. Run with `npm test`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reliefhub-'));
const dbFile = path.join(tmpDir, 'db.json');
let server;

async function call(method, url, body, role = 'admin') {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Role': role },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const get = async (url) => (await call('GET', url)).body;

before(async () => {
  server = spawn(process.execPath, [path.join(root, 'server', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), DB_FILE: dbFile, QUIET: '1' },
    stdio: 'pipe',
  });
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('API did not start');
});

after(() => {
  server?.kill();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('all six collections are served with the seeded quantities', async () => {
  const expected = { camps: 8, inventory: 12, needs: 20, dispatches: 10, donations: 10, volunteers: 15 };
  for (const [collection, count] of Object.entries(expected)) {
    const rows = await get(`/${collection}`);
    assert.equal(rows.length, count, collection);
  }
});

test('camp create validates input and auto-marks Full at capacity', async () => {
  const bad = await call('POST', '/camps', { name: '', district: 'Dadu', capacity: -5, current_families: 2 });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.name && bad.body.fields.capacity);

  const over = await call('POST', '/camps', { name: 'Test Camp', district: 'Badin', capacity: 10, current_families: 11 });
  assert.equal(over.status, 400);

  const created = await call('POST', '/camps', { name: 'Test Camp', district: 'Badin', capacity: 10, current_families: 9 });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'Active');

  const full = await call('PATCH', `/camps/${created.body.id}`, { current_families: 10 });
  assert.equal(full.body.status, 'Full');
  const reopened = await call('PATCH', `/camps/${created.body.id}`, { current_families: 8 });
  assert.equal(reopened.body.status, 'Active');

  const persisted = await get(`/camps/${created.body.id}`);
  assert.equal(persisted.current_families, 8);

  const removed = await call('DELETE', `/camps/${created.body.id}`);
  assert.equal(removed.status, 200);
  assert.equal((await call('GET', `/camps/${created.body.id}`)).status, 404);
});

test('inventory rejects negative stock', async () => {
  const res = await call('PATCH', '/inventory/1', { stock: -1 });
  assert.equal(res.status, 400);
});

test('dispatch rejects quantities above stock or the unreserved remainder', async () => {
  // Need 2: required 400, fulfilled 100, 50 Pending → 250 unreserved; ORS stock 1200.
  const tooMuchForNeed = await call('POST', '/dispatches', { camp_id: 1, need_id: 2, quantity: 251 });
  assert.equal(tooMuchForNeed.status, 400);
  assert.match(tooMuchForNeed.body.error, /remaining unreserved/);

  // Need 10: antimalarial kits, stock 45, remaining 45.
  const tooMuchStock = await call('POST', '/dispatches', { camp_id: 4, need_id: 10, quantity: 46 });
  assert.equal(tooMuchStock.status, 400);

  const wrongCamp = await call('POST', '/dispatches', { camp_id: 2, need_id: 2, quantity: 1 });
  assert.equal(wrongCamp.status, 400);

  const closedCamp = await call('POST', '/dispatches', { camp_id: 6, need_id: 15, quantity: 1 });
  assert.equal(closedCamp.status, 400);
});

test('dispatch lifecycle reserves, fulfils and restores exactly once', async () => {
  const stockBefore = (await get('/inventory/7')).stock;
  const created = await call('POST', '/dispatches', { camp_id: 1, need_id: 2, quantity: 100 });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'Pending');
  assert.equal((await get('/inventory/7')).stock, stockBefore - 100, 'stock reserved on creation');

  assert.equal((await call('PATCH', `/dispatches/${created.body.id}`, { status: 'In Transit' })).status, 200);
  const fulfilledBefore = (await get('/needs/2')).fulfilled_quantity;
  const [first, second] = await Promise.all([
    call('PATCH', `/dispatches/${created.body.id}`, { status: 'Delivered' }),
    call('PATCH', `/dispatches/${created.body.id}`, { status: 'Delivered' }),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409], 'only one delivery succeeds');
  assert.equal((await get('/needs/2')).fulfilled_quantity, fulfilledBefore + 100, 'fulfilled once');
  assert.equal((await get('/inventory/7')).stock, stockBefore - 100, 'delivery does not touch stock again');

  const cancelDelivered = await call('PATCH', `/dispatches/${created.body.id}`, { status: 'Cancelled' });
  assert.equal(cancelDelivered.status, 409);

  // Cancel path restores stock exactly once.
  const another = await call('POST', '/dispatches', { camp_id: 1, need_id: 2, quantity: 40 });
  assert.equal((await get('/inventory/7')).stock, stockBefore - 140);
  const cancels = await Promise.all([
    call('PATCH', `/dispatches/${another.body.id}`, { status: 'Cancelled' }),
    call('PATCH', `/dispatches/${another.body.id}`, { status: 'Cancelled' }),
  ]);
  assert.deepEqual(cancels.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await get('/inventory/7')).stock, stockBefore - 100, 'stock restored once');

  const reopen = await call('PATCH', `/dispatches/${another.body.id}`, { status: 'Pending' });
  assert.equal(reopen.status, 409);
  const editQty = await call('PATCH', `/dispatches/${another.body.id}`, { quantity: 1, status: 'Cancelled' });
  assert.equal(editQty.status, 400);
});

test('open dispatches block deleting their need or camp', async () => {
  // Need 19 / camp 8 have a seeded Pending dispatch.
  assert.equal((await call('DELETE', '/needs/19')).status, 409);
  assert.equal((await call('DELETE', '/camps/8')).status, 409);
  assert.equal((await call('DELETE', '/dispatches/7')).status, 409);
});

test('need required quantity cannot drop below fulfilled + reserved', async () => {
  // Need 19: fulfilled 500 + 200 pending.
  const res = await call('PATCH', '/needs/19', { required_quantity: 650 });
  assert.equal(res.status, 400);
  const dup = await call('POST', '/needs', { camp_id: 8, inventory_item_id: 5, required_quantity: 10, priority: 'Low' });
  assert.equal(dup.status, 400, 'duplicate camp/item need rejected');
});

test('in-kind donations increase stock; cash does not', async () => {
  const before = (await get('/inventory/6')).stock;
  const inKind = await call('POST', '/donations', { type: 'In-Kind', amount_or_quantity: 500, item_id: 6, category: 'Food' });
  assert.equal(inKind.status, 201);
  assert.equal(inKind.body.category, 'Water', 'category comes from the item');
  assert.equal((await get('/inventory/6')).stock, before + 500);

  const cash = await call('POST', '/donations', { type: 'Cash', amount_or_quantity: 1000, category: 'General' });
  assert.equal(cash.status, 201);
  assert.equal((await get('/inventory/6')).stock, before + 500);

  const negative = await call('POST', '/donations', { type: 'In-Kind', amount_or_quantity: -3, item_id: 6 });
  assert.equal(negative.status, 400);

  assert.equal((await call('DELETE', `/donations/${inKind.body.id}`)).status, 200);
  assert.equal((await get('/inventory/6')).stock, before, 'deleting an in-kind donation reverses its stock');
});

test('volunteer assignment rules', async () => {
  const closed = await call('PATCH', '/volunteers/11', { camp_id: 6 });
  assert.equal(closed.status, 400);
  assert.match(closed.body.error, /Closed/);

  const ok = await call('PATCH', '/volunteers/11', { camp_id: 3 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.camp_id, 3);
  const moved = await call('PATCH', '/volunteers/11', { camp_id: 4 });
  assert.equal(moved.body.camp_id, 4, 'a volunteer holds a single assignment');
  const unassigned = await call('PATCH', '/volunteers/11', { camp_id: null });
  assert.equal(unassigned.body.camp_id, null);

  // Closing a camp releases its volunteers.
  const camp = (await call('POST', '/camps', { name: 'Closing Camp', district: 'Badin', capacity: 5, current_families: 1 })).body;
  await call('PATCH', '/volunteers/12', { camp_id: camp.id });
  const closedCamp = await call('PATCH', `/camps/${camp.id}`, { status: 'Closed' });
  assert.equal(closedCamp.body.unassigned_volunteers, 1);
  assert.equal((await get('/volunteers/12')).camp_id, null);
});

test('field volunteer role is limited to headcounts and dispatch progress', async () => {
  assert.equal((await call('POST', '/camps', { name: 'X Camp', district: 'Dadu', capacity: 5, current_families: 0 }, 'volunteer')).status, 403);
  assert.equal((await call('PATCH', '/camps/1', { capacity: 999 }, 'volunteer')).status, 403);
  assert.equal((await call('PATCH', '/camps/1', { current_families: 97 }, 'volunteer')).status, 200);
  assert.equal((await call('PATCH', '/dispatches/10', { status: 'Cancelled' }, 'volunteer')).status, 403);
  assert.equal((await call('PATCH', '/dispatches/10', { status: 'In Transit' }, 'volunteer')).status, 200);
});
