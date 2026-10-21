// ReliefHub business rules — the single source of truth shared by the API
// server (server/server.js) and the React UI. Everything here is pure:
// functions take plain records and return values, never perform I/O.

export const CAMP_STATUSES = ['Active', 'Full', 'Closed'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const DISPATCH_STATUSES = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
export const OPEN_DISPATCH_STATUSES = ['Pending', 'In Transit'];
export const DONATION_TYPES = ['Cash', 'In-Kind'];
export const SKILLS = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
export const ITEM_CATEGORIES = ['Food', 'Water', 'Medicine', 'Shelter', 'Hygiene'];
// Cash can be unrestricted ("General") or earmarked for an item category.
export const CASH_CATEGORIES = ['General', ...ITEM_CATEGORIES];

// A High-priority need below this fulfilment percentage is a Critical Gap.
export const CRITICAL_THRESHOLD = 40;

// Allowed dispatch status changes. Delivered and Cancelled are terminal, which
// is what guarantees fulfilment and stock restoration each happen exactly once.
export const DISPATCH_TRANSITIONS = {
  Pending: ['In Transit', 'Delivered', 'Cancelled'],
  'In Transit': ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const ROLES = {
  admin: 'Relief Coordinator',
  volunteer: 'Field Volunteer',
};

// Field Volunteers report headcounts and move deliveries along; everything
// else (registry, warehouse, allocation, donations, staffing) is Admin-only.
const VOLUNTEER_ACTIONS = ['camp.updateFamilies', 'dispatch.advance'];

export function can(role, action) {
  if (role === 'admin') return true;
  return role === 'volunteer' && VOLUNTEER_ACTIONS.includes(action);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const sameId = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

export const findById = (list, id) => (list || []).find((r) => sameId(r.id, id));

// Parses a form/API value as an integer; returns NaN for blanks and fractions.
export function toInt(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(n) ? n : NaN;
}

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : NaN;
}

const clean = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

function requireText(errors, field, value, label, max = 80) {
  if (!value) errors[field] = `${label} is required.`;
  else if (value.length < 2) errors[field] = `${label} must be at least 2 characters.`;
  else if (value.length > max) errors[field] = `${label} must be at most ${max} characters.`;
}

function requireInt(errors, field, value, label, { min = 0, max = 1_000_000 } = {}) {
  if (Number.isNaN(value)) errors[field] = `${label} must be a whole number.`;
  else if (value < min) errors[field] = min === 0 ? `${label} cannot be negative.` : `${label} must be at least ${min}.`;
  else if (value > max) errors[field] = `${label} must be at most ${max.toLocaleString()}.`;
}

const result = (errors, value) => ({ ok: Object.keys(errors).length === 0, errors, value });

// ---------------------------------------------------------------------------
// Camps
// ---------------------------------------------------------------------------

// Closed is a manual state and always wins; otherwise a camp is Full exactly
// when it has reached capacity, and Active below it.
export function deriveCampStatus(requestedStatus, currentFamilies, capacity) {
  if (requestedStatus === 'Closed') return 'Closed';
  return currentFamilies >= capacity ? 'Full' : 'Active';
}

export function validateCamp(input, { camps = [], id = null } = {}) {
  const errors = {};
  const value = {
    name: clean(input.name),
    district: clean(input.district),
    capacity: toInt(input.capacity),
    current_families: toInt(input.current_families),
    status: input.status || 'Active',
  };
  requireText(errors, 'name', value.name, 'Camp name');
  requireText(errors, 'district', value.district, 'District', 40);
  requireInt(errors, 'capacity', value.capacity, 'Capacity', { min: 1, max: 100_000 });
  requireInt(errors, 'current_families', value.current_families, 'Current families', { max: 100_000 });
  if (!errors.capacity && !errors.current_families && value.current_families > value.capacity) {
    errors.current_families = `Current families cannot exceed capacity (${value.capacity}).`;
  }
  if (!CAMP_STATUSES.includes(value.status)) errors.status = `Status must be one of ${CAMP_STATUSES.join(', ')}.`;
  if (!errors.name && camps.some((c) => !sameId(c.id, id) && c.name.toLowerCase() === value.name.toLowerCase())) {
    errors.name = 'A camp with this name already exists.';
  }
  if (!errors.capacity && !errors.current_families) {
    value.status = deriveCampStatus(value.status, value.current_families, value.capacity);
  }
  return result(errors, value);
}

export const isCampOpen = (camp) => camp && camp.status !== 'Closed';

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const isLowStock = (item) => Number(item.stock) <= Number(item.reorder_level);

export function validateInventory(input, { inventory = [], id = null } = {}) {
  const errors = {};
  const value = {
    name: clean(input.name),
    category: input.category,
    unit: clean(input.unit),
    stock: toInt(input.stock),
    reorder_level: toInt(input.reorder_level),
  };
  requireText(errors, 'name', value.name, 'Item name');
  if (!ITEM_CATEGORIES.includes(value.category)) errors.category = `Category must be one of ${ITEM_CATEGORIES.join(', ')}.`;
  if (!value.unit) errors.unit = 'Unit is required.';
  else if (value.unit.length > 20) errors.unit = 'Unit must be at most 20 characters.';
  requireInt(errors, 'stock', value.stock, 'Stock', { max: 10_000_000 });
  requireInt(errors, 'reorder_level', value.reorder_level, 'Reorder level', { max: 10_000_000 });
  if (!errors.name && inventory.some((i) => !sameId(i.id, id) && i.name.toLowerCase() === value.name.toLowerCase())) {
    errors.name = 'An inventory item with this name already exists.';
  }
  return result(errors, value);
}

// ---------------------------------------------------------------------------
// Needs
// ---------------------------------------------------------------------------

export function needFulfilmentPct(need) {
  const required = Number(need.required_quantity);
  if (!required) return 0;
  return Math.min(100, (Number(need.fulfilled_quantity) / required) * 100);
}

// Quantity already promised to a need by dispatches that are still moving.
export function reservedForNeed(needId, dispatches) {
  return (dispatches || [])
    .filter((d) => sameId(d.need_id, needId) && OPEN_DISPATCH_STATUSES.includes(d.status))
    .reduce((sum, d) => sum + Number(d.quantity), 0);
}

// required − fulfilled − quantities in Pending / In Transit dispatches.
export function remainingUnreserved(need, dispatches) {
  return Math.max(0, Number(need.required_quantity) - Number(need.fulfilled_quantity) - reservedForNeed(need.id, dispatches));
}

export const isCriticalGap = (need) => need.priority === 'High' && needFulfilmentPct(need) < CRITICAL_THRESHOLD;

export function validateNeed(input, { camps = [], inventory = [], needs = [], dispatches = [], existing = null } = {}) {
  const errors = {};
  const value = {
    camp_id: toInt(input.camp_id),
    inventory_item_id: toInt(input.inventory_item_id),
    required_quantity: toInt(input.required_quantity),
    priority: input.priority,
    // Fulfilment only ever changes through Delivered dispatches.
    fulfilled_quantity: existing ? Number(existing.fulfilled_quantity) : 0,
  };
  const camp = findById(camps, value.camp_id);
  if (!camp) errors.camp_id = 'Choose an existing camp.';
  if (!findById(inventory, value.inventory_item_id)) errors.inventory_item_id = 'Choose an existing inventory item.';
  requireInt(errors, 'required_quantity', value.required_quantity, 'Required quantity', { min: 1, max: 10_000_000 });
  if (!PRIORITIES.includes(value.priority)) errors.priority = 'Priority must be High, Medium or Low.';

  if (existing) {
    const hasDispatches = dispatches.some((d) => sameId(d.need_id, existing.id));
    if (hasDispatches && !sameId(existing.camp_id, value.camp_id)) errors.camp_id = 'This need already has dispatches; its camp cannot change.';
    if (hasDispatches && !sameId(existing.inventory_item_id, value.inventory_item_id)) {
      errors.inventory_item_id = 'This need already has dispatches; its item cannot change.';
    }
    const committed = Number(existing.fulfilled_quantity) + reservedForNeed(existing.id, dispatches);
    if (!errors.required_quantity && value.required_quantity < committed) {
      errors.required_quantity = `Required quantity cannot go below ${committed} (already fulfilled or reserved).`;
    }
  }
  if (
    !errors.camp_id &&
    !errors.inventory_item_id &&
    needs.some(
      (n) =>
        !sameId(n.id, existing?.id) && sameId(n.camp_id, value.camp_id) && sameId(n.inventory_item_id, value.inventory_item_id),
    )
  ) {
    errors.inventory_item_id = 'This camp already has a need for this item — edit that need instead.';
  }
  return result(errors, value);
}

// ---------------------------------------------------------------------------
// Dispatches
// ---------------------------------------------------------------------------

// Largest quantity that may be dispatched right now for a need.
export function maxDispatchable(need, item, dispatches) {
  if (!need || !item) return 0;
  return Math.max(0, Math.min(Number(item.stock), remainingUnreserved(need, dispatches)));
}

export function validateDispatch(input, { camps = [], inventory = [], needs = [], dispatches = [] } = {}) {
  const errors = {};
  const value = {
    camp_id: toInt(input.camp_id),
    need_id: toInt(input.need_id),
    quantity: toInt(input.quantity),
  };
  const camp = findById(camps, value.camp_id);
  const need = findById(needs, value.need_id);
  const item = need && findById(inventory, need.inventory_item_id);

  if (!camp) errors.camp_id = 'Choose an existing camp.';
  else if (camp.status === 'Closed') errors.camp_id = 'Cannot dispatch to a Closed camp.';
  if (!need) errors.need_id = 'Choose an existing need.';
  else if (camp && !sameId(need.camp_id, camp.id)) errors.need_id = 'This need does not belong to the selected camp.';
  else if (!item) errors.need_id = 'The inventory item for this need no longer exists.';
  requireInt(errors, 'quantity', value.quantity, 'Quantity', { min: 1, max: 10_000_000 });

  if (!errors.need_id && !errors.quantity && item) {
    const remaining = remainingUnreserved(need, dispatches);
    if (value.quantity > item.stock) {
      errors.quantity = `Only ${item.stock} ${item.unit} of ${item.name} available in stock.`;
    } else if (value.quantity > remaining) {
      errors.quantity = `Exceeds the need's remaining unreserved quantity (${remaining} ${item.unit}).`;
    }
  }
  return { ...result(errors, value), need, item };
}

export function canTransition(from, to) {
  return (DISPATCH_TRANSITIONS[from] || []).includes(to);
}

// ---------------------------------------------------------------------------
// Donations
// ---------------------------------------------------------------------------

export function validateDonation(input, { inventory = [] } = {}) {
  const errors = {};
  const type = input.type;
  const value = {
    type,
    amount_or_quantity: type === 'Cash' ? toNumber(input.amount_or_quantity) : toInt(input.amount_or_quantity),
    item_id: type === 'In-Kind' ? toInt(input.item_id) : null,
    category: input.category,
    donor: clean(input.donor) || 'Anonymous',
  };
  if (!DONATION_TYPES.includes(type)) errors.type = 'Type must be Cash or In-Kind.';
  if (type === 'Cash') {
    if (Number.isNaN(value.amount_or_quantity) || value.amount_or_quantity <= 0) errors.amount_or_quantity = 'Amount must be greater than zero.';
    else if (value.amount_or_quantity > 1_000_000_000) errors.amount_or_quantity = 'Amount is unrealistically large.';
    else value.amount_or_quantity = Math.round(value.amount_or_quantity * 100) / 100;
    if (!CASH_CATEGORIES.includes(value.category)) errors.category = `Category must be one of ${CASH_CATEGORIES.join(', ')}.`;
  } else if (type === 'In-Kind') {
    requireInt(errors, 'amount_or_quantity', value.amount_or_quantity, 'Quantity', { min: 1, max: 10_000_000 });
    const item = findById(inventory, value.item_id);
    if (!item) errors.item_id = 'Choose the inventory item being donated.';
    // In-kind donations always count toward their item's category.
    else value.category = item.category;
  }
  if (value.donor.length > 80) errors.donor = 'Donor name must be at most 80 characters.';
  return result(errors, value);
}

export function donationTotals(donations) {
  const byCategory = {};
  let cash = 0;
  for (const d of donations || []) {
    const row = (byCategory[d.category] ||= { category: d.category, cash: 0, inKindUnits: 0, count: 0 });
    row.count += 1;
    if (d.type === 'Cash') {
      cash += Number(d.amount_or_quantity);
      row.cash += Number(d.amount_or_quantity);
    } else {
      row.inKindUnits += Number(d.amount_or_quantity);
    }
  }
  const order = CASH_CATEGORIES;
  const rows = Object.values(byCategory).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  return { cash, byCategory: rows };
}

// ---------------------------------------------------------------------------
// Volunteers
// ---------------------------------------------------------------------------

export function validateVolunteer(input, { camps = [] } = {}) {
  const errors = {};
  const hasCamp = input.camp_id !== null && input.camp_id !== undefined && input.camp_id !== '';
  const value = {
    name: clean(input.name),
    skill: input.skill,
    camp_id: hasCamp ? toInt(input.camp_id) : null,
  };
  requireText(errors, 'name', value.name, 'Name');
  if (!SKILLS.includes(value.skill)) errors.skill = `Skill must be one of ${SKILLS.join(', ')}.`;
  if (hasCamp) {
    const camp = findById(camps, value.camp_id);
    if (!camp) errors.camp_id = 'Choose an existing camp.';
    else if (camp.status === 'Closed') errors.camp_id = 'Volunteers cannot be assigned to a Closed camp.';
  }
  return result(errors, value);
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------
// Needs are measured in different units (kg, litres, kits), so fulfilment is
// averaged per need rather than summed across units. Each need's percentage is
// capped at 100 so over-delivery cannot mask a shortfall elsewhere.

const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export function computeDashboard({ camps = [], inventory = [], needs = [], volunteers = [] }) {
  const openCamps = camps.filter(isCampOpen);
  const itemById = new Map(inventory.map((i) => [String(i.id), i]));
  const campById = new Map(camps.map((c) => [String(c.id), c]));

  const byCategory = ITEM_CATEGORIES.map((category) => {
    const pcts = needs.filter((n) => itemById.get(String(n.inventory_item_id))?.category === category).map(needFulfilmentPct);
    return { category, pct: Math.round(average(pcts) * 10) / 10, needs: pcts.length };
  }).filter((row) => row.needs > 0);

  const criticalGaps = needs
    .filter(isCriticalGap)
    .map((n) => {
      const item = itemById.get(String(n.inventory_item_id));
      return {
        need: n,
        camp: campById.get(String(n.camp_id)) || null,
        item: item || null,
        pct: needFulfilmentPct(n),
        gap: Number(n.required_quantity) - Number(n.fulfilled_quantity),
      };
    })
    // Worst gap first: lowest fulfilment, then the largest unmet quantity.
    .sort((a, b) => a.pct - b.pct || b.gap - a.gap);

  return {
    activeCamps: openCamps.length,
    familiesSheltered: openCamps.reduce((sum, c) => sum + Number(c.current_families), 0),
    overallFulfilment: Math.round(average(needs.map(needFulfilmentPct)) * 10) / 10,
    lowStockCount: inventory.filter(isLowStock).length,
    volunteersDeployed: volunteers.filter((v) => v.camp_id !== null && v.camp_id !== undefined && campById.has(String(v.camp_id))).length,
    byCategory,
    criticalGaps,
  };
}
