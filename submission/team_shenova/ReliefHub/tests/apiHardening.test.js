import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const LIVE_DB = path.join(ROOT_DIR, 'db.json');
const TEST_DB = path.join(__dirname, 'temp_regression_db.json');

// Import server & helpers
process.env.DB_FILE = TEST_DB;
const { server, validateDispatchTransition } = await import('../server.js');

let baseUrl;

describe('ReliefHub Backend Hardening & API Regression Suite', () => {
  before(async () => {
    // Copy seed database to isolated test DB
    const seed = fs.readFileSync(LIVE_DB, 'utf-8');
    fs.writeFileSync(TEST_DB, seed, 'utf-8');

    // Start server on an ephemeral port
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Close server and remove temp test DB
    await new Promise((resolve) => server.close(resolve));
    try {
      if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
      const dirFiles = fs.readdirSync(__dirname);
      dirFiles.forEach(f => {
        if (f.startsWith('temp_regression_db.json.tmp')) {
          fs.unlinkSync(path.join(__dirname, f));
        }
      });
    } catch (e) {}
  });

  // Helper fetcher
  async function api(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // ==========================================
  // 1. DISPATCH STATE MACHINE & LIFECYCLE
  // ==========================================
  test('1.1 validateDispatchTransition state matrix', () => {
    // Allowed transitions
    assert.equal(validateDispatchTransition('Pending', 'In Transit').valid, true);
    assert.equal(validateDispatchTransition('Pending', 'Cancelled').valid, true);
    assert.equal(validateDispatchTransition('In Transit', 'Delivered').valid, true);
    assert.equal(validateDispatchTransition('In Transit', 'Cancelled').valid, true);

    // Idempotent same-state check
    assert.equal(validateDispatchTransition('Pending', 'Pending').isNoOp, true);
    assert.equal(validateDispatchTransition('In Transit', 'In Transit').isNoOp, true);

    // Forbidden reopening from terminal states
    assert.equal(validateDispatchTransition('Delivered', 'Pending').valid, false);
    assert.equal(validateDispatchTransition('Delivered', 'In Transit').valid, false);
    assert.equal(validateDispatchTransition('Delivered', 'Cancelled').valid, false);
    assert.equal(validateDispatchTransition('Cancelled', 'Pending').valid, false);
    assert.equal(validateDispatchTransition('Cancelled', 'In Transit').valid, false);
    assert.equal(validateDispatchTransition('Cancelled', 'Delivered').valid, false);

    // Unknown status
    assert.equal(validateDispatchTransition('Pending', 'UnknownStatus').valid, false);
  });

  test('1.2 Force Pending on creation & reject client-supplied status', async () => {
    // Attempt creating dispatch with client-supplied status 'Delivered'
    const res = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-1',
        need_id: 'need-1',
        quantity: 10,
        status: 'Delivered' // Client tries to cheat terminal status
      })
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.status, 'Pending', 'Server must ignore client-supplied Delivered status and force Pending');
  });

  test('1.3 Reject dispatch with mismatched camp and need', async () => {
    // need-1 belongs to camp-1. Requesting for camp-2 must be rejected.
    const res = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-2',
        need_id: 'need-1',
        quantity: 5
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /Need does not belong to specified camp/i);
  });

  test('1.4 Reject invalid quantities on dispatch creation', async () => {
    const invalidValues = [-5, 0, 'abc', null, NaN];
    for (const val of invalidValues) {
      const res = await api('/dispatches', {
        method: 'POST',
        body: JSON.stringify({
          camp_id: 'camp-1',
          need_id: 'need-1',
          quantity: val
        })
      });
      assert.equal(res.status, 400, `Expected 400 for quantity: ${val}`);
    }
  });

  test('1.5 Reject dispatch exceeding available warehouse stock', async () => {
    const res = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-1',
        need_id: 'need-1',
        quantity: 999999
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /Insufficient warehouse stock/i);
  });

  test('1.6 Full dispatch lifecycle: create, en-route, deliver, verify idempotency & stock', async () => {
    // Get initial state of inventory item inv-1 and need-1
    const { data: initialInv } = await api('/inventory/inv-1');
    const { data: initialNeed } = await api('/needs/need-1');

    const dispatchQty = 25;

    // A. Create dispatch
    const createRes = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-1',
        need_id: 'need-1',
        quantity: dispatchQty
      })
    });
    assert.equal(createRes.status, 201);
    const dispId = createRes.data.id;
    assert.equal(createRes.data.status, 'Pending');

    // Verify stock deducted immediately upon creation
    const { data: invAfterCreate } = await api('/inventory/inv-1');
    assert.equal(invAfterCreate.stock, initialInv.stock - dispatchQty);

    // B. Transition: Pending -> In Transit
    const transitRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'In Transit' })
    });
    assert.equal(transitRes.status, 200);
    assert.equal(transitRes.data.status, 'In Transit');

    // C. Transition: In Transit -> Delivered
    const deliverRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Delivered' })
    });
    assert.equal(deliverRes.status, 200);
    assert.equal(deliverRes.data.status, 'Delivered');

    // Verify need fulfilled_quantity increased exactly once
    const { data: needAfterDelivery } = await api('/needs/need-1');
    assert.equal(needAfterDelivery.fulfilled_quantity, initialNeed.fulfilled_quantity + dispatchQty);

    // Verify warehouse stock was NOT deducted again upon delivery
    const { data: invAfterDelivery } = await api('/inventory/inv-1');
    assert.equal(invAfterDelivery.stock, initialInv.stock - dispatchQty);

    // D. Attempt forbidden reopening: Delivered -> Pending (MUST REJECT)
    const reopenRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Pending' })
    });
    assert.equal(reopenRes.status, 400);

    // E. Attempt forbidden reopening: Delivered -> Cancelled (MUST REJECT)
    const reopenCancelRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert.equal(reopenCancelRes.status, 400);
  });

  test('1.7 Dispatch cancellation restores warehouse stock safely', async () => {
    const { data: initialInv } = await api('/inventory/inv-1');
    const cancelQty = 15;

    // Create a new pending dispatch
    const createRes = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-1',
        need_id: 'need-1',
        quantity: cancelQty
      })
    });
    assert.equal(createRes.status, 201);
    const dispId = createRes.data.id;

    // Stock deducted upon creation
    const { data: invAfterCreate } = await api('/inventory/inv-1');
    assert.equal(invAfterCreate.stock, initialInv.stock - cancelQty);

    // Cancel the pending dispatch
    const cancelRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.data.status, 'Cancelled');

    // Stock restored back to initial level
    const { data: invAfterCancel } = await api('/inventory/inv-1');
    assert.equal(invAfterCancel.stock, initialInv.stock);

    // Repeat cancellation request must be an idempotent no-op and NOT restore stock again
    const repeatCancelRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert.equal(repeatCancelRes.status, 200);

    const { data: invAfterRepeat } = await api('/inventory/inv-1');
    assert.equal(invAfterRepeat.stock, initialInv.stock, 'Repeated cancellation must never restore stock twice');
  });

  test('1.8 Reject dispatch quantity mutation after creation', async () => {
    const createRes = await api('/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        camp_id: 'camp-1',
        need_id: 'need-1',
        quantity: 10
      })
    });
    assert.equal(createRes.status, 201);
    const dispId = createRes.data.id;

    // Attempt modifying quantity
    const patchRes = await api(`/dispatches/${dispId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 50 })
    });
    assert.equal(patchRes.status, 400);
    assert.match(patchRes.data.error, /quantity cannot be modified/i);
  });

  // ==========================================
  // 2. REFERENTIAL INTEGRITY SAFEGUARDS
  // ==========================================
  test('2.1 Reject deleting inventory item while linked needs exist', async () => {
    // inv-1 is linked to need-1
    const res = await api('/inventory/inv-1', { method: 'DELETE' });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot delete inventory item while linked camp needs exist/i);
  });

  test('2.2 Reject deleting need while linked dispatches exist', async () => {
    // need-1 is linked to dispatches
    const res = await api('/needs/need-1', { method: 'DELETE' });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot delete need while linked dispatches exist/i);
  });

  test('2.3 Reject deleting camp while linked needs exist', async () => {
    // camp-1 is linked to needs
    const res = await api('/camps/camp-1', { method: 'DELETE' });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot delete camp with active recorded needs/i);
  });

  // ==========================================
  // 3. FULFILMENT DATA PROTECTION
  // ==========================================
  test('3.1 Reject arbitrary overwrite of fulfilled_quantity on need edit', async () => {
    const patchRes = await api('/needs/need-1', {
      method: 'PATCH',
      body: JSON.stringify({ fulfilled_quantity: 999 })
    });
    assert.equal(patchRes.status, 400);
    assert.match(patchRes.data.error, /fulfilled_quantity is read-only/i);
  });

  test('3.2 Reject reducing required_quantity below fulfilled + active reserved demand', async () => {
    const { data: need } = await api('/needs/need-1');
    const lowRequired = (need.fulfilled_quantity || 0) - 10;

    const res = await api('/needs/need-1', {
      method: 'PATCH',
      body: JSON.stringify({ required_quantity: lowRequired })
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot reduce required quantity below fulfilled plus active reserved demand/i);
  });

  // ==========================================
  // 4. CAMP CLOSURE & VOLUNTEER ASSIGNMENT RULES
  // ==========================================
  test('4.1 Reject closing a camp while volunteers are assigned', async () => {
    // camp-1 has active volunteers assigned
    const res = await api('/camps/camp-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Closed' })
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot close camp while volunteers are assigned to it/i);
  });

  test('4.2 Reject assigning volunteer to a Closed camp', async () => {
    // camp-8 is Closed
    const res = await api('/volunteers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tariq Baloch',
        skill: 'Logistics',
        camp_id: 'camp-8'
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Cannot assign a volunteer to a Closed camp/i);
  });

  test('4.3 Automatic Full status calculation when families equal capacity', async () => {
    const createCampRes = await api('/camps', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Auto Status Test Camp',
        district: 'Sukkur',
        capacity: 100,
        current_families: 100
      })
    });
    assert.equal(createCampRes.status, 201);
    assert.equal(createCampRes.data.status, 'Full');

    // Reduce occupancy -> returns to Active
    const updateRes = await api(`/camps/${createCampRes.data.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_families: 80 })
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.status, 'Active');
  });

  // ==========================================
  // 5. IN-KIND DONATION ACCOUNTING
  // ==========================================
  test('5.1 In-kind donation creation increases warehouse stock exactly once', async () => {
    const { data: initialInv } = await api('/inventory/inv-2');
    const donateQty = 50;

    const createRes = await api('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'In-Kind',
        amount_or_quantity: donateQty,
        item_id: 'inv-2',
        category: 'Food Supplies'
      })
    });
    assert.equal(createRes.status, 201);
    const donId = createRes.data.id;

    const { data: invAfterDonation } = await api('/inventory/inv-2');
    assert.equal(invAfterDonation.stock, initialInv.stock + donateQty);

    // 5.2 Editing donation quantity adjusts stock accurately
    const updateRes = await api(`/donations/${donId}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount_or_quantity: 70 }) // +20 more
    });
    assert.equal(updateRes.status, 200);

    const { data: invAfterUpdate } = await api('/inventory/inv-2');
    assert.equal(invAfterUpdate.stock, initialInv.stock + 70);

    // 5.3 Deleting in-kind donation safely restores stock
    const deleteRes = await api(`/donations/${donId}`, { method: 'DELETE' });
    assert.equal(deleteRes.status, 200);

    const { data: invAfterDelete } = await api('/inventory/inv-2');
    assert.equal(invAfterDelete.stock, initialInv.stock);
  });

  test('5.4 Cash donations do not affect warehouse inventory stock', async () => {
    const { data: initialInv } = await api('/inventory/inv-2');

    const cashRes = await api('/donations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Cash',
        amount_or_quantity: 100000,
        category: 'Disaster Fund'
      })
    });
    assert.equal(cashRes.status, 201);

    const { data: invAfterCash } = await api('/inventory/inv-2');
    assert.equal(invAfterCash.stock, initialInv.stock, 'Cash donation must never alter inventory stock');
  });

  // ==========================================
  // 6. MALFORMED JSON & PERSISTENCE SAFETY
  // ==========================================
  test('6.1 Reject malformed JSON request bodies with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/camps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json: not valid'
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Malformed JSON payload/i);
  });
});
