const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { createDispatch, updateDispatch, ApiError } = require('./operations');

const databaseUrl = process.env.RELIEFHUB_TEST_DATABASE_URL;

test('PostgreSQL dispatch reservation is atomic, partial receipts reconcile stock, and retries are idempotent', {
  skip: !databaseUrl && 'Set RELIEFHUB_TEST_DATABASE_URL to a disposable PostgreSQL database.',
}, async () => {
  const adminPool = new Pool({ connectionString: databaseUrl });
  const schema = `rh_test_${randomBytes(8).toString('hex')}`;
  await adminPool.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: databaseUrl, options: `-c search_path=${schema}` });
  try {
    const ddl = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(ddl);
    await pool.query(
      `INSERT INTO users(id, username, name, password_hash, role)
       VALUES (1, 'coordinator', 'Test Coordinator', 'test-hash', 'relief_coordinator')`,
    );
    await pool.query(
      `INSERT INTO camps(id, name, district, capacity, families, status)
       VALUES (1, 'Test Camp', 'Sukkur', 100, 50, 'Active')`,
    );
    await pool.query(
      `INSERT INTO inventory_items(id, name, category, unit, on_hand, reorder_level)
       VALUES (1, 'Water', 'Water', 'carton', 10, 2)`,
    );
    await pool.query(
      `INSERT INTO camp_needs(id, camp_id, item_id, required, fulfilled, priority)
       VALUES (1, 1, 1, 10, 0, 'High'), (2, 1, 1, 10, 0, 'High')`,
    );

    const actor = { id: 1, role: 'relief_coordinator' };
    const makeKey = () => randomBytes(12).toString('hex');
    const input = { needId: 1, quantity: 7, sourceWarehouse: 'Sukkur', driver: 'Test Driver' };
    const attempts = await Promise.allSettled([
      createDispatch(pool, actor, makeKey(), input),
      createDispatch(pool, actor, makeKey(), { ...input, needId: 2 }),
    ]);
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = attempts.find(result => result.status === 'rejected');
    assert.ok(rejected.reason instanceof ApiError);
    assert.equal(rejected.reason.status, 409);

    const created = attempts.find(result => result.status === 'fulfilled').value;
    const transit = await updateDispatch(pool, actor, makeKey(), created.id, { status: 'in_transit' });
    assert.equal(transit.status, 'in_transit');

    const deliveryKey = makeKey();
    const receipt = {
      status: 'delivered',
      receivedQuantity: 6,
      recipientConfirmation: 'Camp lead confirmed',
      discrepancyReason: 'One carton damaged in transit',
    };
    const delivered = await updateDispatch(pool, actor, deliveryKey, created.id, receipt);
    const retry = await updateDispatch(pool, actor, deliveryKey, created.id, receipt);
    assert.equal(delivered.status, 'delivered');
    assert.equal(Number(delivered.received_quantity), 6);
    assert.equal(retry.id, delivered.id);

    await assert.rejects(
      updateDispatch(pool, actor, makeKey(), created.id, receipt),
      error => error instanceof ApiError && error.status === 409,
    );
    const stock = await pool.query('SELECT on_hand, reserved, available FROM inventory_stock_position WHERE item_id = 1');
    assert.deepEqual(
      { onHand: Number(stock.rows[0].on_hand), reserved: Number(stock.rows[0].reserved), available: Number(stock.rows[0].available) },
      { onHand: 4, reserved: 0, available: 4 },
    );
    const need = await pool.query('SELECT fulfilled FROM camp_needs WHERE id = 1');
    assert.equal(Number(need.rows[0].fulfilled), 6);
    const movementCount = await pool.query(
      `SELECT count(*)::integer AS total FROM inventory_movements
       WHERE reference = $1 AND movement_type = 'dispatch_delivery'`,
      [created.reference],
    );
    assert.equal(movementCount.rows[0].total, 1);
  } finally {
    await pool.end();
    await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);
    await adminPool.end();
  }
});
