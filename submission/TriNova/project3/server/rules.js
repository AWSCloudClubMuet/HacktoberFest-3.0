/* Business rules enforced by the API. Every write to the mock backend goes through
 * `mutate()`. Handlers validate first, then change data, so a rejected request
 * never leaves half-applied changes (server.js also restores a snapshot on error). */
'use strict';
const L = require('../public/js/logic.js');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || null;
  }
}

const perm = (role, action) => {
  if (!L.can(role, action)) {
    throw new HttpError(403, `${L.ROLES[role] || role} is not allowed to do this (${action})`);
  }
};
const invalid = (v) => { if (!v.ok) throw new HttpError(400, 'Validation failed', v.errors); };
const notFound = (what) => new HttpError(404, `${what} not found`);
const today = () => new Date().toISOString().slice(0, 10);

const activeDispatches = (db, pred) =>
  db.dispatches.filter((d) => L.ACTIVE_DISPATCH.includes(d.status) && pred(d));

// ------------------------------------------------------------------ camps
function camps({ method, id, body, role, db, store }) {
  if (method === 'POST') {
    perm(role, 'camp.create');
    const v = L.validateCamp(body); invalid(v);
    const rec = { id: store.nextId('camps'), ...v.value };
    rec.status = L.deriveCampStatus(rec);                 // auto-Full
    db.camps.push(rec);
    return { status: 201, body: rec };
  }
  const camp = store.find('camps', id);
  if (!camp) throw notFound('Camp');

  if (method === 'PUT' || method === 'PATCH') {
    if (role === 'volunteer') {                           // field volunteers may only update the family count
      perm(role, 'camp.updateFamilies');
      for (const k of Object.keys(body)) {
        if (k !== 'id' && k !== 'current_families' && body[k] !== camp[k]) {
          throw new HttpError(403, 'Field Volunteers can only update the number of current families');
        }
      }
    } else perm(role, 'camp.edit');

    const v = L.validateCamp({ ...camp, ...body, id: camp.id }); invalid(v);
    if (v.value.status === 'Closed' && camp.status !== 'Closed') {
      const busy = activeDispatches(db, (d) => d.camp_id === camp.id).length;
      if (busy) throw new HttpError(409, `Cannot close this camp: ${busy} Pending/In Transit dispatch(es) still active. Deliver or cancel them first.`);
      db.volunteers.forEach((x) => { if (x.camp_id === camp.id) x.camp_id = null; });   // free volunteers
    }
    Object.assign(camp, v.value);
    camp.status = L.deriveCampStatus(camp);               // auto-Full / back to Open
    return { status: 200, body: camp };
  }

  if (method === 'DELETE') {
    perm(role, 'camp.delete');
    const needIds = new Set(db.needs.filter((n) => n.camp_id === camp.id).map((n) => n.id));
    const doomed = db.dispatches.filter((d) => d.camp_id === camp.id || needIds.has(d.need_id));
    for (const d of doomed) {                             // give reserved stock back
      if (L.ACTIVE_DISPATCH.includes(d.status)) {
        const need = store.find('needs', d.need_id);
        const item = need && store.find('inventory', need.inventory_item_id);
        if (item) item.stock += d.quantity;
      }
    }
    const dIds = new Set(doomed.map((d) => d.id));
    db.dispatches = db.dispatches.filter((d) => !dIds.has(d.id));
    db.needs = db.needs.filter((n) => !needIds.has(n.id));
    let freed = 0;
    db.volunteers.forEach((x) => { if (x.camp_id === camp.id) { x.camp_id = null; freed++; } });
    db.camps = db.camps.filter((c) => c.id !== camp.id);
    return { status: 200, body: { deleted: camp.id, needsRemoved: needIds.size, dispatchesRemoved: doomed.length, volunteersUnassigned: freed } };
  }
  throw new HttpError(405, 'Method not allowed');
}

// -------------------------------------------------------------- inventory
function inventory({ method, id, body, role, db, store }) {
  if (method === 'POST') {
    perm(role, 'inventory.create');
    const v = L.validateInventory(body); invalid(v);
    const dup = db.inventory.find((i) => i.name.toLowerCase() === v.value.name.toLowerCase());
    if (dup) throw new HttpError(409, `An item named "${dup.name}" already exists`);
    const rec = { id: store.nextId('inventory'), ...v.value };
    db.inventory.push(rec);
    return { status: 201, body: rec };
  }
  const item = store.find('inventory', id);
  if (!item) throw notFound('Item');
  if (method === 'PUT' || method === 'PATCH') {
    perm(role, 'inventory.edit');
    const v = L.validateInventory({ ...item, ...body }); invalid(v);
    const dup = db.inventory.find((i) => i.id !== item.id && i.name.toLowerCase() === v.value.name.toLowerCase());
    if (dup) throw new HttpError(409, `An item named "${dup.name}" already exists`);
    Object.assign(item, v.value);
    return { status: 200, body: item };
  }
  if (method === 'DELETE') {
    perm(role, 'inventory.delete');
    const used = db.needs.filter((n) => n.inventory_item_id === item.id).length;
    if (used) throw new HttpError(409, `Cannot delete: ${used} camp need(s) use this item. Remove those needs first.`);
    db.inventory = db.inventory.filter((i) => i.id !== item.id);
    return { status: 200, body: { deleted: item.id } };
  }
  throw new HttpError(405, 'Method not allowed');
}

// ------------------------------------------------------------------ needs
function needs({ method, id, body, role, db, store }) {
  if (method === 'POST') {
    perm(role, 'need.create');
    const v = L.validateNeed(body); invalid(v);
    const camp = store.find('camps', v.value.camp_id);
    if (!camp) throw new HttpError(400, 'Validation failed', { camp_id: 'Camp does not exist' });
    if (camp.status === 'Closed') throw new HttpError(400, 'Validation failed', { camp_id: 'This camp is Closed' });
    if (!store.find('inventory', v.value.inventory_item_id)) {
      throw new HttpError(400, 'Validation failed', { inventory_item_id: 'Inventory item does not exist' });
    }
    const dup = db.needs.find((n) => n.camp_id === camp.id && n.inventory_item_id === v.value.inventory_item_id);
    if (dup) throw new HttpError(409, 'This camp already has a need for that item - edit the existing need instead');
    const rec = { id: store.nextId('needs'), ...v.value, fulfilled_quantity: 0 };
    db.needs.push(rec);
    return { status: 201, body: rec };
  }
  const need = store.find('needs', id);
  if (!need) throw notFound('Need');

  if (method === 'PUT' || method === 'PATCH') {
    perm(role, 'need.edit');
    const merged = { ...need, ...body };
    if (merged.camp_id !== need.camp_id || merged.inventory_item_id !== need.inventory_item_id) {
      throw new HttpError(400, 'The camp and item of a need cannot be changed - remove it and add a new one');
    }
    const v = L.validateNeed(merged); invalid(v);
    const reserved = L.reservedForNeed(need.id, db.dispatches);
    const floor = need.fulfilled_quantity + reserved;
    if (v.value.required_quantity < floor) {
      throw new HttpError(400, 'Validation failed', {
        required_quantity: `Cannot go below ${floor} (already delivered ${need.fulfilled_quantity} + reserved ${reserved})`,
      });
    }
    need.required_quantity = v.value.required_quantity;
    need.priority = v.value.priority;
    return { status: 200, body: need };
  }

  if (method === 'DELETE') {
    perm(role, 'need.delete');
    const busy = activeDispatches(db, (d) => d.need_id === need.id).length;
    if (busy) throw new HttpError(409, `Cannot remove: ${busy} Pending/In Transit dispatch(es) use this need. Cancel them first.`);
    db.dispatches = db.dispatches.filter((d) => d.need_id !== need.id);   // old delivered/cancelled history
    db.needs = db.needs.filter((n) => n.id !== need.id);
    return { status: 200, body: { deleted: need.id } };
  }
  throw new HttpError(405, 'Method not allowed');
}

// -------------------------------------------------------------- dispatches
function dispatches({ method, id, body, role, db, store }) {
  if (method === 'POST') {
    perm(role, 'dispatch.create');
    const camp = store.find('camps', Number(body.camp_id));
    const need = store.find('needs', Number(body.need_id));
    const item = need ? store.find('inventory', need.inventory_item_id) : null;
    const v = L.validateDispatch(body, { camp, need, item, dispatches: db.dispatches });
    invalid(v);
    item.stock -= v.value.quantity;                       // RESERVE stock immediately
    const rec = { id: store.nextId('dispatches'), camp_id: camp.id, need_id: need.id, quantity: v.value.quantity, status: 'Pending', created_at: new Date().toISOString() };
    db.dispatches.push(rec);
    return { status: 201, body: rec };
  }
  const d = store.find('dispatches', id);
  if (!d) throw notFound('Dispatch');

  if (method === 'PUT' || method === 'PATCH') {
    for (const k of Object.keys(body)) {
      if (k !== 'status' && k !== 'id' && body[k] !== d[k]) throw new HttpError(400, 'Only the status of a dispatch can be changed');
    }
    const to = body.status;
    if (!L.DISPATCH_STATUSES.includes(to)) throw new HttpError(400, 'Validation failed', { status: 'Status must be Pending, In Transit, Delivered or Cancelled' });
    if (!L.canTransition(d.status, to)) throw new HttpError(409, `A ${d.status} dispatch cannot be changed to ${to}`);
    perm(role, to === 'In Transit' ? 'dispatch.inTransit' : to === 'Delivered' ? 'dispatch.deliver' : 'dispatch.cancel');

    const need = store.find('needs', d.need_id);
    const item = need && store.find('inventory', need.inventory_item_id);
    if (to === 'Delivered') {
      if (!need) throw new HttpError(409, 'The need for this dispatch no longer exists');
      need.fulfilled_quantity = Math.min(need.required_quantity, need.fulfilled_quantity + d.quantity);
    } else if (to === 'Cancelled') {
      if (item) item.stock += d.quantity;                 // undelivered -> stock restored
    }
    d.status = to;
    return { status: 200, body: d };
  }
  throw new HttpError(405, 'Dispatches cannot be deleted - cancel them instead (history is kept)');
}

// --------------------------------------------------------------- donations
function donations({ method, body, role, db, store }) {
  if (method !== 'POST') throw new HttpError(405, 'Donations are an append-only ledger and cannot be changed');
  perm(role, 'donation.create');
  const v = L.validateDonation(body); invalid(v);
  const rec = { id: store.nextId('donations'), ...v.value, date: today() };
  if (rec.type === 'In-Kind') {
    const item = store.find('inventory', rec.item_id);
    if (!item) throw new HttpError(400, 'Validation failed', { item_id: 'Item does not exist' });
    rec.category = item.category;
    item.stock += rec.amount_or_quantity;                 // in-kind donation raises stock
  } else {
    rec.item_id = null;
  }
  db.donations.push(rec);
  return { status: 201, body: rec };
}

// -------------------------------------------------------------- volunteers
function volunteers({ method, id, body, role, db, store }) {
  const checkCamp = (campId) => {
    const camp = store.find('camps', campId);
    if (!camp) throw new HttpError(400, 'Validation failed', { camp_id: 'Camp does not exist' });
    if (camp.status === 'Closed') throw new HttpError(409, `${camp.name} is Closed - volunteers cannot be assigned to it`);
    return camp;
  };

  if (method === 'POST') {
    perm(role, 'volunteer.register');
    const v = L.validateVolunteer(body); invalid(v);
    if (v.value.camp_id !== null) { perm(role, 'volunteer.assign'); checkCamp(v.value.camp_id); }
    const rec = { id: store.nextId('volunteers'), ...v.value };
    db.volunteers.push(rec);
    return { status: 201, body: rec };
  }
  const vol = store.find('volunteers', id);
  if (!vol) throw notFound('Volunteer');

  if (method === 'PUT' || method === 'PATCH') {
    const merged = { ...vol, ...body };
    const v = L.validateVolunteer(merged); invalid(v);
    if (v.value.name !== vol.name || v.value.skill !== vol.skill) perm(role, 'volunteer.edit');
    const target = v.value.camp_id;
    if (target !== vol.camp_id) {
      perm(role, 'volunteer.assign');
      if (target === null) {
        vol.camp_id = null;                               // unassign
      } else {
        const camp = checkCamp(target);
        if (vol.camp_id !== null) {
          const cur = store.find('camps', vol.camp_id);
          throw new HttpError(409, `${vol.name} is already assigned to ${cur ? cur.name : 'another camp'} - unassign first (one assignment per volunteer)`);
        }
        vol.camp_id = camp.id;
      }
    }
    vol.name = v.value.name;
    vol.skill = v.value.skill;
    return { status: 200, body: vol };
  }

  if (method === 'DELETE') {
    perm(role, 'volunteer.delete');
    db.volunteers = db.volunteers.filter((x) => x.id !== vol.id);
    return { status: 200, body: { deleted: vol.id } };
  }
  throw new HttpError(405, 'Method not allowed');
}

const handlers = { camps, inventory, needs, dispatches, donations, volunteers };

function mutate(ctx) {
  return handlers[ctx.col]({ ...ctx, db: ctx.store.db });
}

module.exports = { mutate, HttpError };