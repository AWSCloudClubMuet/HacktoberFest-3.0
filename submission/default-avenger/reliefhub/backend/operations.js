const { createHash, randomBytes } = require('node:crypto');

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function positiveInteger(value, label, minimum = 1) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new ApiError(400, `${label} must be a whole number of at least ${minimum}.`);
  }
  return number;
}

function requiredText(value, label, maxLength = 160) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new ApiError(400, `${label} is required and must not exceed ${maxLength} characters.`);
  }
  return value.trim();
}

function requestHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function dispatchReference() {
  const year = new Date().getUTCFullYear();
  return `RH-${year}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function startIdempotentOperation(client, actorId, key, operation, body) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new ApiError(400, 'A valid Idempotency-Key header (8–128 safe characters) is required.');
  }
  const hash = requestHash(body);
  const inserted = await client.query(
    `INSERT INTO idempotent_operations(actor_id, idempotency_key, operation, request_hash, response)
     VALUES ($1, $2, $3, $4, '{}'::jsonb)
     ON CONFLICT (actor_id, idempotency_key) DO NOTHING
     RETURNING actor_id`,
    [actorId, key, operation, hash],
  );
  if (inserted.rowCount) return null;

  const previous = await client.query(
    `SELECT operation, request_hash, response
     FROM idempotent_operations
     WHERE actor_id = $1 AND idempotency_key = $2
     FOR UPDATE`,
    [actorId, key],
  );
  const record = previous.rows[0];
  if (!record || record.operation !== operation || record.request_hash !== hash) {
    throw new ApiError(409, 'This idempotency key was already used for a different request.');
  }
  return record.response;
}

async function finishIdempotentOperation(client, actorId, key, response) {
  await client.query(
    `UPDATE idempotent_operations
     SET response = $3::jsonb
     WHERE actor_id = $1 AND idempotency_key = $2`,
    [actorId, key, JSON.stringify(response)],
  );
}

async function recordAudit(client, actorId, action, entityType, entityId, details) {
  await client.query(
    `INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [actorId, action, entityType, String(entityId), JSON.stringify(details)],
  );
}

async function createDispatch(pool, actor, idempotencyKey, input) {
  const needId = positiveInteger(input.needId, 'Need ID');
  const quantity = positiveInteger(input.quantity, 'Quantity');
  const sourceWarehouse = requiredText(input.sourceWarehouse, 'Source warehouse');
  const driver = requiredText(input.driver, 'Driver');
  const vehicle = input.vehicle == null || input.vehicle === '' ? null : requiredText(input.vehicle, 'Vehicle');
  const estimatedArrival = input.estimatedArrival || null;
  if (estimatedArrival && Number.isNaN(Date.parse(estimatedArrival))) {
    throw new ApiError(400, 'Estimated arrival must be a valid date and time.');
  }
  const body = { needId, quantity, sourceWarehouse, driver, vehicle, estimatedArrival };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const replay = await startIdempotentOperation(client, actor.id, idempotencyKey, 'dispatch.create', body);
    if (replay) {
      await client.query('COMMIT');
      return replay;
    }

    const needResult = await client.query('SELECT * FROM camp_needs WHERE id = $1 FOR UPDATE', [needId]);
    const need = needResult.rows[0];
    if (!need) throw new ApiError(404, 'Camp need not found.');

    const campResult = await client.query('SELECT * FROM camps WHERE id = $1', [need.camp_id]);
    const camp = campResult.rows[0];
    if (!camp || camp.status === 'Closed') throw new ApiError(409, 'Cannot dispatch to a closed or missing camp.');

    const itemResult = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [need.item_id]);
    const item = itemResult.rows[0];
    const allocatedResult = await client.query(
      `SELECT COALESCE(SUM(quantity), 0)::BIGINT AS allocated
       FROM dispatches WHERE need_id = $1 AND status IN ('pending', 'in_transit')`,
      [need.id],
    );
    const stockResult = await client.query(
      `SELECT COALESCE(SUM(quantity), 0)::BIGINT AS reserved
       FROM dispatches WHERE item_id = $1 AND status IN ('pending', 'in_transit')`,
      [item.id],
    );
    const remainingNeed = Number(need.required) - Number(need.fulfilled) - Number(allocatedResult.rows[0].allocated);
    const availableStock = Number(item.on_hand) - Number(stockResult.rows[0].reserved);
    if (quantity > remainingNeed) {
      throw new ApiError(409, `Over-allocation: only ${Math.max(remainingNeed, 0)} units remain for this need.`);
    }
    if (quantity > availableStock) {
      throw new ApiError(409, `Insufficient available stock: only ${Math.max(availableStock, 0)} units are available.`);
    }

    const reference = dispatchReference();
    const created = await client.query(
      `INSERT INTO dispatches(
         reference, need_id, camp_id, item_id, quantity, status, source_warehouse,
         driver, vehicle, estimated_arrival, created_by
       )
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
       RETURNING *`,
      [reference, need.id, camp.id, item.id, quantity, sourceWarehouse, driver, vehicle, estimatedArrival, actor.id],
    );
    const dispatch = created.rows[0];
    await client.query(
      `INSERT INTO inventory_movements(item_id, movement_type, reserved_delta, reference, reason, actor_id)
       VALUES ($1, 'reservation', $2, $3, 'Dispatch stock reservation', $4)`,
      [item.id, quantity, reference, actor.id],
    );
    await client.query(
      `INSERT INTO dispatch_events(dispatch_id, from_status, to_status, actor_id, note)
       VALUES ($1, NULL, 'pending', $2, 'Dispatch created and stock reserved')`,
      [dispatch.id, actor.id],
    );
    await recordAudit(client, actor.id, 'dispatch.created', 'dispatch', dispatch.id, {
      reference, needId, itemId: item.id, quantity,
    });
    await finishIdempotentOperation(client, actor.id, idempotencyKey, dispatch);
    await client.query('COMMIT');
    return dispatch;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateDispatch(pool, actor, idempotencyKey, dispatchIdValue, input) {
  const dispatchId = positiveInteger(dispatchIdValue, 'Dispatch ID');
  const status = input.status;
  if (!['in_transit', 'delivered', 'cancelled'].includes(status)) {
    throw new ApiError(400, 'Status must be in_transit, delivered, or cancelled.');
  }
  const receivedQuantity = status === 'delivered'
    ? positiveInteger(input.receivedQuantity, 'Received quantity', 0)
    : null;
  const recipientConfirmation = input.recipientConfirmation == null
    ? null
    : requiredText(input.recipientConfirmation, 'Recipient confirmation');
  const evidenceReference = input.evidenceReference == null || input.evidenceReference === ''
    ? null
    : requiredText(input.evidenceReference, 'Evidence reference');
  const discrepancyReason = input.discrepancyReason == null || input.discrepancyReason === ''
    ? null
    : requiredText(input.discrepancyReason, 'Discrepancy reason', 1000);
  const body = { dispatchId, status, receivedQuantity, recipientConfirmation, evidenceReference, discrepancyReason };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const replay = await startIdempotentOperation(client, actor.id, idempotencyKey, 'dispatch.update', body);
    if (replay) {
      await client.query('COMMIT');
      return replay;
    }

    const pointer = await client.query('SELECT need_id, item_id FROM dispatches WHERE id = $1', [dispatchId]);
    if (!pointer.rowCount) throw new ApiError(404, 'Dispatch not found.');
    const needLock = await client.query('SELECT id FROM camp_needs WHERE id = $1 FOR UPDATE', [pointer.rows[0].need_id]);
    if (!needLock.rowCount) throw new ApiError(404, 'Camp need not found.');
    const itemLock = await client.query('SELECT id FROM inventory_items WHERE id = $1 FOR UPDATE', [pointer.rows[0].item_id]);
    if (!itemLock.rowCount) throw new ApiError(404, 'Inventory item not found.');
    const result = await client.query('SELECT * FROM dispatches WHERE id = $1 FOR UPDATE', [dispatchId]);
    const dispatch = result.rows[0];
    if (actor.role === 'field_volunteer' && status !== 'delivered') {
      throw new ApiError(403, 'Field volunteers may only record delivery receipts.');
    }
    if (actor.role === 'field_volunteer') {
      const assigned = await client.query(
        'SELECT 1 FROM volunteers WHERE user_id = $1 AND camp_id = $2',
        [actor.id, dispatch.camp_id],
      );
      if (!assigned.rowCount) throw new ApiError(403, 'You are not assigned to this destination camp.');
    }

    const allowed = {
      pending: ['in_transit', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    if (!allowed[dispatch.status]?.includes(status)) {
      throw new ApiError(409, `A ${dispatch.status} dispatch cannot become ${status}.`);
    }

    if (status === 'in_transit') {
      const changed = await client.query(
        `UPDATE dispatches SET status = 'in_transit', departure_at = now(), updated_at = now()
         WHERE id = $1 RETURNING *`,
        [dispatch.id],
      );
      await client.query(
        `INSERT INTO dispatch_events(dispatch_id, from_status, to_status, actor_id)
         VALUES ($1, $2, 'in_transit', $3)`,
        [dispatch.id, dispatch.status, actor.id],
      );
      await recordAudit(client, actor.id, 'dispatch.in_transit', 'dispatch', dispatch.id, { reference: dispatch.reference });
      await finishIdempotentOperation(client, actor.id, idempotencyKey, changed.rows[0]);
      await client.query('COMMIT');
      return changed.rows[0];
    }

    const itemResult = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [dispatch.item_id]);
    const item = itemResult.rows[0];
    if (status === 'delivered') {
      const needResult = await client.query('SELECT * FROM camp_needs WHERE id = $1 FOR UPDATE', [dispatch.need_id]);
      const need = needResult.rows[0];
      if (receivedQuantity > Number(dispatch.quantity)) {
        throw new ApiError(409, 'Received quantity cannot exceed the reserved dispatch quantity.');
      }
      if (receivedQuantity > 0 && !recipientConfirmation) {
        throw new ApiError(400, 'Recipient confirmation is required for a delivery receipt.');
      }
      if (receivedQuantity < Number(dispatch.quantity) &&
          !['system_administrator', 'relief_coordinator'].includes(actor.role)) {
        throw new ApiError(403, 'A coordinator or administrator must authorize a discrepant delivery receipt.');
      }
      if (receivedQuantity < Number(dispatch.quantity) && !discrepancyReason) {
        throw new ApiError(400, 'A discrepancy reason is required when the received quantity is below the dispatched quantity.');
      }
      if (Number(item.on_hand) < receivedQuantity) {
        throw new ApiError(409, 'Physical stock is lower than the quantity being received.');
      }
      if (Number(need.fulfilled) + receivedQuantity > Number(need.required)) {
        throw new ApiError(409, 'This receipt would exceed the remaining camp need.');
      }
      await client.query(
        'UPDATE inventory_items SET on_hand = on_hand - $1, updated_at = now() WHERE id = $2',
        [receivedQuantity, item.id],
      );
      await client.query(
        `UPDATE camp_needs SET fulfilled = fulfilled + $1 WHERE id = $2`,
        [receivedQuantity, need.id],
      );
      await client.query(
        `INSERT INTO inventory_movements(item_id, movement_type, on_hand_delta, reserved_delta, reference, reason, actor_id)
         VALUES ($1, 'dispatch_delivery', $2, $3, $4, $5, $6)`,
        [-receivedQuantity, -Number(dispatch.quantity), dispatch.reference, discrepancyReason || 'Delivery confirmed', actor.id],
      );
    } else {
      await client.query(
        `INSERT INTO inventory_movements(item_id, movement_type, reserved_delta, reference, reason, actor_id)
         VALUES ($1, 'reservation_release', $2, $3, 'Cancelled dispatch reservation released', $4)`,
        [item.id, -Number(dispatch.quantity), dispatch.reference, actor.id],
      );
    }

    const updated = await client.query(
      `UPDATE dispatches SET status = $1, received_quantity = COALESCE($2, received_quantity),
         recipient_confirmation = COALESCE($3, recipient_confirmation),
         evidence_reference = COALESCE($4, evidence_reference),
         discrepancy_reason = COALESCE($5, discrepancy_reason),
         delivered_at = CASE WHEN $1 = 'delivered' THEN now() ELSE delivered_at END,
         updated_at = now()
       WHERE id = $6 RETURNING *`,
      [status, receivedQuantity, recipientConfirmation, evidenceReference, discrepancyReason, dispatch.id],
    );
    await client.query(
      `INSERT INTO dispatch_events(dispatch_id, from_status, to_status, actor_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [dispatch.id, dispatch.status, status, actor.id, discrepancyReason],
    );
    await recordAudit(client, actor.id, `dispatch.${status}`, 'dispatch', dispatch.id, {
      reference: dispatch.reference, receivedQuantity, discrepancyReason,
    });
    await finishIdempotentOperation(client, actor.id, idempotencyKey, updated.rows[0]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { ApiError, positiveInteger, requiredText, createDispatch, updateDispatch };
