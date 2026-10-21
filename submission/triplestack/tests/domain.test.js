// Checks that the seed data meets the challenge minimums and is internally
// consistent, and that dashboard metrics match hand-computed values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as D from '../shared/domain.js';

const seed = JSON.parse(fs.readFileSync(new URL('../server/seed.json', import.meta.url), 'utf8'));

test('seed meets the challenge minimums', () => {
  assert.ok(seed.camps.length >= 8);
  assert.ok(new Set(seed.camps.map((c) => c.district)).size >= 4);
  assert.ok(seed.camps.some((c) => c.status === 'Full'));
  assert.ok(seed.camps.some((c) => c.status === 'Closed'));
  assert.ok(seed.inventory.length >= 12);
  assert.ok(seed.inventory.filter(D.isLowStock).length >= 2);
  assert.ok(seed.needs.length >= 20);
  assert.ok(seed.needs.filter(D.isCriticalGap).length >= 3);
  assert.ok(seed.dispatches.length >= 10);
  assert.ok(seed.donations.length >= 10);
  assert.ok(seed.volunteers.length >= 15);
});

test('seed records are valid and relationships are consistent', () => {
  for (const camp of seed.camps) {
    const check = D.validateCamp(camp, { camps: seed.camps, id: camp.id });
    assert.ok(check.ok, `camp ${camp.id}: ${JSON.stringify(check.errors)}`);
    assert.equal(check.value.status, camp.status, `camp ${camp.id} status matches its numbers`);
  }
  for (const item of seed.inventory) assert.ok(D.validateInventory(item, { inventory: seed.inventory, id: item.id }).ok);
  for (const need of seed.needs) {
    assert.ok(D.findById(seed.camps, need.camp_id), `need ${need.id} camp`);
    assert.ok(D.findById(seed.inventory, need.inventory_item_id), `need ${need.id} item`);
    const committed = need.fulfilled_quantity + D.reservedForNeed(need.id, seed.dispatches);
    assert.ok(committed <= need.required_quantity, `need ${need.id} over-committed`);
    const delivered = seed.dispatches
      .filter((d) => D.sameId(d.need_id, need.id) && d.status === 'Delivered')
      .reduce((s, d) => s + d.quantity, 0);
    assert.ok(delivered <= need.fulfilled_quantity, `need ${need.id} fulfilled covers its deliveries`);
  }
  for (const d of seed.dispatches) {
    const need = D.findById(seed.needs, d.need_id);
    assert.ok(need && D.sameId(need.camp_id, d.camp_id), `dispatch ${d.id} camp matches need`);
    assert.ok(D.DISPATCH_STATUSES.includes(d.status));
  }
  for (const v of seed.volunteers) {
    const check = D.validateVolunteer(v, { camps: seed.camps });
    assert.ok(check.ok, `volunteer ${v.id}: ${JSON.stringify(check.errors)}`);
  }
  for (const d of seed.donations) {
    if (d.type === 'In-Kind') assert.equal(D.findById(seed.inventory, d.item_id).category, d.category);
  }
  for (const item of seed.inventory) assert.ok(item.stock >= 0);
});

test('dashboard metrics from seed data', () => {
  const m = D.computeDashboard(seed);
  assert.equal(m.activeCamps, 7);
  assert.equal(m.familiesSheltered, 96 + 80 + 132 + 41 + 73 + 88 + 52);
  assert.equal(m.lowStockCount, 3);
  assert.equal(m.volunteersDeployed, 10);
  assert.equal(m.criticalGaps.length, 5);
  assert.deepEqual(
    m.criticalGaps.map((g) => g.need.id),
    [10, 7, 2, 16, 12],
    'ordered by lowest fulfilment, then largest unmet quantity',
  );
  const water = m.byCategory.find((r) => r.category === 'Water');
  // Water needs: 900/1200, 90/600, 420/600, 500/900.
  const expected = (75 + 15 + 70 + (500 / 900) * 100) / 4;
  assert.equal(water.pct, Math.round(expected * 10) / 10);
});

test('dashboard handles empty data', () => {
  const m = D.computeDashboard({});
  assert.equal(m.activeCamps, 0);
  assert.equal(m.overallFulfilment, 0);
  assert.deepEqual(m.byCategory, []);
  assert.deepEqual(m.criticalGaps, []);
});

test('remaining unreserved and max dispatchable', () => {
  const need = { id: 1, required_quantity: 100, fulfilled_quantity: 30 };
  const dispatches = [
    { need_id: 1, quantity: 20, status: 'Pending' },
    { need_id: 1, quantity: 10, status: 'In Transit' },
    { need_id: 1, quantity: 15, status: 'Cancelled' },
    { need_id: 1, quantity: 30, status: 'Delivered' },
  ];
  assert.equal(D.remainingUnreserved(need, dispatches), 40);
  assert.equal(D.maxDispatchable(need, { stock: 25 }, dispatches), 25);
  assert.equal(D.deriveCampStatus('Full', 5, 10), 'Active');
  assert.equal(D.deriveCampStatus('Closed', 10, 10), 'Closed');
  assert.equal(D.deriveCampStatus('Active', 10, 10), 'Full');
});
