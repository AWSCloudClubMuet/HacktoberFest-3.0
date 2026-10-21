// ReliefHub mock API.
//
// JSON Server (0.17, used as a library) serves every GET with its usual
// filtering/sorting (e.g. /needs?camp_id=3, /dispatches?status=Pending).
// All writes go through the handlers below, which validate with the shared
// business rules and then update every affected collection in one synchronous
// step before a single db.write(). Node runs one request at a time, so each
// operation (e.g. "reserve stock + create dispatch") is applied all-or-nothing
// and two clicks on "Mark Delivered" can never both succeed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';
import * as D from '../shared/domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, 'seed.json');
const DB_FILE = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, 'db.json');
const PORT = Number(process.env.PORT) || 3001;

// First start only: create the working database from the seed. Later restarts
// keep whatever the team has changed (use `npm run reset-db` to start over).
if (!fs.existsSync(DB_FILE)) {
  fs.copyFileSync(SEED_FILE, DB_FILE);
  console.log(`Created ${path.relative(process.cwd(), DB_FILE)} from seed data.`);
}

const app = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const db = router.db;

app.use(jsonServer.defaults({ logger: process.env.QUIET !== '1' }));
app.use(jsonServer.bodyParser);

// --- helpers ----------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const all = (collection) => db.get(collection).value();
const snapshot = () => ({
  camps: all('camps'),
  inventory: all('inventory'),
  needs: all('needs'),
  dispatches: all('dispatches'),
  donations: all('donations'),
  volunteers: all('volunteers'),
});

function nextId(collection) {
  return all(collection).reduce((max, r) => (Number(r.id) > max ? Number(r.id) : max), 0) + 1;
}

function mustFind(collection, id, label) {
  const record = D.findById(all(collection), id);
  if (!record) throw new HttpError(404, `${label} #${id} was not found.`);
  return record;
}

function assertValid(check) {
  if (!check.ok) {
    const first = Object.values(check.errors)[0];
    throw new HttpError(400, first || 'Invalid input.', check.errors);
  }
  return check.value;
}

function removeWhere(collection, predicate) {
  const list = all(collection);
  for (let i = list.length - 1; i >= 0; i -= 1) if (predicate(list[i])) list.splice(i, 1);
}

const now = () => new Date().toISOString();

// Wraps a synchronous handler: runs it, persists, and maps errors to JSON.
const handle = (fn) => (req, res) => {
  try {
    const { status = 200, body } = fn(req);
    db.write();
    res.status(status).json(body);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, fields: err.fields || {} });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Unexpected server error.' });
    }
  }
};

// --- roles ------------------------------------------------------------------
// Demo-grade role check: the UI sends X-Role. Requests without the header are
// treated as the Coordinator so the API stays easy to explore with curl.

const roleOf = (req) => (req.get('X-Role') === 'volunteer' ? 'volunteer' : 'admin');

function volunteerMayWrite(req) {
  const keys = Object.keys(req.body || {});
  if (req.method === 'PATCH' && /^\/camps\/\d+$/.test(req.path)) {
    return keys.length > 0 && keys.every((k) => k === 'current_families');
  }
  if (req.method === 'PATCH' && /^\/dispatches\/\d+$/.test(req.path)) {
    return keys.length === 1 && keys[0] === 'status' && ['In Transit', 'Delivered'].includes(req.body.status);
  }
  return false;
}

app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || roleOf(req) === 'admin' || volunteerMayWrite(req)) return next();
  res.status(403).json({
    error: 'Field Volunteers can only update camp headcounts and mark dispatches In Transit or Delivered. Switch to Relief Coordinator for this action.',
    fields: {},
  });
});

// --- utility endpoints ------------------------------------------------------

app.get('/health', (req, res) => res.json({ ok: true }));

app.post(
  '/_reset',
  handle(() => {
    db.setState(JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')));
    return { body: { ok: true } };
  }),
);

// --- camps ------------------------------------------------------------------

app.post(
  '/camps',
  handle((req) => {
    const value = assertValid(D.validateCamp(req.body, { camps: all('camps') }));
    const camp = { id: nextId('camps'), ...value };
    all('camps').push(camp);
    return { status: 201, body: camp };
  }),
);

const updateCamp = handle((req) => {
  const camp = mustFind('camps', req.params.id, 'Camp');
  const merged = { ...camp, ...req.body };
  // Re-opening a Full camp is automatic; a request to mark "Full" by hand is
  // re-derived from the numbers by validateCamp.
  const value = assertValid(D.validateCamp(merged, { camps: all('camps'), id: camp.id }));
  Object.assign(camp, value);
  // A Closed camp keeps no volunteers.
  let unassigned = 0;
  if (camp.status === 'Closed') {
    for (const v of all('volunteers')) {
      if (D.sameId(v.camp_id, camp.id)) {
        v.camp_id = null;
        unassigned += 1;
      }
    }
  }
  return { body: { ...camp, unassigned_volunteers: unassigned } };
});
app.patch('/camps/:id', updateCamp);
app.put('/camps/:id', updateCamp);

app.delete(
  '/camps/:id',
  handle((req) => {
    const camp = mustFind('camps', req.params.id, 'Camp');
    const open = all('dispatches').filter((d) => D.sameId(d.camp_id, camp.id) && D.OPEN_DISPATCH_STATUSES.includes(d.status));
    if (open.length) {
      throw new HttpError(409, `This camp has ${open.length} Pending/In Transit dispatch(es). Cancel or deliver them before deleting the camp.`);
    }
    removeWhere('dispatches', (d) => D.sameId(d.camp_id, camp.id));
    removeWhere('needs', (n) => D.sameId(n.camp_id, camp.id));
    for (const v of all('volunteers')) if (D.sameId(v.camp_id, camp.id)) v.camp_id = null;
    removeWhere('camps', (c) => c === camp);
    return { body: {} };
  }),
);

// --- inventory --------------------------------------------------------------

app.post(
  '/inventory',
  handle((req) => {
    const value = assertValid(D.validateInventory(req.body, { inventory: all('inventory') }));
    const item = { id: nextId('inventory'), ...value };
    all('inventory').push(item);
    return { status: 201, body: item };
  }),
);

const updateInventory = handle((req) => {
  const item = mustFind('inventory', req.params.id, 'Inventory item');
  const value = assertValid(D.validateInventory({ ...item, ...req.body }, { inventory: all('inventory'), id: item.id }));
  Object.assign(item, value);
  return { body: item };
});
app.patch('/inventory/:id', updateInventory);
app.put('/inventory/:id', updateInventory);

app.delete(
  '/inventory/:id',
  handle((req) => {
    const item = mustFind('inventory', req.params.id, 'Inventory item');
    const needCount = all('needs').filter((n) => D.sameId(n.inventory_item_id, item.id)).length;
    const donationCount = all('donations').filter((d) => D.sameId(d.item_id, item.id)).length;
    if (needCount || donationCount) {
      throw new HttpError(
        409,
        `${item.name} is referenced by ${needCount} need(s) and ${donationCount} donation(s); it cannot be deleted.`,
      );
    }
    removeWhere('inventory', (i) => i === item);
    return { body: {} };
  }),
);

// --- needs ------------------------------------------------------------------

app.post(
  '/needs',
  handle((req) => {
    const value = assertValid(D.validateNeed(req.body, snapshot()));
    const need = { id: nextId('needs'), ...value };
    all('needs').push(need);
    return { status: 201, body: need };
  }),
);

const updateNeed = handle((req) => {
  const need = mustFind('needs', req.params.id, 'Need');
  const value = assertValid(D.validateNeed({ ...need, ...req.body }, { ...snapshot(), existing: need }));
  Object.assign(need, value);
  return { body: need };
});
app.patch('/needs/:id', updateNeed);
app.put('/needs/:id', updateNeed);

app.delete(
  '/needs/:id',
  handle((req) => {
    const need = mustFind('needs', req.params.id, 'Need');
    if (D.reservedForNeed(need.id, all('dispatches')) > 0) {
      throw new HttpError(409, 'This need has Pending/In Transit dispatches. Cancel or deliver them before removing it.');
    }
    removeWhere('dispatches', (d) => D.sameId(d.need_id, need.id));
    removeWhere('needs', (n) => n === need);
    return { body: {} };
  }),
);

// --- dispatches -------------------------------------------------------------

app.post(
  '/dispatches',
  handle((req) => {
    const check = D.validateDispatch(req.body, snapshot());
    const value = assertValid(check);
    // Reserve stock immediately: inventory.stock is what is still available.
    check.item.stock -= value.quantity;
    const timestamp = now();
    const dispatch = { id: nextId('dispatches'), ...value, status: 'Pending', created_at: timestamp, updated_at: timestamp };
    all('dispatches').push(dispatch);
    return { status: 201, body: dispatch };
  }),
);

const updateDispatch = handle((req) => {
  const dispatch = mustFind('dispatches', req.params.id, 'Dispatch');
  const { status: next, ...rest } = req.body || {};
  const edited = Object.keys(rest).filter((k) => ['camp_id', 'need_id', 'quantity'].includes(k) && !D.sameId(rest[k], dispatch[k]));
  if (edited.length) {
    throw new HttpError(400, 'Dispatch camp, need and quantity cannot be edited. Cancel it and create a new dispatch instead.');
  }
  if (!D.DISPATCH_STATUSES.includes(next)) throw new HttpError(400, `Status must be one of ${D.DISPATCH_STATUSES.join(', ')}.`);
  if (!D.canTransition(dispatch.status, next)) {
    throw new HttpError(409, `Dispatch #${dispatch.id} is already ${dispatch.status}; it cannot be marked ${next}.`);
  }

  if (next === 'Delivered') {
    const need = mustFind('needs', dispatch.need_id, 'Need');
    need.fulfilled_quantity = Number(need.fulfilled_quantity) + Number(dispatch.quantity);
  } else if (next === 'Cancelled') {
    const need = D.findById(all('needs'), dispatch.need_id);
    const item = need && D.findById(all('inventory'), need.inventory_item_id);
    if (!item) throw new HttpError(409, 'The inventory item for this dispatch no longer exists; stock cannot be restored.');
    item.stock = Number(item.stock) + Number(dispatch.quantity);
  }
  dispatch.status = next;
  dispatch.updated_at = now();
  return { body: dispatch };
});
app.patch('/dispatches/:id', updateDispatch);
app.put('/dispatches/:id', updateDispatch);

app.delete(
  '/dispatches/:id',
  handle((req) => {
    const dispatch = mustFind('dispatches', req.params.id, 'Dispatch');
    if (D.OPEN_DISPATCH_STATUSES.includes(dispatch.status)) {
      throw new HttpError(409, 'Cancel this dispatch first so its reserved stock is restored.');
    }
    removeWhere('dispatches', (d) => d === dispatch);
    return { body: {} };
  }),
);

// --- donations --------------------------------------------------------------

app.post(
  '/donations',
  handle((req) => {
    const value = assertValid(D.validateDonation(req.body, { inventory: all('inventory') }));
    if (value.type === 'In-Kind') {
      const item = D.findById(all('inventory'), value.item_id);
      item.stock = Number(item.stock) + value.amount_or_quantity;
    }
    const donation = { id: nextId('donations'), ...value, created_at: now() };
    all('donations').push(donation);
    return { status: 201, body: donation };
  }),
);

const rejectDonationEdit = (req, res) =>
  res.status(405).json({ error: 'Donations are a ledger and cannot be edited. Delete the entry and record it again.', fields: {} });
app.patch('/donations/:id', rejectDonationEdit);
app.put('/donations/:id', rejectDonationEdit);

app.delete(
  '/donations/:id',
  handle((req) => {
    const donation = mustFind('donations', req.params.id, 'Donation');
    if (donation.type === 'In-Kind') {
      const item = D.findById(all('inventory'), donation.item_id);
      if (item && Number(item.stock) < Number(donation.amount_or_quantity)) {
        throw new HttpError(
          409,
          `Cannot remove this donation: ${item.name} stock (${item.stock}) is lower than the donated quantity because it has already been dispatched.`,
        );
      }
      if (item) item.stock = Number(item.stock) - Number(donation.amount_or_quantity);
    }
    removeWhere('donations', (d) => d === donation);
    return { body: {} };
  }),
);

// --- volunteers -------------------------------------------------------------

app.post(
  '/volunteers',
  handle((req) => {
    const value = assertValid(D.validateVolunteer(req.body, { camps: all('camps') }));
    const volunteer = { id: nextId('volunteers'), ...value };
    all('volunteers').push(volunteer);
    return { status: 201, body: volunteer };
  }),
);

const updateVolunteer = handle((req) => {
  const volunteer = mustFind('volunteers', req.params.id, 'Volunteer');
  const value = assertValid(D.validateVolunteer({ ...volunteer, ...req.body }, { camps: all('camps') }));
  Object.assign(volunteer, value);
  return { body: volunteer };
});
app.patch('/volunteers/:id', updateVolunteer);
app.put('/volunteers/:id', updateVolunteer);

app.delete(
  '/volunteers/:id',
  handle((req) => {
    const volunteer = mustFind('volunteers', req.params.id, 'Volunteer');
    removeWhere('volunteers', (v) => v === volunteer);
    return { body: {} };
  }),
);

// --- reads ------------------------------------------------------------------

// Any write that reached this point has no custom handler (e.g. /camps without
// an id); refuse it rather than letting JSON Server bypass the business rules.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  res.status(405).json({ error: `${req.method} ${req.path} is not supported.`, fields: {} });
});

app.use(router);

app.listen(PORT, () => {
  console.log(`ReliefHub API running at http://localhost:${PORT}`);
  console.log(`Collections: ${Object.keys(db.getState()).map((c) => `/${c}`).join(' ')}`);
});
