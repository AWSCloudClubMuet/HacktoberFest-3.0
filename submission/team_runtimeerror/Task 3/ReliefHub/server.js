const http = require('http'), fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'db.json'), PORT = process.env.PORT || 3001;
let db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : require('./seed')();
const save = () => fs.writeFileSync(FILE, JSON.stringify(db, null, 1)); save();
class E extends Error { constructor(m, c = 400) { super(m); this.c = c; } }
const int = (v, n, min = 0) => { v = Number(v); if (!Number.isInteger(v) || v < min) throw new E(`${n} must be a whole number >= ${min}`); return v; };
const str = (v, n, min = 1) => { v = String(v ?? '').trim(); if (v.length < min) throw new E(`${n} is required (min ${min} chars)`); return v; };
const get = (col, id, n) => { const x = db[col].find(x => x.id == id); if (!x) throw new E(`${n} not found`, 404); return x; };
const nextId = c => Math.max(0, ...db[c].map(x => x.id)) + 1;
const ACTIVE = ['Pending', 'In Transit'];
const PIN = process.env.ADMIN_PIN || '1234', tokens = new Map(), idem = new Map();
const reserved = (needId) => db.dispatches.filter(d => d.need_id == needId && ACTIVE.includes(d.status)).reduce((s, d) => s + d.quantity, 0);
const make = {
  camps(b, o = {}) {
    const c = { current_families: 0, ...o };
    if ('name' in b) c.name = str(b.name, 'Name', 3);
    if ('district' in b) c.district = str(b.district, 'District');
    if ('capacity' in b) c.capacity = int(b.capacity, 'Capacity', 1);
    if ('current_families' in b) c.current_families = int(b.current_families, 'Current families');
    if ('status' in b) { if (!['Active', 'Full', 'Closed'].includes(b.status)) throw new E('Invalid status'); c.status = b.status; }
    if (!c.name || !c.district || !c.capacity) throw new E('Name, district and capacity are required');
    if (c.current_families > c.capacity) throw new E('Current families cannot exceed capacity');
    if (c.status !== 'Closed') c.status = c.current_families >= c.capacity ? 'Full' : 'Active';
    return c;
  },
  inventory(b, o = {}) {
    const i = { ...o };
    if ('name' in b) i.name = str(b.name, 'Name', 2);
    if ('category' in b) i.category = str(b.category, 'Category');
    if ('unit' in b) i.unit = str(b.unit, 'Unit');
    if ('stock' in b) i.stock = int(b.stock, 'Stock');
    if ('reorder_level' in b) i.reorder_level = int(b.reorder_level, 'Reorder level');
    if (!i.name || !i.category || !i.unit || i.stock == null || i.reorder_level == null) throw new E('All inventory fields are required');
    return i;
  },
  needs(b, o = {}) {
    const n = { fulfilled_quantity: 0, ...o };
    if ('camp_id' in b) { const c = get('camps', b.camp_id, 'Camp'); if (c.status === 'Closed' && (!o.id || c.id != o.camp_id)) throw new E('Cannot add needs to a Closed camp'); n.camp_id = c.id; }
    if ('inventory_item_id' in b) n.inventory_item_id = get('inventory', b.inventory_item_id, 'Item').id;
    if ('required_quantity' in b) n.required_quantity = int(b.required_quantity, 'Required quantity', 1);
    if ('priority' in b) { if (!['High', 'Medium', 'Low'].includes(b.priority)) throw new E('Invalid priority'); n.priority = b.priority; }
    if (!n.camp_id || !n.inventory_item_id || !n.required_quantity || !n.priority) throw new E('Camp, item, quantity and priority are required');
    if (n.required_quantity < n.fulfilled_quantity + (o.id ? reserved(o.id) : 0)) throw new E('Required quantity cannot be below fulfilled + in-dispatch quantity');
    return n;
  },
  volunteers(b, o = {}) {
    const v = { camp_id: null, ...o };
    if ('name' in b) v.name = str(b.name, 'Name', 2);
    if ('skill' in b) { if (!['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'].includes(b.skill)) throw new E('Invalid skill'); v.skill = b.skill; }
    if ('camp_id' in b) {
      if (b.camp_id === '' || b.camp_id == null) v.camp_id = null;
      else { const c = get('camps', b.camp_id, 'Camp'); if (c.status === 'Closed') throw new E('Cannot assign a volunteer to a Closed camp'); v.camp_id = c.id; }
    }
    if (!v.name || !v.skill) throw new E('Name and skill are required');
    return v;
  },
};
function dispatch(b) {
  const n = get('needs', b.need_id, 'Need');
  if (b.camp_id && b.camp_id != n.camp_id) throw new E('That need does not belong to the chosen camp');
  const camp = get('camps', n.camp_id, 'Camp'); if (camp.status === 'Closed') throw new E('Camp is Closed');
  const q = int(b.quantity, 'Quantity', 1), it = get('inventory', n.inventory_item_id, 'Item');
  const remaining = n.required_quantity - n.fulfilled_quantity - reserved(n.id);
  if (q > it.stock) throw new E(`Only ${it.stock} ${it.unit} of ${it.name} in stock`);
  if (q > remaining) throw new E(`This need only has ${remaining} ${it.unit} left unreserved`);
  it.stock -= q;
  const d = { id: nextId('dispatches'), camp_id: camp.id, need_id: n.id, quantity: q, status: 'Pending' };
  db.dispatches.push(d); return d;
}
function setStatus(d, s) {
  const allowed = { Pending: ['In Transit', 'Cancelled'], 'In Transit': ['Delivered', 'Cancelled'] };
  if (!allowed[d.status]?.includes(s)) throw new E(`Cannot change ${d.status} dispatch to ${s}`);
  const n = db.needs.find(x => x.id == d.need_id);
  if (s === 'Delivered' && n) n.fulfilled_quantity += d.quantity;
  if (s === 'Cancelled') { const it = n && db.inventory.find(i => i.id == n.inventory_item_id); if (it) it.stock += d.quantity; }
  d.status = s; return d;
}
function donate(b) {
  if (!['Cash', 'In-Kind'].includes(b.type)) throw new E('Type must be Cash or In-Kind');
  const d = { id: nextId('donations'), type: b.type, amount_or_quantity: int(b.amount_or_quantity, 'Amount / quantity', 1), item_id: null, category: '', donor: String(b.donor || 'Anonymous').trim() || 'Anonymous' };
  if (b.type === 'In-Kind') { const it = get('inventory', b.item_id, 'Item'); it.stock += d.amount_or_quantity; d.item_id = it.id; d.category = it.category; }
  else d.category = str(b.category, 'Category');
  db.donations.push(d); return d;
}
const send = (res, code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); res.end(JSON.stringify(data)); };
http.createServer((req, res) => {
  let raw = ''; req.on('data', c => raw += c);
  req.on('end', () => {
    const p = new URL(req.url, 'http://x').pathname.split('/').filter(Boolean);
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (p[0] !== 'api') return fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, d) => { res.writeHead(e ? 404 : 200, { 'Content-Type': 'text/html' }); res.end(d); });
    try {
      const [, col, id] = p, m = req.method, role = tokens.get(req.headers['x-token']) || 'volunteer';
      if (col === 'reset' && m === 'POST') { if (role !== 'admin' && req.headers['x-pin'] !== PIN) throw new E('Only the Relief Coordinator (Admin) can restore demo data', 403); db = require('./seed')(); save(); return send(res, 200, { reset: true }); }
      if (col !== 'login' && !db[col]) throw new E('Unknown collection', 404);
      if (m === 'GET') return send(res, 200, id ? get(col, id, col) : db[col]);
      const b = raw ? JSON.parse(raw) : {};
      if (col === 'login' && m === 'POST') {
        if (b.role === 'admin' && String(b.pin) !== PIN) throw new E('Wrong PIN', 401);
        if (!['admin', 'volunteer'].includes(b.role)) throw new E('Unknown role');
        const t = require('crypto').randomUUID(); tokens.set(t, b.role); return send(res, 200, { token: t, role: b.role });
      }
      const ik = m === 'POST' && req.headers['x-idem'];
      if (ik && idem.has(ik)) return send(res, idem.get(ik).code, idem.get(ik).out);
      if (role !== 'admin' && m !== 'GET' && !(col === 'camps' && m === 'PATCH')) throw new E('Only the Relief Coordinator (Admin) can do this', 403);
      if (role !== 'admin' && (m === 'DELETE' || ['inventory', 'needs'].includes(col) || (col === 'camps' && (m === 'POST' || Object.keys(b).some(k => k !== 'current_families')))))
        throw new E('Only the Relief Coordinator (Admin) can do this', 403);
      let out, code = 200;
      if (m === 'POST') {
        code = 201;
        if (col === 'dispatches') out = dispatch(b);
        else if (col === 'donations') out = donate(b);
        else { out = make[col](b); out.id = nextId(col); db[col].push(out); }
      } else if (m === 'PUT' || m === 'PATCH') {
        const o = get(col, id, col);
        if (col === 'dispatches') out = setStatus(o, b.status);
        else if (col === 'donations') throw new E('Donations are an append-only ledger', 405);
        else {
          const n = make[col](b, o);
          if (col === 'camps' && n.status === 'Closed') db.volunteers.forEach(v => { if (v.camp_id == o.id) v.camp_id = null; });
          out = Object.assign(o, n);
        }
      } else if (m === 'DELETE') {
        const o = get(col, id, col);
        if (['dispatches', 'donations'].includes(col)) throw new E('Ledger records cannot be deleted', 405);
        if (col === 'inventory' && db.needs.some(n => n.inventory_item_id == o.id)) throw new E('Item is used by camp needs');
        if (col === 'needs' && reserved(o.id)) throw new E('Need has Pending/In Transit dispatches');
        if (col === 'camps') {
          if (db.dispatches.some(d => d.camp_id == o.id && ACTIVE.includes(d.status))) throw new E('Camp has Pending/In Transit dispatches');
          db.needs = db.needs.filter(n => n.camp_id != o.id);
          db.volunteers.forEach(v => { if (v.camp_id == o.id) v.camp_id = null; });
        }
        db[col] = db[col].filter(x => x.id != o.id); out = { deleted: true };
      } else throw new E('Method not allowed', 405);
      save(); if (ik) { idem.set(ik, { code, out }); if (idem.size > 500) idem.delete(idem.keys().next().value); } send(res, code, out);
    } catch (e) { send(res, e instanceof E ? e.c : e instanceof SyntaxError ? 400 : 500, { error: e.message }); }
  });
}).listen(PORT, () => console.log(`ReliefHub running at http://localhost:${PORT}`));