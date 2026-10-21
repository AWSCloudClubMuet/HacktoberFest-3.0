/* ReliefHub services: REST client + business rules (DOM-free, so it can be tested in Node) */
const Session = { user: null };
const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const { hostname, port, protocol } = window.location;
  if (protocol === 'file:') return 'http://localhost:3000';
  if (port === '3000') return '';
  return `http://${hostname}:3000`;
})();
const isAdmin = () => Session.user?.role === 'admin';
const DISTRICTS = ['Sukkur','Larkana','Dadu','Jacobabad','Khairpur','Shikarpur','Hyderabad','Thatta','Badin','Mirpurkhas'];
const CATEGORIES = ['Food','Water','Medical','Shelter','Hygiene','Clothing'];
const SKILLS = ['Medical','Logistics','Cooking','Driving','Counselling'];

async function req(method, path, body) {
  let r;
  try { r = await fetch(API_BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('Cannot reach the API at http://localhost:3000. Start it with "npm start" in the ReliefHub project folder.'); }
  if (!r.ok) throw new Error(`Request failed (${r.status}): ${method} ${path}`);
  return r.json().catch(() => null);
}
const DB = {
  list: (c, q = '') => req('GET', `/${c}${q}`),
  get: (c, id) => req('GET', `/${c}/${id}`),
  add: (c, d) => req('POST', `/${c}`, d),
  upd: (c, id, d) => req('PATCH', `/${c}/${id}`, d),
  del: (c, id) => req('DELETE', `/${c}/${id}`),
};

const today = () => new Date().toISOString().slice(0, 10);
const guard = () => { if (!isAdmin()) throw new Error('Only a Relief Coordinator can perform this action.'); };
function num(v, label, { min = 0 } = {}) {
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n)) throw new Error(`${label} must be a number.`);
  if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  if (n < min) throw new Error(`${label} must be at least ${min}.`);
  return n;
}
function txt(v, label, min = 2) {
  v = String(v ?? '').trim();
  if (v.length < min) throw new Error(`${label} must have at least ${min} characters.`);
  return v.slice(0, 80);
}
function dt(v) {
  if (!v) throw new Error('Date is required.');
  if (v > today()) throw new Error('Date cannot be in the future.');
  return v;
}
const allocated = ds => ds.filter(d => d.status !== 'Cancelled').reduce((s, d) => s + d.qty, 0);
const campStatus = (families, cap, closed) => closed ? 'Closed' : families >= cap ? 'Full' : 'Active';

const Svc = {
  async login(username, password) {
    const [u] = await DB.list('users', '?username=' + encodeURIComponent(username));
    if (!u || u.password !== password) throw new Error('Invalid username or password.');
    const { password: _, ...safe } = u; return safe;
  },
  async signup({ name, username, password }) {
    const fullName = txt(name, 'Full name', 3);
    const account = String(username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,24}$/.test(account)) throw new Error('Username must be 3–24 characters using letters, numbers, dots, underscores or hyphens.');
    if (String(password ?? '').length < 8) throw new Error('Password must be at least 8 characters long.');
    if ((await DB.list('users', '?username=' + encodeURIComponent(account))).length)
      throw new Error('That username is already taken. Choose another.');
    const created = await DB.add('users', { name: fullName, username: account, password, role: 'volunteer' });
    const { password: _, ...safe } = created;
    return safe;
  },

  /* ---------- Camps ---------- */
  async saveCamp(v, ex) {
    const o = {};
    if (isAdmin()) { o.name = txt(v.name, 'Camp name', 3); o.district = txt(v.district, 'District'); o.capacity = num(v.capacity, 'Capacity', { min: 1 }); }
    else if (!ex) guard();
    const cap = o.capacity ?? ex.capacity;
    const fam = num(v.families, 'Current families');
    if (fam > cap) throw new Error(`Current families (${fam}) cannot exceed capacity (${cap}).`);
    const closed = isAdmin() ? v.status === 'Closed' : ex.status === 'Closed';
    o.families = fam; o.status = campStatus(fam, cap, closed);   // Full is automatic
    if (o.name) {
      const all = await DB.list('camps');
      if (all.some(c => c.id != ex?.id && c.district === o.district && c.name.toLowerCase() === o.name.toLowerCase()))
        throw new Error('A camp with this name already exists in that district.');
    }
    if (!ex) return DB.add('camps', o);
    await DB.upd('camps', ex.id, o);
    if (o.status === 'Closed' && ex.status !== 'Closed')   // closing a camp releases its volunteers
      for (const v of await DB.list('volunteers', '?campId=' + ex.id)) await DB.upd('volunteers', v.id, { campId: null });
  },
  async deleteCamp(id) {
    guard();
    const [n, d, v] = await Promise.all(['needs', 'dispatches', 'volunteers'].map(c => DB.list(c, '?campId=' + id)));
    if (n.length || d.length || v.length) throw new Error(`Cannot delete: camp still has ${n.length} needs, ${d.length} dispatches and ${v.length} volunteers. Close the camp instead.`);
    await DB.del('camps', id);
  },

  /* ---------- Needs ---------- */
  async saveNeed(v, ex) {
    guard();
    const required = num(v.required, 'Required quantity', { min: 1 });
    if (!['High', 'Medium', 'Low'].includes(v.priority)) throw new Error('Choose a priority.');
    if (ex) {
      const a = allocated(await DB.list('dispatches', '?needId=' + ex.id));
      if (required < a) throw new Error(`Required quantity cannot be below the ${a} already allocated through dispatches.`);
      return DB.upd('needs', ex.id, { required, priority: v.priority });
    }
    const campId = num(v.campId, 'Camp'), itemId = num(v.itemId, 'Item');
    const [camp, , dup] = await Promise.all([DB.get('camps', campId), DB.get('inventory', itemId), DB.list('needs', `?campId=${campId}&itemId=${itemId}`)]);
    if (camp.status === 'Closed') throw new Error('Cannot add needs to a Closed camp.');
    if (dup.length) throw new Error('This camp already has a need for that item. Edit the existing one.');
    await DB.add('needs', { campId, itemId, required, priority: v.priority, fulfilled: 0 });
  },
  async deleteNeed(id) {
    guard();
    if ((await DB.list('dispatches', '?needId=' + id)).length) throw new Error('Cannot delete a need that has dispatches.');
    await DB.del('needs', id);
  },

  /* ---------- Inventory ---------- */
  async saveItem(v, ex) {
    guard();
    const o = { name: txt(v.name, 'Item name', 3), category: v.category, unit: txt(v.unit, 'Unit', 1), stock: num(v.stock, 'Stock'), reorder: num(v.reorder, 'Reorder level') };
    if (!CATEGORIES.includes(o.category)) throw new Error('Choose a category.');
    if ((await DB.list('inventory')).some(i => i.id != ex?.id && i.name.toLowerCase() === o.name.toLowerCase())) throw new Error('An item with this name already exists.');
    return ex ? DB.upd('inventory', ex.id, o) : DB.add('inventory', o);
  },
  async deleteItem(id) {
    guard();
    const refs = await Promise.all(['needs', 'dispatches', 'donations'].map(c => DB.list(c, '?itemId=' + id)));
    if (refs.some(r => r.length)) throw new Error('Cannot delete: item is referenced by needs, dispatches or donations.');
    await DB.del('inventory', id);
  },

  /* ---------- Dispatches ---------- */
  async createDispatch(v) {
    guard();
    const need = await DB.get('needs', num(v.needId, 'Need'));
    const [camp, item, ds] = await Promise.all([DB.get('camps', need.campId), DB.get('inventory', need.itemId), DB.list('dispatches', '?needId=' + need.id)]);
    if (camp.status === 'Closed') throw new Error('Cannot dispatch to a Closed camp.');
    const qty = num(v.qty, 'Quantity', { min: 1 });
    const remaining = need.required - allocated(ds);
    if (qty > remaining) throw new Error(`Over-allocation: only ${remaining} ${item.unit} of this need is still unallocated.`);
    if (qty > item.stock) throw new Error(`Insufficient stock: only ${item.stock} ${item.unit} available.`);
    const d = await DB.add('dispatches', { campId: camp.id, needId: need.id, itemId: item.id, qty, status: 'Pending', date: dt(v.date), driver: txt(v.driver, 'Driver / vehicle') });
    try { await DB.upd('inventory', item.id, { stock: item.stock - qty }); }   // reserve immediately
    catch (e) { await DB.del('dispatches', d.id); throw e; }
  },
  async setDispatchStatus(id, next) {
    const d = await DB.get('dispatches', id);
    const allowed = { Pending: ['In Transit', 'Cancelled'], 'In Transit': ['Delivered', 'Cancelled'] };
    if (!allowed[d.status]?.includes(next)) throw new Error(`A ${d.status} dispatch cannot become ${next}.`);
    if (next === 'Cancelled') guard();
    await DB.upd('dispatches', id, { status: next });
    if (next === 'Delivered') { const n = await DB.get('needs', d.needId); await DB.upd('needs', n.id, { fulfilled: Math.min(n.required, n.fulfilled + d.qty) }); }
    if (next === 'Cancelled') { const i = await DB.get('inventory', d.itemId); await DB.upd('inventory', i.id, { stock: i.stock + d.qty }); }  // restore reserved stock
  },

  /* ---------- Donations ---------- */
  async donateCash(v) {
    guard();
    await DB.add('donations', { type: 'Cash', donor: txt(v.donor, 'Donor name'), amount: num(v.amount, 'Amount (PKR)', { min: 1 }), itemId: null, qty: 0, category: 'Cash', date: dt(v.date) });
  },
  async donateInKind(v) {
    guard();
    const item = await DB.get('inventory', num(v.itemId, 'Item')), qty = num(v.qty, 'Quantity', { min: 1 });
    const d = await DB.add('donations', { type: 'In-Kind', donor: txt(v.donor, 'Donor name'), amount: 0, itemId: item.id, qty, category: item.category, date: dt(v.date) });
    try { await DB.upd('inventory', item.id, { stock: item.stock + qty }); }
    catch (e) { await DB.del('donations', d.id); throw e; }
  },

  /* ---------- Volunteers ---------- */
  async saveVolunteer(v, ex) {
    guard();
    const o = { name: txt(v.name, 'Name', 3), skill: v.skill, phone: String(v.phone || '').trim() };
    if (!SKILLS.includes(o.skill)) throw new Error('Choose a skill.');
    if (!/^(\+92|0)3\d{2}-?\d{7}$/.test(o.phone)) throw new Error('Enter a valid mobile number, e.g. 0300-1234567.');
    if ((await DB.list('volunteers')).some(x => x.id != ex?.id && x.phone === o.phone)) throw new Error('A volunteer with this phone number is already registered.');
    return ex ? DB.upd('volunteers', ex.id, o) : DB.add('volunteers', { ...o, campId: null });
  },
  async assign(vid, cid) {
    guard();
    const [v, c] = await Promise.all([DB.get('volunteers', vid), DB.get('camps', num(cid, 'Camp'))]);
    if (v.campId) throw new Error(`${v.name} is already assigned to a camp. Unassign first.`);
    if (c.status === 'Closed') throw new Error('Cannot assign volunteers to a Closed camp.');
    await DB.upd('volunteers', vid, { campId: c.id });
  },
  async unassign(vid) { guard(); await DB.upd('volunteers', vid, { campId: null }); },
  async deleteVolunteer(id) { guard(); await DB.del('volunteers', id); },
};
