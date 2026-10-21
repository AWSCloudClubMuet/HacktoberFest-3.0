/*
 * Shared business logic - loaded by the browser (window.Logic) AND by the Node
 * server / tests (require). Pure functions only: no DOM, no I/O.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------ constants
  const CAMP_STATUSES = ['Open', 'Full', 'Closed'];
  const PRIORITIES = ['High', 'Medium', 'Low'];
  const DISPATCH_STATUSES = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
  const ACTIVE_DISPATCH = ['Pending', 'In Transit'];        // these hold reserved stock
  const SKILLS = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
  const CATEGORIES = ['Food', 'Water', 'Medical', 'Shelter', 'Hygiene', 'Clothing'];
  const DONATION_CATEGORIES = CATEGORIES.concat(['General']);
  const DONATION_TYPES = ['Cash', 'In-Kind'];
  const ROLES = { admin: 'Relief Coordinator', volunteer: 'Field Volunteer' };
  const CRITICAL_THRESHOLD = 40;                             // % fulfilment

  // Allowed status transitions for a dispatch.
  const TRANSITIONS = {
    'Pending': ['In Transit', 'Cancelled'],
    'In Transit': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': [],
  };

  // ------------------------------------------------------------ permissions
  const VOLUNTEER_ACTIONS = new Set([
    'camp.updateFamilies', 'need.create', 'need.edit',
    'dispatch.inTransit', 'dispatch.deliver',
    'donation.create', 'volunteer.register',
  ]);
  /** Relief Coordinator (admin) may do everything; Field Volunteer a safe subset. */
  function can(role, action) {
    if (role === 'admin') return true;
    if (role === 'volunteer') return VOLUNTEER_ACTIONS.has(action);
    return false;
  }

  // ------------------------------------------------------------ helpers
  const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
  function toInt(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? v : NaN;
    if (typeof v === 'string' && /^\s*-?\d+\s*$/.test(v)) return parseInt(v, 10);
    return NaN;
  }
  function toNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    if (typeof v === 'string' && v.trim() !== '' && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) return parseFloat(v);
    return NaN;
  }
  function textField(errors, key, value, label, min, max) {
    const s = isBlank(value) ? '' : String(value).trim().replace(/\s+/g, ' ');
    if (s.length < min) errors[key] = `${label} is required` + (min > 1 ? ` (min ${min} characters)` : '');
    else if (s.length > max) errors[key] = `${label} must be at most ${max} characters`;
    return s;
  }
  function intField(errors, key, value, label, min, max) {
    const n = toInt(value);
    if (Number.isNaN(n)) errors[key] = `${label} must be a whole number`;
    else if (n < min) errors[key] = `${label} must be at least ${min}`;
    else if (n > max) errors[key] = `${label} must be at most ${max}`;
    return n;
  }
  const result = (errors, value) => ({ ok: Object.keys(errors).length === 0, errors, value });

  // ------------------------------------------------------------ validators
  /** Validates a camp. `status` is the requested status; use deriveCampStatus afterwards. */
  function validateCamp(input) {
    const e = {};
    const name = textField(e, 'name', input.name, 'Camp name', 2, 80);
    const district = textField(e, 'district', input.district, 'District', 2, 60);
    const capacity = intField(e, 'capacity', input.capacity, 'Capacity', 1, 100000);
    const current = intField(e, 'current_families', input.current_families, 'Current families', 0, 100000);
    if (!e.capacity && !e.current_families && current > capacity) {
      e.current_families = 'Current families cannot exceed capacity';
    }
    const status = isBlank(input.status) ? 'Open' : input.status;
    if (!CAMP_STATUSES.includes(status)) e.status = 'Status must be Open, Full or Closed';
    return result(e, { name, district, capacity, current_families: current, status });
  }

  /** Full is automatic: families >= capacity -> Full; Closed is always manual. */
  function deriveCampStatus(camp) {
    if (camp.status === 'Closed') return 'Closed';
    if (Number(camp.current_families) >= Number(camp.capacity)) return 'Full';
    return 'Open';   // also un-Fulls a camp whose families dropped below capacity
  }

  function validateInventory(input) {
    const e = {};
    const name = textField(e, 'name', input.name, 'Item name', 2, 80);
    const unit = textField(e, 'unit', input.unit, 'Unit', 1, 20);
    const category = isBlank(input.category) ? '' : String(input.category).trim();
    if (!CATEGORIES.includes(category)) e.category = 'Choose a category: ' + CATEGORIES.join(', ');
    const stock = intField(e, 'stock', input.stock, 'Stock', 0, 100000000);
    const reorder = intField(e, 'reorder_level', input.reorder_level, 'Reorder level', 0, 100000000);
    return result(e, { name, category, unit, stock, reorder_level: reorder });
  }

  function validateNeed(input) {
    const e = {};
    const camp_id = toInt(input.camp_id);
    if (Number.isNaN(camp_id)) e.camp_id = 'Choose a camp';
    const inventory_item_id = toInt(input.inventory_item_id);
    if (Number.isNaN(inventory_item_id)) e.inventory_item_id = 'Choose an inventory item';
    const required_quantity = intField(e, 'required_quantity', input.required_quantity, 'Required quantity', 1, 100000000);
    const priority = input.priority;
    if (!PRIORITIES.includes(priority)) e.priority = 'Priority must be High, Medium or Low';
    return result(e, { camp_id, inventory_item_id, required_quantity, priority });
  }

  function validateDonation(input) {
    const e = {};
    const type = input.type;
    if (!DONATION_TYPES.includes(type)) e.type = 'Type must be Cash or In-Kind';
    let amount, item_id = null;
    if (type === 'In-Kind') {
      amount = intField(e, 'amount_or_quantity', input.amount_or_quantity, 'Quantity', 1, 100000000);
      item_id = toInt(input.item_id);
      if (Number.isNaN(item_id)) { e.item_id = 'Choose the item donated'; item_id = null; }
    } else {
      amount = toNum(input.amount_or_quantity);
      if (Number.isNaN(amount) || amount <= 0) e.amount_or_quantity = 'Amount must be a number greater than 0';
      else if (amount > 1e10) e.amount_or_quantity = 'Amount is too large';
      else amount = Math.round(amount * 100) / 100;
    }
    let category = isBlank(input.category) ? '' : String(input.category).trim();
    if (type === 'Cash' && !DONATION_CATEGORIES.includes(category)) e.category = 'Choose a category';
    const donor = isBlank(input.donor) ? '' : String(input.donor).trim().slice(0, 80);
    return result(e, { type, amount_or_quantity: amount, item_id, category, donor });
  }

  function validateVolunteer(input) {
    const e = {};
    const name = textField(e, 'name', input.name, 'Name', 2, 80);
    const skill = input.skill;
    if (!SKILLS.includes(skill)) e.skill = 'Skill must be one of: ' + SKILLS.join(', ');
    let camp_id = null;
    if (!isBlank(input.camp_id)) {
      camp_id = toInt(input.camp_id);
      if (Number.isNaN(camp_id)) { e.camp_id = 'Invalid camp'; camp_id = null; }
    }
    return result(e, { name, skill, camp_id });
  }

  // ------------------------------------------------------------ inventory
  /** Low Stock = at or below the reorder level. */
  const isLowStock = (item) => Number(item.stock) <= Number(item.reorder_level);

  // ------------------------------------------------------------ needs / dispatches
  /** Quantity currently reserved by Pending / In Transit dispatches for a need. */
  function reservedForNeed(needId, dispatches, excludeDispatchId) {
    let total = 0;
    for (const d of dispatches) {
      const skip = excludeDispatchId !== undefined && d.id === excludeDispatchId;
      if (d.need_id === needId && !skip && ACTIVE_DISPATCH.includes(d.status)) {
        total += Number(d.quantity);
      }
    }
    return total;
  }

  /** required, fulfilled, reserved, remaining unreserved and progress % for a need. */
  function needMetrics(need, dispatches) {
    const required = Number(need.required_quantity);
    const fulfilled = Number(need.fulfilled_quantity) || 0;
    const reserved = reservedForNeed(need.id, dispatches);
    const remaining = Math.max(0, required - fulfilled - reserved);
    const progress = required > 0 ? Math.min(100, (fulfilled / required) * 100) : 0;
    return { required, fulfilled, reserved, remaining, progress };
  }

  /** The most that can be dispatched now: limited by stock AND remaining unreserved need. */
  function maxDispatchQty(need, item, dispatches) {
    const m = needMetrics(need, dispatches);
    return Math.max(0, Math.min(Number(item.stock), m.remaining));
  }

  /** Returns {ok, errors, value:{quantity}} for a proposed dispatch. */
  function validateDispatch(input, ctx) {
    const e = {};
    const { camp, need, item, dispatches } = ctx;
    if (!camp) e.camp_id = 'Choose a camp';
    else if (camp.status === 'Closed') e.camp_id = 'This camp is Closed - it cannot receive dispatches';
    if (!need) e.need_id = 'Choose a need';
    else if (camp && need.camp_id !== camp.id) e.need_id = 'This need does not belong to the selected camp';
    const quantity = intField(e, 'quantity', input.quantity, 'Quantity', 1, 100000000);
    if (!e.quantity && need && item) {
      const m = needMetrics(need, dispatches);
      if (quantity > item.stock) {
        e.quantity = `Only ${item.stock} ${item.unit} in stock - cannot dispatch ${quantity}`;
      } else if (quantity > m.remaining) {
        e.quantity = m.remaining === 0
          ? 'This need has no unreserved quantity left'
          : `Only ${m.remaining} ${item.unit} still unreserved for this need (required - delivered - pending/in-transit)`;
      }
    }
    return result(e, { quantity });
  }

  const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

  // ------------------------------------------------------------ dashboard
  const isActiveCamp = (c) => c.status !== 'Closed';

  function overallFulfilment(needs) {
    let req = 0, done = 0;
    for (const n of needs) {
      req += Number(n.required_quantity);
      done += Math.min(Number(n.fulfilled_quantity) || 0, Number(n.required_quantity));
    }
    return req === 0 ? 0 : (done / req) * 100;
  }

  /** Fulfilment % per inventory category (sum fulfilled / sum required for needs of that category). */
  function fulfilmentByCategory(needs, inventory) {
    const byId = new Map(inventory.map((i) => [i.id, i]));
    const acc = {};
    for (const n of needs) {
      const item = byId.get(n.inventory_item_id);
      if (!item) continue;
      const a = acc[item.category] || (acc[item.category] = { category: item.category, required: 0, fulfilled: 0 });
      a.required += Number(n.required_quantity);
      a.fulfilled += Math.min(Number(n.fulfilled_quantity) || 0, Number(n.required_quantity));
    }
    return Object.values(acc)
      .map((a) => ({ ...a, pct: a.required ? (a.fulfilled / a.required) * 100 : 0 }))
      .sort((x, y) => CATEGORIES.indexOf(x.category) - CATEGORIES.indexOf(y.category));
  }

  /** High-priority needs under 40% fulfilment, worst gap (lowest %) first. */
  function criticalGaps(needs, camps, inventory) {
    const campById = new Map(camps.map((c) => [c.id, c]));
    const itemById = new Map(inventory.map((i) => [i.id, i]));
    const rows = [];
    for (const n of needs) {
      if (n.priority !== 'High') continue;
      const pct = n.required_quantity > 0 ? ((Number(n.fulfilled_quantity) || 0) / n.required_quantity) * 100 : 0;
      if (pct >= CRITICAL_THRESHOLD) continue;
      rows.push({
        need: n, camp: campById.get(n.camp_id), item: itemById.get(n.inventory_item_id),
        pct, shortfall: n.required_quantity - (Number(n.fulfilled_quantity) || 0),
      });
    }
    rows.sort((a, b) => a.pct - b.pct || b.shortfall - a.shortfall);
    return rows;
  }

  function computeKPIs({ camps, needs, inventory, volunteers }) {
    const active = camps.filter(isActiveCamp);
    return {
      activeCamps: active.length,
      familiesSheltered: active.reduce((s, c) => s + Number(c.current_families), 0),
      fulfilmentPct: overallFulfilment(needs),
      lowStockCount: inventory.filter(isLowStock).length,
      volunteersDeployed: volunteers.filter((v) => v.camp_id !== null && v.camp_id !== undefined).length,
    };
  }

  // ------------------------------------------------------------ donations
  function donationTotals(donations) {
    const cashByCategory = {}, inKindByCategory = {};
    let cashTotal = 0, cashCount = 0, inKindCount = 0;
    for (const d of donations) {
      const amt = Number(d.amount_or_quantity);
      if (d.type === 'Cash') {
        cashTotal += amt; cashCount++;
        cashByCategory[d.category] = (cashByCategory[d.category] || 0) + amt;
      } else {
        inKindCount++;
        inKindByCategory[d.category] = (inKindByCategory[d.category] || 0) + amt;
      }
    }
    cashTotal = Math.round(cashTotal * 100) / 100;
    return { cashTotal, cashCount, inKindCount, cashByCategory, inKindByCategory };
  }

  return {
    CAMP_STATUSES, PRIORITIES, DISPATCH_STATUSES, ACTIVE_DISPATCH, SKILLS, CATEGORIES,
    DONATION_CATEGORIES, DONATION_TYPES, ROLES, CRITICAL_THRESHOLD, TRANSITIONS,
    can, validateCamp, deriveCampStatus, validateInventory, validateNeed, validateDonation,
    validateVolunteer, isLowStock, reservedForNeed, needMetrics, maxDispatchQty,
    validateDispatch, canTransition, isActiveCamp, overallFulfilment, fulfilmentByCategory,
    criticalGaps, computeKPIs, donationTotals,
  };
});