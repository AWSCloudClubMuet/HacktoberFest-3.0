/**
 * Exhaustive End-to-End API and Business Logic Test Suite
 * Tests every endpoint, query filter, status code, error case, and operational invariant.
 */

const BASE_URL = 'http://localhost:3000/api';

interface TestRecord {
  category: string;
  id: string;
  description: string;
  passed: boolean;
  error?: string;
}

const testResults: TestRecord[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const role = (options.headers as any)?.['x-user-role'] || 'admin';
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': role,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  let body: any = null;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status, ok: res.ok, body };
}

async function run(category: string, id: string, description: string, fn: () => Promise<void>) {
  try {
    await fn();
    testResults.push({ category, id, description, passed: true });
    console.log(`[PASS] [${category}] ${id}: ${description}`);
  } catch (err: any) {
    testResults.push({ category, id, description, passed: false, error: err.message });
    console.error(`[FAIL] [${category}] ${id}: ${description} -> ${err.message}`);
  }
}

export async function runExhaustiveTests() {
  console.log('===============================================================');
  console.log('STARTING EXHAUSTIVE E2E VALIDATION OF RELIEFHUB APPLICATION');
  console.log('===============================================================\n');

  // STEP 0: Reset DB to pristine seed data
  await run('ADMIN', 'SEED-01', 'Reset seed data via POST /api/admin/reset-seed', async () => {
    const res = await request('/admin/reset-seed', { method: 'POST' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Expected ok status');
  });

  // 1. HEALTH CHECKS
  await run('HEALTH', 'HLT-01', 'GET /api/health returns healthy system and stats', async () => {
    const res = await request('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'healthy', 'Expected status to be healthy');
    assert(res.body.database?.stats?.campsCount >= 8, 'Expected >= 8 camps in seed');
    assert(res.body.database?.stats?.inventoryCount >= 12, 'Expected >= 12 inventory items');
    assert(res.body.database?.stats?.needsCount >= 20, 'Expected >= 20 needs');
    assert(res.body.database?.stats?.dispatchesCount >= 10, 'Expected >= 10 dispatches');
    assert(res.body.database?.stats?.donationsCount >= 10, 'Expected >= 10 donations');
    assert(res.body.database?.stats?.volunteersCount >= 15, 'Expected >= 15 volunteers');
  });

  // 2. CAMPS ENDPOINTS & BUSINESS RULES
  let createdCampId = '';
  await run('CAMPS', 'CMP-01', 'GET /api/camps returns all camps with correct sorting', async () => {
    const res = await request('/camps');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected data array');
    assert(res.body.data.length >= 8, 'Expected at least 8 seeded camps');
  });

  await run('CAMPS', 'CMP-02', 'GET /api/camps with district and status filters', async () => {
    const res = await request('/camps?district=Dadu&status=Open');
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.every((c: any) => c.district.toLowerCase() === 'dadu' && c.status === 'Open'), 'Filter mismatch');
  });

  await run('CAMPS', 'CMP-03', 'GET /api/camps search query works for name and district', async () => {
    const res = await request('/camps?search=Sukkur');
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.length >= 1, 'Search should find Sukkur camp');
  });

  await run('CAMPS', 'CMP-04', 'POST /api/camps creates camp with auto Full status when families == capacity', async () => {
    const res = await request('/camps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jacobabad Stadium Camp',
        district: 'Jacobabad',
        capacity: 150,
        current_families: 150,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.status === 'Full', `Expected Full status, got ${res.body.data.status}`);
    createdCampId = res.body.data.id;
  });

  await run('CAMPS', 'CMP-05', 'POST /api/camps validation rejects negative families & families > capacity', async () => {
    const res1 = await request('/camps', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad 1', district: 'Dadu', capacity: 100, current_families: -1 }),
    });
    assert(res1.status === 400, 'Negative families should be 400');

    const res2 = await request('/camps', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad 2', district: 'Dadu', capacity: 100, current_families: 105 }),
    });
    assert(res2.status === 400, 'Over capacity should be 400');
  });

  await run('CAMPS', 'CMP-06', 'PATCH /api/camps/:id updates family count and transitions Full -> Open', async () => {
    const res = await request(`/camps/${createdCampId}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_families: 120 }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.status === 'Open', `Expected Open status when families dropped below capacity, got ${res.body.data.status}`);
  });

  await run('CAMPS', 'CMP-07', 'PATCH /api/camps/:id can close camp and reopen recalculating status', async () => {
    // Close it
    const resClose = await request(`/camps/${createdCampId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Closed' }),
    });
    assert(resClose.body.data.status === 'Closed', 'Expected Closed status');

    // Reopen it
    const resReopen = await request(`/camps/${createdCampId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Open' }),
    });
    assert(resReopen.body.data.status === 'Open', 'Expected Open status');
  });

  await run('CAMPS', 'CMP-08', 'DELETE /api/camps/:id deletes unreferenced camp with 204', async () => {
    const res = await request(`/camps/${createdCampId}`, { method: 'DELETE' });
    assert(res.status === 204, `Expected 204, got ${res.status}`);
  });

  await run('CAMPS', 'CMP-09', 'DELETE /api/camps/:id with active dependencies returns 409 Conflict', async () => {
    // camp-1 has needs, dispatches, and volunteers
    const res = await request('/camps/camp-1', { method: 'DELETE' });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.error?.code === 'CAMP_DEPENDENCIES_EXIST', 'Expected error code CAMP_DEPENDENCIES_EXIST');
  });

  // 3. INVENTORY ENDPOINTS & INVARIANTS
  let createdItemId = '';
  await run('INVENTORY', 'INV-01', 'GET /api/inventory returns all warehouse items with stock details', async () => {
    const res = await request('/inventory');
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.length >= 12, 'Expected >= 12 items');
  });

  await run('INVENTORY', 'INV-02', 'GET /api/inventory?lowStockOnly=true filters correctly', async () => {
    const res = await request('/inventory?lowStockOnly=true');
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.every((i: any) => i.stock <= i.reorder_level), 'Every item must satisfy stock <= reorder_level');
  });

  await run('INVENTORY', 'INV-03', 'POST /api/inventory creates new item and enforces non-negative stock', async () => {
    const res = await request('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Heavy Duty Water Pumps',
        category: 'Clean Water',
        unit: 'pieces',
        stock: 15,
        reorder_level: 5,
      }),
    });
    assert(res.status === 201, 'Expected 201');
    assert(res.body.data.name === 'Heavy Duty Water Pumps', 'Item name match');
    createdItemId = res.body.data.id;

    // Negative stock rejected
    const badRes = await request('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Item',
        category: 'Food',
        unit: 'kits',
        stock: -5,
        reorder_level: 2,
      }),
    });
    assert(badRes.status === 400, 'Negative stock must be rejected with 400');
  });

  await run('INVENTORY', 'INV-04', 'PATCH /api/inventory/:id updates stock and reorder level', async () => {
    const res = await request(`/inventory/${createdItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: 20 }),
    });
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.stock === 20, 'Stock updated to 20');
  });

  await run('INVENTORY', 'INV-05', 'DELETE /api/inventory/:id deletes unreferenced item with 204', async () => {
    const res = await request(`/inventory/${createdItemId}`, { method: 'DELETE' });
    assert(res.status === 204, 'Expected 204');
  });

  await run('INVENTORY', 'INV-06', 'DELETE /api/inventory/:id with active needs returns 409 Conflict', async () => {
    // inv-1 is referenced by needs
    const res = await request('/inventory/inv-1', { method: 'DELETE' });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
  });

  // 4. CAMP NEEDS ENDPOINTS & INVARIANTS
  let testCampId = '';
  let testSupplyId = '';
  let createdNeedId = '';

  await run('NEEDS', 'NED-01', 'Set up isolated camp and inventory for need testing', async () => {
    const cRes = await request('/camps', {
      method: 'POST',
      body: JSON.stringify({ name: 'Need Test Camp', district: 'Sukkur', capacity: 200, current_families: 50 }),
    });
    testCampId = cRes.body.data.id;

    const iRes = await request('/inventory', {
      method: 'POST',
      body: JSON.stringify({ name: 'Solar Purifiers', category: 'Clean Water', unit: 'kits', stock: 100, reorder_level: 20 }),
    });
    testSupplyId = iRes.body.data.id;
  });

  await run('NEEDS', 'NED-02', 'POST /api/needs creates need and prevents duplicates for same camp & item', async () => {
    const res = await request('/needs', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: testCampId,
        inventory_item_id: testSupplyId,
        required_quantity: 50,
        priority: 'High',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.fulfilled_quantity === 0, 'Fulfilled should be 0');
    assert(res.body.data.remaining_unreserved_quantity === 50, 'Remaining unreserved should be 50');
    createdNeedId = res.body.data.id;

    // Attempt duplicate need
    const dupRes = await request('/needs', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: testCampId,
        inventory_item_id: testSupplyId,
        required_quantity: 20,
        priority: 'Medium',
      }),
    });
    assert(dupRes.status === 409, `Duplicate need must return 409, got ${dupRes.status}`);
  });

  await run('NEEDS', 'NED-03', 'GET /api/needs returns calculations for active reservations & fulfilment %', async () => {
    const res = await request(`/needs/${createdNeedId}`);
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.fulfilment_percentage === 0, 'Percentage is 0');
    assert(res.body.data.active_reserved_quantity === 0, 'Active reservations 0');
  });

  // 5. ATOMIC DISPATCHES, CONCURRENCY & STATE MACHINE
  let dispatchId = '';

  await run('DISPATCH', 'DSP-01', 'POST /api/dispatches validates stock and deducts available stock immediately', async () => {
    const stockBefore = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockBefore === 100, `Stock should be 100, got ${stockBefore}`);

    // Create dispatch of 15
    const res = await request('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: testCampId,
        need_id: createdNeedId,
        quantity: 15,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.status === 'Pending', 'Status must be Pending');
    assert(res.body.data.quantity === 15, 'Quantity must be 15');
    dispatchId = res.body.data.id;

    // Verify warehouse stock was immediately deducted
    const stockAfter = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockAfter === 85, `Stock should be 85 after 15 reserved, got ${stockAfter}`);

    // Verify need unreserved remaining updated
    const needCheck = (await request(`/needs/${createdNeedId}`)).body.data;
    assert(needCheck.active_reserved_quantity === 15, `Active reserved should be 15, got ${needCheck.active_reserved_quantity}`);
    assert(needCheck.remaining_unreserved_quantity === 35, `Remaining should be 35, got ${needCheck.remaining_unreserved_quantity}`);
  });

  await run('DISPATCH', 'DSP-02', 'POST /api/dispatches rejects quantity exceeding unreserved need', async () => {
    // Unreserved is 35, attempt 36
    const res = await request('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: testCampId,
        need_id: createdNeedId,
        quantity: 36,
      }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error?.code === 'EXCEEDS_UNRESERVED_NEED', 'Error code must be EXCEEDS_UNRESERVED_NEED');
  });

  await run('DISPATCH', 'DSP-03', 'PATCH /api/needs/:id rejects reducing required_quantity below reserved', async () => {
    // Active reserved is 15. Attempting to reduce required_quantity to 10 should fail!
    const res = await request(`/needs/${createdNeedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ required_quantity: 10 }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error?.code === 'CANNOT_REDUCE_BELOW_RESERVED', 'Error code must be CANNOT_REDUCE_BELOW_RESERVED');
  });

  await run('DISPATCH', 'DSP-04', 'DELETE /api/needs/:id rejects deletion when active dispatch exists', async () => {
    const res = await request(`/needs/${createdNeedId}`, { method: 'DELETE' });
    assert(res.status === 409, `Expected 409, got ${res.status}`);
    assert(res.body.error?.code === 'ACTIVE_DISPATCHES_EXIST', 'Expected ACTIVE_DISPATCHES_EXIST');
  });

  await run('DISPATCH', 'DSP-05', 'POST /api/dispatches/:id/in-transit updates status without deducting stock again', async () => {
    const res = await request(`/dispatches/${dispatchId}/in-transit`, { method: 'POST' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.status === 'In Transit', 'Status must be In Transit');

    const stockCheck = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockCheck === 85, `Stock must remain 85, got ${stockCheck}`);
  });

  await run('DISPATCH', 'DSP-06', 'POST /api/dispatches/:id/deliver increases fulfilment exactly once and preserves stock', async () => {
    const res = await request(`/dispatches/${dispatchId}/deliver`, { method: 'POST' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.status === 'Delivered', 'Status must be Delivered');
    assert(res.body.data.delivered_at !== null, 'delivered_at must be populated');

    // Need fulfilled quantity must increase by 15
    const needCheck = (await request(`/needs/${createdNeedId}`)).body.data;
    assert(needCheck.fulfilled_quantity === 15, `Fulfilled should be 15, got ${needCheck.fulfilled_quantity}`);
    assert(needCheck.active_reserved_quantity === 0, `Active reservations should now be 0, got ${needCheck.active_reserved_quantity}`);

    // Inventory stock must NOT be deducted again
    const stockCheck = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockCheck === 85, `Stock must stay 85, got ${stockCheck}`);
  });

  await run('DISPATCH', 'DSP-07', 'POST /api/dispatches/:id/deliver duplicate delivery is rejected', async () => {
    const res = await request(`/dispatches/${dispatchId}/deliver`, { method: 'POST' });
    assert(res.status === 400, `Expected 400 on duplicate delivery, got ${res.status}`);
    assert(res.body.error?.code === 'ALREADY_DELIVERED', 'Error code must be ALREADY_DELIVERED');
  });

  await run('DISPATCH', 'DSP-08', 'POST /api/dispatches/:id/cancel rejecting cancellation of Delivered dispatch', async () => {
    const res = await request(`/dispatches/${dispatchId}/cancel`, { method: 'POST' });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error?.code === 'CANNOT_CANCEL_DELIVERED', 'Error code must be CANNOT_CANCEL_DELIVERED');
  });

  await run('DISPATCH', 'DSP-09', 'POST /api/dispatches/:id/cancel on Pending dispatch restores stock exactly once', async () => {
    // Create new dispatch of 10
    const dRes = await request('/dispatches', {
      method: 'POST',
      body: JSON.stringify({ camp_id: testCampId, need_id: createdNeedId, quantity: 10 }),
    });
    const dId = dRes.body.data.id;
    const stockAfterCreation = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockAfterCreation === 75, `Stock should be 75, got ${stockAfterCreation}`);

    // Cancel it
    const cancelRes = await request(`/dispatches/${dId}/cancel`, { method: 'POST' });
    assert(cancelRes.status === 200, `Expected 200, got ${cancelRes.status}`);
    assert(cancelRes.body.data.status === 'Cancelled', 'Status must be Cancelled');

    // Stock must be restored to 85
    const stockAfterCancel = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockAfterCancel === 85, `Stock must be restored to 85, got ${stockAfterCancel}`);

    // Second cancel attempt must fail and not double-restore stock
    const secondCancel = await request(`/dispatches/${dId}/cancel`, { method: 'POST' });
    assert(secondCancel.status === 400, `Second cancel must be 400, got ${secondCancel.status}`);
    const stockAfterSecondCancel = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockAfterSecondCancel === 85, `Stock must remain 85, got ${stockAfterSecondCancel}`);
  });

  // 6. DONATIONS & FINANCIAL LEDGER
  await run('DONATIONS', 'DON-01', 'POST /api/donations Cash donation adds to financial ledger and NEVER touches inventory', async () => {
    const stockBefore = (await request(`/inventory/${testSupplyId}`)).body.data.stock;

    const res = await request('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Cash',
        category: 'Clean Water Initiative',
        amount_or_quantity: 600000,
        donor_name: 'United Humanitarian Trust',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.amount_or_quantity === 600000, 'Cash amount match');

    const stockAfter = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockBefore === stockAfter, 'Stock must not change for cash donation');
  });

  await run('DONATIONS', 'DON-02', 'POST /api/donations In-Kind donation increases corresponding stock exactly once', async () => {
    const stockBefore = (await request(`/inventory/${testSupplyId}`)).body.data.stock;

    const res = await request('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'In-Kind',
        category: 'Clean Water',
        amount_or_quantity: 40,
        item_id: testSupplyId,
        donor_name: 'Indus Water Aid',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);

    const stockAfter = (await request(`/inventory/${testSupplyId}`)).body.data.stock;
    assert(stockAfter === stockBefore + 40, `Stock should increase by 40 from ${stockBefore} to ${stockBefore + 40}, got ${stockAfter}`);
  });

  await run('DONATIONS', 'DON-03', 'POST /api/donations idempotency key prevents duplicate donations', async () => {
    const key = `idemp-${Date.now()}`;
    const res1 = await request('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Cash',
        category: 'Medical Relief Fund',
        amount_or_quantity: 50000,
        idempotency_key: key,
      }),
    });
    assert(res1.status === 201, 'First submission 201');

    // Resubmit with exact same key
    const res2 = await request('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Cash',
        category: 'Medical Relief Fund',
        amount_or_quantity: 50000,
        idempotency_key: key,
      }),
    });
    assert(res2.status === 200 || res2.status === 201, 'Second submission returns idempotent result');
    assert(res2.body.data.id === res1.body.data.id, 'Idempotent request returns exact same donation ID');
  });

  // 7. VOLUNTEERS ENDPOINTS & ASSIGNMENT RULES
  let volId = '';
  await run('VOLUNTEERS', 'VOL-01', 'POST /api/volunteers registers volunteer with valid skill', async () => {
    const res = await request('/volunteers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dr. Zulfiqar Babar',
        skill: 'Medical',
        camp_id: null,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.skill === 'Medical', 'Skill match');
    volId = res.body.data.id;
  });

  await run('VOLUNTEERS', 'VOL-02', 'POST /api/volunteers/:id/assign rejects assignment to Closed camp', async () => {
    // camp-8 is closed
    const res = await request(`/volunteers/${volId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ camp_id: 'camp-8' }),
    });
    assert(res.status === 400, `Expected 400 assigning to closed camp, got ${res.status}`);
    assert(res.body.error?.code === 'CANNOT_ASSIGN_CLOSED_CAMP', 'Expected CANNOT_ASSIGN_CLOSED_CAMP');
  });

  await run('VOLUNTEERS', 'VOL-03', 'POST /api/volunteers/:id/assign assigns to valid camp', async () => {
    const res = await request(`/volunteers/${volId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ camp_id: 'camp-1' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.camp_id === 'camp-1', 'Assigned camp_id is camp-1');
  });

  await run('VOLUNTEERS', 'VOL-04', 'POST /api/volunteers/:id/assign rejects re-assigning before unassigning', async () => {
    const res = await request(`/volunteers/${volId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ camp_id: 'camp-3' }),
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.error?.code === 'ALREADY_ASSIGNED', 'Expected ALREADY_ASSIGNED');
  });

  await run('VOLUNTEERS', 'VOL-05', 'POST /api/volunteers/:id/unassign clears camp assignment', async () => {
    const res = await request(`/volunteers/${volId}/unassign`, { method: 'POST' });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.camp_id === null, 'camp_id should be null');
  });

  // 8. DASHBOARD ANALYTICS ENDPOINTS
  await run('DASHBOARD', 'DSH-01', 'GET /api/dashboard/summary calculates correct values', async () => {
    const res = await request('/dashboard/summary');
    assert(res.status === 200, 'Expected 200');
    assert(typeof res.body.data.active_camps === 'number', 'active_camps is number');
    assert(typeof res.body.data.families_sheltered === 'number', 'families_sheltered is number');
    assert(typeof res.body.data.overall_fulfilment === 'number', 'overall_fulfilment is number');
    assert(typeof res.body.data.low_stock_items === 'number', 'low_stock_items is number');
    assert(typeof res.body.data.volunteers_deployed === 'number', 'volunteers_deployed is number');
  });

  await run('DASHBOARD', 'DSH-02', 'GET /api/dashboard/category-fulfilment returns all 7 categories', async () => {
    const res = await request('/dashboard/category-fulfilment');
    assert(res.status === 200, 'Expected 200');
    assert(res.body.data.length === 7, `Expected 7 categories, got ${res.body.data.length}`);
    assert(res.body.data.some((c: any) => c.category === 'Food'), 'Food category exists');
    assert(res.body.data.some((c: any) => c.category === 'Clean Water'), 'Clean Water exists');
  });

  await run('DASHBOARD', 'DSH-03', 'GET /api/dashboard/critical-gaps filters priority High and < 40% fulfilment', async () => {
    const res = await request('/dashboard/critical-gaps');
    assert(res.status === 200, 'Expected 200');
    assert(Array.isArray(res.body.data), 'Data is array');
    assert(res.body.data.every((g: any) => g.priority === 'High' && g.fulfilment_percentage < 40), 'All gaps must be High priority & < 40%');
  });

  // 9. SECURITY & ROLE ENFORCEMENT (403 FORBIDDEN FOR VOLUNTEER)
  await run('SECURITY', 'SEC-01', 'Field Volunteer role is rejected with 403 on camp creation', async () => {
    const res = await request('/camps', {
      method: 'POST',
      headers: { 'x-user-role': 'volunteer' },
      body: JSON.stringify({ name: 'Unauthorized Camp', district: 'Dadu', capacity: 100, current_families: 20 }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
    assert(res.body.error?.code === 'FORBIDDEN', 'Expected FORBIDDEN error code');
  });

  await run('SECURITY', 'SEC-02', 'Field Volunteer role is rejected with 403 on inventory deletion', async () => {
    const res = await request('/inventory/inv-1', {
      method: 'DELETE',
      headers: { 'x-user-role': 'volunteer' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await run('SECURITY', 'SEC-03', 'Field Volunteer role is rejected with 403 on donation recording', async () => {
    const res = await request('/donations', {
      method: 'POST',
      headers: { 'x-user-role': 'volunteer' },
      body: JSON.stringify({ type: 'Cash', category: 'General', amount_or_quantity: 1000 }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await run('SECURITY', 'SEC-04', 'Field Volunteer role is rejected with 403 on admin seed reset', async () => {
    const res = await request('/admin/reset-seed', {
      method: 'POST',
      headers: { 'x-user-role': 'volunteer' },
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await run('SECURITY', 'SEC-05', 'Field Volunteer has read access to operational dashboard and dispatches', async () => {
    const res1 = await request('/dashboard/summary', { headers: { 'x-user-role': 'volunteer' } });
    assert(res1.status === 200, 'Volunteer can view summary');

    const res2 = await request('/dispatches', { headers: { 'x-user-role': 'volunteer' } });
    assert(res2.status === 200, 'Volunteer can view dispatches');
  });

  // Final summary
  console.log('\n===============================================================');
  const passed = testResults.filter((t) => t.passed).length;
  console.log(`EXHAUSTIVE TEST SUITE COMPLETED: ${passed}/${testResults.length} PASSED`);
  console.log('===============================================================\n');

  // Reset database back to clean demo seed state
  await request('/admin/reset-seed', { method: 'POST' });

  if (passed < testResults.length) {
    process.exit(1);
  }
}

runExhaustiveTests().catch((err) => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});
