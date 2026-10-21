const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { hashPassword } = require('./security');
const { migrate } = require('./migrate');

const roleMap = { admin: 'system_administrator', volunteer: 'field_volunteer' };

async function importDemo() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  await migrate();
  const sourcePath = path.join(__dirname, '..', 'db.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const populated = await client.query(
      `SELECT
         (SELECT count(*) FROM camps) +
         (SELECT count(*) FROM inventory_items) +
         (SELECT count(*) FROM users) AS total`,
    );
    if (Number(populated.rows[0].total) !== 0) {
      throw new Error('Refusing to import demo data into a non-empty database.');
    }

    for (const user of source.users) {
      const role = roleMap[user.role];
      if (!role) throw new Error(`Unsupported legacy role for ${user.username}.`);
      await client.query(
        `INSERT INTO users(id, username, name, password_hash, role)
         VALUES ($1, lower($2), $3, $4, $5)`,
        [user.id, user.username, user.name, await hashPassword(user.password, { minimumLength: 8 }), role],
      );
    }
    const administratorId = source.users.find(user => user.role === 'admin')?.id;
    for (const camp of source.camps) {
      await client.query(
        `INSERT INTO camps(id, name, district, capacity, families, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [camp.id, camp.name, camp.district, camp.capacity, camp.families, camp.status],
      );
    }

    const dispatchedByItem = new Map();
    const deliveredByItem = new Map();
    const activeByItem = new Map();
    const donatedByItem = new Map();
    for (const dispatch of source.dispatches) {
      if (dispatch.status === 'Cancelled') continue;
      dispatchedByItem.set(dispatch.itemId, (dispatchedByItem.get(dispatch.itemId) || 0) + dispatch.qty);
      if (dispatch.status === 'Delivered') {
        deliveredByItem.set(dispatch.itemId, (deliveredByItem.get(dispatch.itemId) || 0) + dispatch.qty);
      } else {
        activeByItem.set(dispatch.itemId, (activeByItem.get(dispatch.itemId) || 0) + dispatch.qty);
      }
    }
    for (const donation of source.donations.filter(entry => entry.type === 'In-Kind')) {
      donatedByItem.set(donation.itemId, (donatedByItem.get(donation.itemId) || 0) + donation.qty);
    }

    for (const item of source.inventory) {
      const opening = item.stock + (dispatchedByItem.get(item.id) || 0) - (donatedByItem.get(item.id) || 0);
      if (opening < 0) throw new Error(`Legacy movements produce negative opening stock for ${item.name}.`);
      await client.query(
        `INSERT INTO inventory_items(id, name, category, unit, on_hand, reorder_level)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, item.name, item.category, item.unit, opening, item.reorder],
      );
      await client.query(
        `INSERT INTO inventory_movements(item_id, movement_type, on_hand_delta, reference, reason, actor_id)
         VALUES ($1, 'opening_balance', $2, $3, $4, $5)`,
        [item.id, opening, `legacy-opening-${item.id}`, 'Reconstructed from JSON Server snapshot; exact prior stock transactions unavailable.', administratorId],
      );
    }

    for (const need of source.needs) {
      await client.query(
        `INSERT INTO camp_needs(id, camp_id, item_id, required, fulfilled, priority)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [need.id, need.campId, need.itemId, need.required, need.fulfilled, need.priority],
      );
    }

    for (const donation of source.donations) {
      await client.query(
        `INSERT INTO donations(id, type, donor, amount, item_id, quantity, category, donation_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [donation.id, donation.type, donation.donor, donation.amount, donation.itemId, donation.qty, donation.category, donation.date],
      );
      if (donation.type === 'In-Kind') {
        await client.query(
          `INSERT INTO inventory_movements(item_id, movement_type, on_hand_delta, reference, reason, actor_id)
           VALUES ($1, 'donation_receipt', $2, $3, $4, $5)`,
          [donation.itemId, donation.qty, `legacy-donation-${donation.id}`, 'Imported in-kind donation; original verification evidence is not available.', administratorId],
        );
      }
    }

    for (const dispatch of source.dispatches) {
      const status = dispatch.status === 'In Transit' ? 'in_transit' : dispatch.status.toLowerCase();
      const inserted = await client.query(
        `INSERT INTO dispatches(id, reference, need_id, camp_id, item_id, quantity, received_quantity,
           status, source_warehouse, driver, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [dispatch.id, `LEGACY-${dispatch.id}`, dispatch.needId, dispatch.campId, dispatch.itemId,
          dispatch.qty, status === 'delivered' ? dispatch.qty : 0, status, 'Unrecorded (legacy import)',
          dispatch.driver, administratorId],
      );
      if (status === 'delivered') {
        await client.query(
          `INSERT INTO inventory_movements(item_id, movement_type, on_hand_delta, reference, reason, actor_id)
           VALUES ($1, 'dispatch_delivery', $2, $3, $4, $5)`,
          [dispatch.itemId, -dispatch.qty, `LEGACY-${dispatch.id}`, 'Imported delivered dispatch; recipient evidence is not available.', administratorId],
        );
      } else if (status === 'pending' || status === 'in_transit') {
        await client.query(
          `INSERT INTO inventory_movements(item_id, movement_type, reserved_delta, reference, reason, actor_id)
           VALUES ($1, 'reservation', $2, $3, $4, $5)`,
          [dispatch.itemId, dispatch.qty, `LEGACY-${dispatch.id}`, 'Imported open dispatch reservation.', administratorId],
        );
      }
      await client.query(
        `INSERT INTO dispatch_events(dispatch_id, from_status, to_status, actor_id, note)
         VALUES ($1, NULL, $2, $3, $4)`,
        [inserted.rows[0].id, status, administratorId, 'Imported from JSON Server; exact transition history is unavailable.'],
      );
    }

    const volunteerUser = source.users.find(user => user.role === 'volunteer');
    for (const volunteer of source.volunteers) {
      await client.query(
        `INSERT INTO volunteers(id, name, skill, phone, camp_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [volunteer.id, volunteer.name, volunteer.skill, volunteer.phone, volunteer.campId,
          volunteer.name === volunteerUser?.name ? volunteerUser.id : null],
      );
    }

    for (const table of ['users', 'camps', 'inventory_items', 'camp_needs', 'donations', 'volunteers', 'dispatches']) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT max(id) FROM ${table}), 1),
          EXISTS(SELECT 1 FROM ${table}))`,
        [table],
      );
    }
    await client.query('COMMIT');
    console.log('Demo snapshot imported. Passwords were hashed; change demo credentials before deployment.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importDemo().catch(error => {
    console.error(`Demo import failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { importDemo };
