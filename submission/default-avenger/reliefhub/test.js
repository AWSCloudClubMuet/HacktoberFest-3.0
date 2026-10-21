// End-to-end workflow test against the running API (npm start). It can also bootstrap a local JSON server when needed.
const fs = require('fs'), { spawn } = require('child_process');
const BASE = process.env.API || 'http://localhost:3000';
const realFetch = fetch;
const waitForServer = async (timeoutMs = 20000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await realFetch(BASE + '/camps');
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${BASE} in time.`);
};
const ensureServer = async () => {
  try {
    const res = await realFetch(BASE + '/camps');
    if (res.ok) return;
  } catch {}

  const child = spawn('npx', ['json-server', '--watch', 'db.json', '--static', './public', '--port', '3000'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });
  process.on('exit', () => child.kill());
  process.on('SIGINT', () => { child.kill(); process.exit(); });
  await waitForServer();
};

(async () => {
  await ensureServer();
  global.fetch = (u, o) => realFetch(BASE + u, o);
  const { DB, Svc, Session } = new Function(fs.readFileSync('public/js/services.js', 'utf8') + '; return {DB,Svc,Session}')();
  let pass = 0, fail = 0;
  const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };
  const rejects = async (p, m) => { try { await p; ok(false, m + ' (no error!)'); } catch (e) { ok(true, m + ' → "' + e.message.slice(0, 70) + '"'); } };
  const items = await DB.list('inventory'), c = {};
  for (const k of ['camps','inventory','needs','dispatches','donations','volunteers']) c[k] = (await DB.list(k)).length;
  console.log('Seed counts', c);
  ok(c.camps >= 8 && c.inventory >= 12 && c.needs >= 20 && c.dispatches >= 10 && c.donations >= 10 && c.volunteers >= 15, 'seed minimums met');
  ok(items.filter(i => i.stock <= i.reorder).length >= 2, '≥2 low-stock items');
  const needs = await DB.list('needs');
  ok(needs.filter(n => n.priority === 'High' && n.fulfilled / n.required < .4).length >= 3, '≥3 critical gaps');
  ok(new Set((await DB.list('camps')).map(x => x.district)).size === 4, '4 districts');

  Session.user = await Svc.login('admin', 'admin123'); ok(Session.user.role === 'admin', 'admin login');
  await rejects(Svc.login('admin', 'bad'), 'bad login rejected');

  console.log('Camps');
  await Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '9', status: 'Active' });
  let t = (await DB.list('camps', '?name=Test Camp'))[0]; ok(t.status === 'Active', 'created Active');
  await Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '10', status: 'Active' }, t);
  t = await DB.get('camps', t.id); ok(t.status === 'Full', 'auto Full at capacity');
  await Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '5', status: 'Active' }, t);
  ok((await DB.get('camps', t.id)).status === 'Active', 'reverts to Active below capacity');
  await rejects(Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '11', status: 'Active' }, t), 'families > capacity blocked');
  await rejects(Svc.saveCamp({ name: 'x', district: 'Sukkur', capacity: '10', families: '1' }), 'short name blocked');
  await rejects(Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '1' }), 'duplicate camp blocked');

  console.log('Needs / dispatch');
  const item = (await DB.list('inventory', '?name=Mosquito Nets'))[0];
  await Svc.saveNeed({ campId: t.id, itemId: item.id, required: '50', priority: 'High' });
  const need = (await DB.list('needs', `?campId=${t.id}`))[0];
  await rejects(Svc.saveNeed({ campId: t.id, itemId: item.id, required: '5', priority: 'Low' }), 'duplicate need blocked');
  await Svc.createDispatch({ needId: need.id, qty: '30', driver: 'Truck T-1', date: '2026-09-10' });
  ok((await DB.get('inventory', item.id)).stock === item.stock - 30, 'stock reserved immediately');
  await rejects(Svc.createDispatch({ needId: need.id, qty: '21', driver: 'Truck T-2', date: '2026-09-10' }), 'over-allocation blocked');
  await rejects(Svc.createDispatch({ needId: need.id, qty: '-1', driver: 'Truck T-2', date: '2026-09-10' }), 'negative qty blocked');
  const d = (await DB.list('dispatches', `?needId=${need.id}`))[0];
  await Svc.setDispatchStatus(d.id, 'In Transit');
  await rejects(Svc.setDispatchStatus(d.id, 'Pending'), 'invalid transition blocked');
  await Svc.setDispatchStatus(d.id, 'Cancelled');
  ok((await DB.get('inventory', item.id)).stock === item.stock, 'cancel restores stock');
  await Svc.createDispatch({ needId: need.id, qty: '50', driver: 'Truck T-3', date: '2026-09-10' });
  const d2 = (await DB.list('dispatches', `?needId=${need.id}&status=Pending`))[0];
  await Svc.setDispatchStatus(d2.id, 'In Transit'); await Svc.setDispatchStatus(d2.id, 'Delivered');
  ok((await DB.get('needs', need.id)).fulfilled === 50, 'delivery increases fulfilment (50/50)');
  await rejects(Svc.setDispatchStatus(d2.id, 'Cancelled'), 'delivered cannot be cancelled');
  const big = (await DB.list('needs', '?campId=5&itemId=1'))[0];
  await rejects(Svc.createDispatch({ needId: big.id, qty: '99999', driver: 'Truck', date: '2026-09-10' }), 'over-dispatch blocked');
  const low = (await DB.list('inventory', '?name=First Aid Kits'))[0], aidNeed = (await DB.list('needs', '?itemId=' + low.id))[0];
  await rejects(Svc.createDispatch({ needId: aidNeed.id, qty: '30', driver: 'Truck', date: '2026-09-10' }), 'insufficient stock blocked');
  const closedNeedCamp = (await DB.list('camps', '?status=Closed'))[0];
  await rejects(Svc.saveNeed({ campId: closedNeedCamp.id, itemId: item.id, required: '5', priority: 'Low' }), 'need on Closed camp blocked');

  console.log('Donations');
  await Svc.donateCash({ donor: 'Test Donor', amount: '1000', date: '2026-09-10' });
  const before = (await DB.get('inventory', 1)).stock;
  await Svc.donateInKind({ donor: 'Test Donor', itemId: '1', qty: '25', date: '2026-09-10' });
  ok((await DB.get('inventory', 1)).stock === before + 25, 'in-kind adds to inventory');
  await rejects(Svc.donateCash({ donor: 'X Y', amount: '0', date: '2026-09-10' }), 'zero amount blocked');

  console.log('Volunteers');
  await Svc.saveVolunteer({ name: 'Test Volunteer', skill: 'Medical', phone: '0345-1112223' });
  const v = (await DB.list('volunteers', '?name=Test Volunteer'))[0];
  await rejects(Svc.saveVolunteer({ name: 'Other Person', skill: 'Medical', phone: '0345-1112223' }), 'duplicate phone blocked');
  await rejects(Svc.assign(v.id, closedNeedCamp.id), 'assign to Closed camp blocked');
  await Svc.assign(v.id, t.id); ok((await DB.get('volunteers', v.id)).campId === t.id, 'assigned');
  await rejects(Svc.assign(v.id, 1), 'second assignment blocked');
  ok((await DB.list('volunteers', '?skill=Medical')).length >= 4, 'skill filter via API');
  await Svc.saveCamp({ name: 'Test Camp', district: 'Sukkur', capacity: '10', families: '5', status: 'Closed' }, await DB.get('camps', t.id));
  ok((await DB.get('volunteers', v.id)).campId === null, 'closing camp releases volunteers');

  console.log('Roles');
  Session.user = await Svc.login('volunteer', 'field123');
  await rejects(Svc.saveItem({ name: 'Nope item', category: 'Food', unit: 'kg', stock: 1, reorder: 1 }), 'volunteer cannot add inventory');
  await Svc.saveCamp({ families: '3' }, await DB.get('camps', 1)); ok((await DB.get('camps', 1)).families === 3, 'volunteer can update families');
  await Svc.saveCamp({ families: '320' }, await DB.get('camps', 1));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
