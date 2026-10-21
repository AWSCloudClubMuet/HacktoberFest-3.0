import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateFulfilmentPercentage, 
  calculateRemainingDemand, 
  calculateDashboardKPIs,
  getCriticalGaps
} from '../src/utils/calculations.js';
import { 
  validateCamp, 
  validateDispatch, 
  validateVolunteer 
} from '../src/utils/validation.js';

test('calculateFulfilmentPercentage - handles zero and normal values', () => {
  assert.equal(calculateFulfilmentPercentage(0, 0), 0);
  assert.equal(calculateFulfilmentPercentage(50, 100), 50);
  assert.equal(calculateFulfilmentPercentage(100, 500), 20);
  assert.equal(calculateFulfilmentPercentage(600, 500), 100); // capped at 100
});

test('calculateRemainingDemand - deducts fulfilled and active pending/in-transit dispatches', () => {
  const need = {
    id: 'n1',
    required_quantity: 500,
    fulfilled_quantity: 100
  };
  const dispatches = [
    { need_id: 'n1', quantity: 50, status: 'Pending' },
    { need_id: 'n1', quantity: 100, status: 'In Transit' },
    { need_id: 'n1', quantity: 100, status: 'Delivered' }, // already in fulfilled_quantity
    { need_id: 'n1', quantity: 80, status: 'Cancelled' }  // cancelled does not reserve
  ];
  // remaining = 500 - 100 (fulfilled) - (50 + 100) (active reservations) = 250
  const remaining = calculateRemainingDemand(need, dispatches);
  assert.equal(remaining, 250);
});

test('calculateDashboardKPIs - accurately aggregates live collections', () => {
  const camps = [
    { id: 'c1', current_families: 200, status: 'Active' },
    { id: 'c2', current_families: 300, status: 'Full' },
    { id: 'c3', current_families: 0, status: 'Closed' },
    { id: 'c4', current_families: 150, status: 'Active' }
  ];
  const inventory = [
    { id: 'i1', stock: 50, reorder_level: 100 }, // low stock
    { id: 'i2', stock: 200, reorder_level: 100 }
  ];
  const needs = [
    { required_quantity: 1000, fulfilled_quantity: 600 }
  ];
  const volunteers = [
    { id: 'v1', camp_id: 'c1' },
    { id: 'v2', camp_id: null },
    { id: 'v3', camp_id: 'c2' }
  ];

  const kpis = calculateDashboardKPIs(camps, inventory, needs, volunteers);
  assert.equal(kpis.activeCampsCount, 2); // only 'Active' (neither Full nor Closed)
  assert.equal(kpis.totalFamiliesSheltered, 650);
  assert.equal(kpis.overallFulfilment, 60);
  assert.equal(kpis.lowStockCount, 1);
  assert.equal(kpis.deployedVolunteersCount, 2);
});

test('validateCamp - enforces capacity and family boundaries', () => {
  const invalidCamp1 = { name: 'Test', district: 'Sukkur', capacity: 100, current_families: 150 };
  const res1 = validateCamp(invalidCamp1);
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.current_families);

  const invalidCamp2 = { name: 'Test', district: 'Sukkur', capacity: -10, current_families: 0 };
  const res2 = validateCamp(invalidCamp2);
  assert.equal(res2.isValid, false);

  const validCamp = { name: 'Test', district: 'Sukkur', capacity: 200, current_families: 150 };
  const res3 = validateCamp(validCamp);
  assert.equal(res3.isValid, true);
});

test('validateDispatch - prevents over-dispatching stock and unmet demand', () => {
  const inv = { stock: 100, unit: 'cartons' };
  const remainingDemand = 80;

  // Qty exceeds available warehouse stock
  const res1 = validateDispatch({ camp_id: 'c1', need_id: 'n1', quantity: 150 }, inv, remainingDemand);
  assert.equal(res1.isValid, false);

  // Qty exceeds remaining unreserved demand
  const res2 = validateDispatch({ camp_id: 'c1', need_id: 'n1', quantity: 90 }, inv, remainingDemand);
  assert.equal(res2.isValid, false);

  // Valid quantity within stock and demand
  const res3 = validateDispatch({ camp_id: 'c1', need_id: 'n1', quantity: 70 }, inv, remainingDemand);
  assert.equal(res3.isValid, true);
});

test('validateVolunteer - prevents assignment to Closed camp', () => {
  const camps = [
    { id: 'c1', name: 'Open Camp', status: 'Active' },
    { id: 'c2', name: 'Closed Camp', status: 'Closed' }
  ];

  const res1 = validateVolunteer({ name: 'Ali', skill: 'Medical', camp_id: 'c2' }, camps);
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.camp_id);

  const res2 = validateVolunteer({ name: 'Ali', skill: 'Medical', camp_id: 'c1' }, camps);
  assert.equal(res2.isValid, true);
});

test('getCriticalGaps - raw unrounded threshold correctly filters strictly < 40%', () => {
  const camps = [{ id: 'c1', name: 'Test Camp', district: 'Sukkur' }];
  const inventory = [{ id: 'i1', name: 'Tent', unit: 'units', stock: 1000 }];
  const dispatches = [];

  const needs = [
    // 39.96% -> strictly < 40% -> MUST be included
    { id: 'n1', camp_id: 'c1', inventory_item_id: 'i1', priority: 'High', required_quantity: 10000, fulfilled_quantity: 3996 },
    // 39.99% -> strictly < 40% -> MUST be included
    { id: 'n2', camp_id: 'c1', inventory_item_id: 'i1', priority: 'High', required_quantity: 10000, fulfilled_quantity: 3999 },
    // 40.00% -> exactly 40% -> MUST be excluded
    { id: 'n3', camp_id: 'c1', inventory_item_id: 'i1', priority: 'High', required_quantity: 10000, fulfilled_quantity: 4000 },
    // 40.01% -> strictly > 40% -> MUST be excluded
    { id: 'n4', camp_id: 'c1', inventory_item_id: 'i1', priority: 'High', required_quantity: 10000, fulfilled_quantity: 4001 },
    // Zero required quantity -> invalid / no demand -> MUST be handled safely and excluded
    { id: 'n5', camp_id: 'c1', inventory_item_id: 'i1', priority: 'High', required_quantity: 0, fulfilled_quantity: 0 },
    // Non-High priority (< 40% but Medium) -> MUST be excluded
    { id: 'n6', camp_id: 'c1', inventory_item_id: 'i1', priority: 'Medium', required_quantity: 100, fulfilled_quantity: 10 }
  ];

  const gaps = getCriticalGaps(needs, camps, inventory, dispatches);
  const gapIds = gaps.map(g => g.id);

  assert.deepEqual(gapIds, ['n1', 'n2']);
  assert.equal(gaps[0].id, 'n1'); // 39.96% sorted before 39.99%
  assert.equal(gaps[1].id, 'n2');
});

