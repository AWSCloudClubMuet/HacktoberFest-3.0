// Relief Allocation Advisor: suggestions must stay within stock and the
// remaining unreserved need, skip Closed camps, and rank explainably.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recommendAllocations } from '../shared/advisor.js';
import { findById, remainingUnreserved } from '../shared/domain.js';

const seed = JSON.parse(fs.readFileSync(new URL('../server/seed.json', import.meta.url), 'utf8'));

test('seed suggestions never exceed stock or remaining unreserved need', () => {
  const { recommendations } = recommendAllocations(seed, { limit: 50 });
  assert.ok(recommendations.length > 0);
  const usedByItem = {};
  for (const r of recommendations) {
    assert.ok(r.quantity > 0);
    assert.ok(r.quantity <= remainingUnreserved(r.need, seed.dispatches), `need ${r.need.id} over remaining`);
    usedByItem[r.item.id] = (usedByItem[r.item.id] || 0) + r.quantity;
    assert.ok(r.reasons.length >= 3, 'every suggestion is explained');
  }
  for (const [itemId, used] of Object.entries(usedByItem)) {
    assert.ok(used <= findById(seed.inventory, itemId).stock, `item ${itemId} over-allocated`);
  }
});

test('seed ranking puts the critical gaps first, by urgency', () => {
  const { recommendations } = recommendAllocations(seed);
  // urgency = weight × remaining/required: #10 2.7, #7 2.25, #12 2.1, #2 1.875, #16 1.46
  assert.deepEqual(recommendations.map((r) => r.need.id), [10, 7, 12, 2, 16]);
  const tablets = recommendations.find((r) => r.need.id === 7);
  assert.equal(tablets.quantity, 140, 'limited to the 140 strips in stock');
  assert.equal(tablets.limitedByStock, true);
});

test('Closed camps and fully covered needs are never suggested', () => {
  const { recommendations } = recommendAllocations(seed, { limit: 50 });
  assert.ok(!recommendations.some((r) => r.camp.status === 'Closed'));
  assert.ok(!recommendations.some((r) => r.need.id === 6 || r.need.id === 15), 'fulfilled needs excluded');
});

test('shared stock is allocated in rank order and the rest is reported as blocked', () => {
  const data = {
    camps: [{ id: 1, name: 'A', status: 'Active' }, { id: 2, name: 'B', status: 'Active' }, { id: 3, name: 'C', status: 'Active' }],
    inventory: [{ id: 1, name: 'Tents', unit: 'tent', stock: 30 }],
    needs: [
      { id: 1, camp_id: 1, inventory_item_id: 1, required_quantity: 20, fulfilled_quantity: 0, priority: 'High' },
      { id: 2, camp_id: 2, inventory_item_id: 1, required_quantity: 20, fulfilled_quantity: 0, priority: 'Medium' },
      { id: 3, camp_id: 3, inventory_item_id: 1, required_quantity: 20, fulfilled_quantity: 0, priority: 'Low' },
    ],
    dispatches: [],
  };
  const { recommendations, blocked } = recommendAllocations(data);
  assert.deepEqual(
    recommendations.map((r) => [r.need.id, r.quantity]),
    [
      [1, 20],
      [2, 10],
    ],
  );
  assert.equal(blocked.length, 1);
  assert.equal(blocked[0].need.id, 3);
});

test('empty data yields no suggestions', () => {
  assert.deepEqual(recommendAllocations({}), { recommendations: [], blocked: [] });
});
