/* ReliefHub pages + user actions. Every read/write goes through DB/Svc (REST calls to JSON Server). */
const pages = {};
let onFilter = null;
const load = (...c) => Promise.all(c.map(x => DB.list(x)));
const byId = (a, id) => a.find(x => x.id == id);
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
const isLow = i => i.stock <= i.reorder;
const needAlloc = (ds, id) => allocated(ds.filter(d => d.needId == id));
const campLink = c => c ? `<a href="#/needs/${c.id}">${esc(c.name)}</a>` : '—';
const itemLabel = i => i ? `${esc(i.name)} <small class="muted">${esc(i.category)}</small>` : '—';

/* ---------------- Dashboard ---------------- */
pages.dashboard = async () => {
  const [camps, inv, needs, vols, ds] = await load('camps', 'inventory', 'needs', 'volunteers', 'dispatches');
  const open = camps.filter(c => c.status !== 'Closed');
  const rq = sum(needs, 'required'), fl = sum(needs, 'fulfilled'), low = inv.filter(isLow);
  const cats = {};
  needs.forEach(n => { const i = byId(inv, n.itemId); if (!i) return; const c = cats[i.category] ??= { r: 0, f: 0 }; c.r += n.required; c.f += n.fulfilled; });
  const gaps = needs.filter(n => n.priority === 'High' && n.fulfilled / n.required < 0.4).sort((a, b) => a.fulfilled / a.required - b.fulfilled / b.required);
  const campStates = ['Active', 'Full', 'Closed'].map(status => ({ status, count: camps.filter(c => c.status === status).length }));
  const campTotal = camps.length || 1;
  const deployed = vols.filter(v => v.campId).length;
  const movingDispatches = ds.filter(d => d.status === 'Pending' || d.status === 'In Transit')
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const activeDispatches = ds.filter(d => d.status === 'In Transit').length;
  const recentDispatches = movingDispatches.slice(0, 3);
  const alerts = gaps.length + low.length;
  $('#alertCount').textContent = alerts;
  $('#alertCount').hidden = alerts === 0;
  $('#criticalNotificationCount').textContent = gaps.length;
  $('#stockNotificationCount').textContent = low.length;
  const role = isAdmin() ? 'Relief Coordinator — full access to all modules.' : 'Field Volunteer — update camp headcounts and move dispatches In Transit / Delivered.';
  view().innerHTML = head('Dashboard', `Welcome, ${Session.user.name}. ${role}`) +
    `<div class="kpis">${kpi('⛺', 'Active camps', open.length, `${camps.length - open.length} closed`)}${kpi('👨‍👩‍👧', 'Families sheltered', fmt(sum(open, 'families')), `of ${fmt(sum(open, 'capacity'))} capacity`)}${kpi('📈', 'Need fulfilment', pct(fl, rq) + '%', `${fmt(fl)} of ${fmt(rq)} units delivered`)}${kpi('⚠️', 'Low-stock items', low.length, low.length ? 'reorder required' : 'all healthy', low.length ? 'warn' : '')}${kpi('🧑‍🤝‍🧑', 'Volunteers deployed', vols.filter(v => v.campId).length, `of ${vols.length} registered`)}</div>
    <section class="field-live" aria-label="Live field situation">
      <div class="field-photos">
        <figure class="field-photo field-photo-primary">
          <img src="assets/relief-distribution.jpg" alt="Relief volunteers preparing donated supply boxes for distribution" loading="eager">
          <figcaption class="photo-caption"><span class="photo-tag"><i></i> ILLUSTRATIVE FIELD PHOTO</span><h2>Relief, coordinated with care.</h2><p>One connected view of the response across Sindh.</p></figcaption>
        </figure>
        <div class="field-photo-pair">
          <figure class="field-photo"><img src="assets/community-relief.jpg" alt="Community members working together during a relief effort" loading="eager"><figcaption>Community support <span>Illustrative</span></figcaption></figure>
          <figure class="field-photo"><img src="assets/field-support.jpg" alt="A humanitarian volunteer connecting with a community member" loading="eager"><figcaption>People first <span>Illustrative</span></figcaption></figure>
        </div>
        <a class="photo-credit" href="https://unsplash.com/license" target="_blank" rel="noreferrer">Representative photography · Unsplash license</a>
      </div>
      <div class="field-brief">
        <div class="card-heading"><div><span class="eyebrow">LIVE OPERATIONS</span><h2>Situation at a glance</h2></div><span class="live-pill"><i></i> DATA LIVE</span></div>
        <div class="live-metrics">
          <div><span>Open camps</span><strong>${fmt(open.length)}</strong></div>
          <div><span>Families sheltered</span><strong>${fmt(sum(open, 'families'))}</strong></div>
          <div><span>Dispatches in transit</span><strong>${fmt(activeDispatches)}</strong></div>
          <div><span>Available volunteers</span><strong>${fmt(vols.length - deployed)}</strong></div>
        </div>
        <div class="activity-heading"><span class="eyebrow">MOVING SUPPLIES</span><a href="#/dispatches">View dispatches <span aria-hidden="true">→</span></a></div>
        ${recentDispatches.length ? `<div class="live-activity">${recentDispatches.map(d => {
          const c = byId(camps, d.campId), i = byId(inv, d.itemId);
          return `<a class="activity-row" href="#/dispatches"><span class="activity-pulse ${d.status === 'In Transit' ? 'moving' : ''}"></span><span class="activity-copy"><strong>${esc(i?.name || 'Supply dispatch')}</strong><small>${esc(c?.district || 'Sindh')} · ${fmt(d.qty)} ${esc(i?.unit || 'units')}</small></span>${badge(d.status)}</a>`;
        }).join('')}</div>` : empty('No open dispatches', 'New supply movements will appear here.') }
        <p class="photo-disclaimer">Operational figures are loaded from the ReliefHub API. Photos are representative imagery, not live field reports.</p>
      </div>
    </section>
    <div class="grid2"><section class="card"><h2>Fulfilment by inventory category</h2>
      <div class="chart">${Object.entries(cats).map(([k, c]) => { const p = pct(c.f, c.r); return `<div class="col"><span class="v">${p}%</span><div class="barv"><i style="height:${p}%" class="${p < 40 ? 'low' : p < 75 ? 'mid' : 'ok'}"></i></div><span class="l">${esc(k)}</span></div>`; }).join('')}</div></section>
      <section class="card"><div class="card-heading"><div><span class="eyebrow">SUPPLY WATCH</span><h2>Low-stock alerts</h2></div><a class="text-link" href="#/inventory">View inventory <span aria-hidden="true">→</span></a></div>${low.length ? `<ul class="list">${low.map(i => `<li><span>${esc(i.name)}</span><b>${fmt(i.stock)} / ${fmt(i.reorder)} ${esc(i.unit)}</b></li>`).join('')}</ul>` : empty('Stock levels healthy')}</section></div>
    <div class="grid2"><section class="card"><div class="card-heading"><div><span class="eyebrow">FIELD OVERVIEW</span><h2>Camp status</h2></div><span class="muted">${camps.length} registered</span></div>
      <div class="status-stack" role="img" aria-label="${campStates.map(s => `${s.count} ${s.status.toLowerCase()} camps`).join(', ')}">${campStates.map(s => `<span class="status-segment ${s.status.toLowerCase()}" style="width:${s.count / campTotal * 100}%"></span>`).join('')}</div>
      <div class="status-legend">${campStates.map(s => `<div><span class="legend-key ${s.status.toLowerCase()}"></span><span>${s.status}</span><strong>${s.count}</strong></div>`).join('')}</div>
      <p class="insight-note">Camp status is based on current capacity and operating state.</p></section>
      <section class="card"><div class="card-heading"><div><span class="eyebrow">PRIORITY RESPONSE</span><h2>Critical gaps</h2></div><span class="gap-count">${gaps.length} open</span></div><p class="section-note">High-priority needs below 40% fulfilment, worst first</p>${gaps.length ? table(['Camp', 'Item', 'Required', 'Delivered', 'Fulfilment'], gaps.map(n => { const i = byId(inv, n.itemId); return [campLink(byId(camps, n.campId)), esc(i?.name), `${fmt(n.required)} ${esc(i?.unit)}`, fmt(n.fulfilled), bar(pct(n.fulfilled, n.required))]; })) : empty('No critical gaps', 'All high-priority needs are at 40% or better.')}</section></div>`;
};

/* ---------------- Camps ---------------- */
const campFields = ex => isAdmin() ? [
  { name: 'name', label: 'Camp name', value: ex?.name },
  { name: 'district', label: 'District', options: DISTRICTS, value: ex?.district },
  { name: 'capacity', label: 'Capacity (families)', type: 'number', min: 1, value: ex?.capacity },
  { name: 'families', label: 'Current families', type: 'number', min: 0, value: ex?.families ?? 0 },
  { name: 'status', label: 'Status', hint: '(Full is applied automatically at capacity)', options: ['Active', 'Closed'], value: ex?.status === 'Closed' ? 'Closed' : 'Active' },
] : [{ name: 'families', label: `Current families at ${ex.name} (capacity ${ex.capacity})`, type: 'number', min: 0, value: ex.families }];

pages.camps = async () => {
  view().innerHTML = head('Relief camps', 'Shelters across flood-affected districts of Sindh', isAdmin() ? btn('camp-add', '＋ Add camp') : '') +
    `<div class="toolbar">${input('camps', 'q', 'Search camp or district…')}${select('camps', 'district', DISTRICTS.slice(0, 4), 'All districts')}${select('camps', 'status', ['Active', 'Full', 'Closed'], 'All statuses')}</div><div id="list">${loading()}</div>`;
  onFilter = async () => {
    const f = F.camps, q = new URLSearchParams({ _sort: 'name' });
    ['q', 'district', 'status'].forEach(k => f[k] && q.set(k, f[k]));
    const list = await DB.list('camps', '?' + q);
    $('#list').innerHTML = list.length ? table(['Camp', 'District', 'Families / capacity', 'Status', ''], list.map(c => [
      `<strong>${esc(c.name)}</strong>`, esc(c.district), `${fmt(c.families)} / ${fmt(c.capacity)}${bar(pct(c.families, c.capacity), 'occ')}`, badge(c.status),
      `<div class="acts"><a class="btn sm ghost" href="#/needs/${c.id}">Needs</a>${ab('camp-edit', isAdmin() ? 'Edit' : 'Update families', c.id)}${isAdmin() ? ab('camp-del', 'Delete', c.id, 'danger') : ''}</div>`]))
      : empty('No camps match your filters', 'Try clearing the search or status filter.');
  };
  await onFilter();
};

/* ---------------- Needs ---------------- */
pages.needs = async cid => {
  const [needs, camps, inv, ds] = await load('needs', 'camps', 'inventory', 'dispatches');
  const campOpts = camps.map(c => `<option value="${c.id}"${c.id == cid ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  view().innerHTML = head('Camp needs', 'Required supplies linked to inventory, with fulfilment progress', isAdmin() ? btn('need-add', '＋ Add need', `data-id="${cid || ''}"`) : '') +
    `<div class="toolbar"><select data-nav="needs" aria-label="Camp"><option value="">All camps</option>${campOpts}</select>${select('needs', 'priority', ['High', 'Medium', 'Low'], 'All priorities')}</div><div id="list"></div>`;
  onFilter = () => {
    const rows = needs.filter(n => (!cid || n.campId == cid) && (!F.needs.priority || n.priority === F.needs.priority))
      .sort((a, b) => a.fulfilled / a.required - b.fulfilled / b.required);
    $('#list').innerHTML = rows.length ? table(['Camp', 'Item', 'Required', 'Allocated', 'Fulfilment (delivered)', 'Priority', ''], rows.map(n => {
      const i = byId(inv, n.itemId), c = byId(camps, n.campId), a = needAlloc(ds, n.id);
      return [campLink(c), itemLabel(i), `${fmt(n.required)} ${esc(i?.unit)}`, fmt(a), bar(pct(n.fulfilled, n.required)), badge(n.priority),
        `<div class="acts">${isAdmin() ? ab('disp-add', 'Dispatch', n.id, 'teal') + ab('need-edit', 'Edit', n.id) + ab('need-del', 'Delete', n.id, 'danger') : ''}</div>`];
    })) : empty('No needs recorded', 'Add a need to start tracking supplies for this camp.');
  };
  onFilter();
};

/* ---------------- Inventory ---------------- */
const itemFields = ex => [
  { name: 'name', label: 'Item name', value: ex?.name }, { name: 'category', label: 'Category', options: CATEGORIES, value: ex?.category },
  { name: 'unit', label: 'Unit (bag, kg, box…)', value: ex?.unit }, { name: 'stock', label: 'Stock on hand', type: 'number', min: 0, value: ex?.stock ?? 0 },
  { name: 'reorder', label: 'Reorder level', type: 'number', min: 0, value: ex?.reorder ?? 0 }];

pages.inventory = async () => {
  const inv = await DB.list('inventory', '?_sort=category,name');
  const nLow = inv.filter(isLow).length;
  view().innerHTML = head('Inventory', 'Available stock after dispatch reservations', isAdmin() ? btn('item-add', '＋ Add item') : '') +
    (nLow ? `<div class="alert">⚠ ${nLow} item${nLow > 1 ? 's are' : ' is'} at or below reorder level.</div>` : '') +
    `<div class="toolbar">${input('inv', 'q', 'Search items…')}${select('inv', 'category', CATEGORIES, 'All categories')}${select('inv', 'low', [{ v: '1', l: 'Low stock only' }], 'All stock levels')}</div><div id="list"></div>`;
  onFilter = () => {
    const f = F.inv, rows = inv.filter(i => (!f.q || i.name.toLowerCase().includes(f.q.toLowerCase())) && (!f.category || i.category === f.category) && (!f.low || isLow(i)));
    $('#list').innerHTML = rows.length ? table(['Item', 'Category', 'Stock', 'Reorder level', 'Status', ''], rows.map(i => [`<strong>${esc(i.name)}</strong>`, esc(i.category), `${fmt(i.stock)} ${esc(i.unit)}`, fmt(i.reorder),
      badge(isLow(i) ? 'Low Stock' : 'In Stock'), isAdmin() ? `<div class="acts">${ab('item-edit', 'Edit', i.id)}${ab('item-del', 'Delete', i.id, 'danger')}</div>` : '']))
      : empty('No inventory items found');
  };
  onFilter();
};

/* ---------------- Dispatches ---------------- */
pages.dispatches = async () => {
  const [ds, camps, inv] = await load('dispatches', 'camps', 'inventory');
  view().innerHTML = head('Dispatches', 'Stock is reserved on creation and restored on cancellation', isAdmin() ? btn('disp-add', '＋ New dispatch') : '') +
    `<div class="toolbar">${select('disp', 'status', ['Pending', 'In Transit', 'Delivered', 'Cancelled'], 'All statuses')}</div><div id="list"></div>`;
  onFilter = () => {
    const rows = ds.filter(d => !F.disp.status || d.status === F.disp.status).sort((a, b) => b.id - a.id);
    $('#list').innerHTML = rows.length ? table(['#', 'Camp', 'Item', 'Quantity', 'Status', 'Date', 'Driver / vehicle', ''], rows.map(d => {
      const i = byId(inv, d.itemId), s = d.status;
      return [d.id, campLink(byId(camps, d.campId)), esc(i?.name), `${fmt(d.qty)} ${esc(i?.unit)}`, badge(s), esc(d.date), esc(d.driver),
        `<div class="acts">${s === 'Pending' ? ab('disp-st', 'Start', d.id, 'teal', 'data-to="In Transit"') : ''}${s === 'In Transit' ? ab('disp-st', 'Mark delivered', d.id, 'teal', 'data-to="Delivered"') : ''}${isAdmin() && (s === 'Pending' || s === 'In Transit') ? ab('disp-st', 'Cancel', d.id, 'danger', 'data-to="Cancelled"') : ''}</div>`];
    })) : empty('No dispatches found');
  };
  onFilter();
};

/* ---------------- Donations ---------------- */
pages.donations = async () => {
  const dons = await DB.list('donations', '?_sort=date,id&_order=desc,desc'), inv = await DB.list('inventory');
  const cash = dons.filter(d => d.type === 'Cash'), kind = dons.filter(d => d.type === 'In-Kind');
  const cats = {}; dons.forEach(d => { const c = cats[d.category] ??= { n: 0, t: 0 }; c.n++; c.t += d.type === 'Cash' ? d.amount : d.qty; });
  view().innerHTML = head('Donations', 'Cash and in-kind contributions (in-kind adds to inventory automatically)', isAdmin() ? btn('don-cash', '＋ Cash donation') + btn('don-kind', '＋ In-kind donation', '', 'teal') : '') +
    `<div class="kpis">${kpi('💰', 'Total cash received', pkr(sum(cash, 'amount')), `${cash.length} cash donations`)}${kpi('📦', 'In-kind donations', kind.length, `${fmt(sum(kind, 'qty'))} units received`)}</div>
    <div class="grid2"><section class="card"><h2>Summary by category</h2>${table(['Category', 'Donations', 'Total'], Object.entries(cats).map(([k, c]) => [esc(k), c.n, k === 'Cash' ? pkr(c.t) : fmt(c.t) + ' units']))}</section>
    <section class="card"><h2>Donation log</h2>${dons.length ? table(['Date', 'Donor', 'Type', 'Contribution'], dons.map(d => [esc(d.date), esc(d.donor), badge(d.type), d.type === 'Cash' ? pkr(d.amount) : `${fmt(d.qty)} ${esc(byId(inv, d.itemId)?.unit)} · ${esc(byId(inv, d.itemId)?.name)}`])) : empty('No donations yet')}</section></div>`;
};

/* ---------------- Volunteers ---------------- */
const volFields = ex => [{ name: 'name', label: 'Full name', value: ex?.name }, { name: 'skill', label: 'Skill', options: SKILLS, value: ex?.skill }, { name: 'phone', label: 'Mobile number', hint: '(e.g. 0300-1234567)', type: 'tel', value: ex?.phone }];
pages.volunteers = async () => {
  const camps = await DB.list('camps');
  view().innerHTML = head('Volunteers', 'Register, filter by skill and assign to one camp each', isAdmin() ? btn('vol-add', '＋ Register volunteer') : '') +
    `<div class="toolbar">${input('vol', 'q', 'Search volunteers…')}${select('vol', 'skill', SKILLS, 'All skills')}${select('vol', 'asg', [{ v: 'yes', l: 'Assigned' }, { v: 'no', l: 'Unassigned' }], 'Any assignment')}</div><div id="list">${loading()}</div>`;
  onFilter = async () => {
    const f = F.vol, q = new URLSearchParams({ _sort: 'name' }); f.q && q.set('q', f.q); f.skill && q.set('skill', f.skill);
    const rows = (await DB.list('volunteers', '?' + q)).filter(v => !f.asg || (f.asg === 'yes') === !!v.campId);
    $('#list').innerHTML = rows.length ? table(['Name', 'Skill', 'Phone', 'Assigned camp', ''], rows.map(v => [`<strong>${esc(v.name)}</strong>`, badge(v.skill), esc(v.phone),
      v.campId ? campLink(byId(camps, v.campId)) : '<span class="muted">Unassigned</span>',
      isAdmin() ? `<div class="acts">${v.campId ? ab('vol-un', 'Unassign', v.id) : ab('vol-as', 'Assign', v.id, 'teal')}${ab('vol-edit', 'Edit', v.id)}${ab('vol-del', 'Delete', v.id, 'danger')}</div>` : ''])) : empty('No volunteers match your filters');
  };
  await onFilter();
};

/* ---------------- Actions (data-act handlers) ---------------- */
const dispatchForm = async presetNeed => {
  const [needs, camps, inv, ds] = await load('needs', 'camps', 'inventory', 'dispatches');
  const opts = needs.map(n => ({ n, c: byId(camps, n.campId), i: byId(inv, n.itemId), r: n.required - needAlloc(ds, n.id) })).filter(x => x.c.status !== 'Closed' && x.r > 0)
    .map(x => ({ v: x.n.id, l: `${x.c.name} — ${x.i.name} (unallocated ${x.r}, stock ${x.i.stock} ${x.i.unit})` }));
  if (!opts.length) throw new Error('No open needs with unallocated quantity.');
  formModal({ title: 'New dispatch', label: 'Create & reserve stock', done: 'Dispatch created; stock reserved', save: v => Svc.createDispatch(v), fields: [
    { name: 'needId', label: 'Camp need', options: opts, value: presetNeed }, { name: 'qty', label: 'Quantity', type: 'number', min: 1 },
    { name: 'driver', label: 'Driver / vehicle' }, { name: 'date', label: 'Dispatch date', type: 'date', value: today(), max: today() }] });
};
const del = (msg, fn) => async ({ id }) => { if (await confirmBox(msg)) { await fn(id); toast('Deleted'); refresh(); } };
const ACT = {
  'camp-add': () => formModal({ title: 'Add camp', fields: campFields(), save: v => Svc.saveCamp(v), done: 'Camp created' }),
  'camp-edit': async ({ id }) => { const c = await DB.get('camps', id); formModal({ title: isAdmin() ? 'Edit camp' : 'Update families', fields: campFields(c), save: v => Svc.saveCamp(v, c), done: 'Camp updated' }); },
  'camp-del': del('Delete this camp permanently?', Svc.deleteCamp),
  'need-add': async ({ id }) => {
    const [camps, inv] = await load('camps', 'inventory');
    formModal({ title: 'Add camp need', done: 'Need added', save: v => Svc.saveNeed(v), fields: [
      { name: 'campId', label: 'Camp', options: camps.filter(c => c.status !== 'Closed').map(c => ({ v: c.id, l: c.name })), value: id },
      { name: 'itemId', label: 'Inventory item', options: inv.map(i => ({ v: i.id, l: `${i.name} (${i.unit})` })) },
      { name: 'required', label: 'Required quantity', type: 'number', min: 1 }, { name: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'], value: 'Medium' }] });
  },
  'need-edit': async ({ id }) => { const n = await DB.get('needs', id); formModal({ title: 'Edit need', done: 'Need updated', save: v => Svc.saveNeed(v, n), fields: [
    { name: 'required', label: 'Required quantity', type: 'number', min: 1, value: n.required }, { name: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'], value: n.priority }] }); },
  'need-del': del('Delete this need?', Svc.deleteNeed),
  'item-add': () => formModal({ title: 'Add inventory item', fields: itemFields(), save: v => Svc.saveItem(v), done: 'Item added' }),
  'item-edit': async ({ id }) => { const i = await DB.get('inventory', id); formModal({ title: 'Edit item', fields: itemFields(i), save: v => Svc.saveItem(v, i), done: 'Item updated' }); },
  'item-del': del('Delete this inventory item?', Svc.deleteItem),
  'disp-add': ({ id }) => dispatchForm(id),
  'disp-st': async ({ id, to }) => {
    if (to === 'Cancelled' && !await confirmBox('Cancel this dispatch? Reserved stock will be returned to inventory.')) return;
    await Svc.setDispatchStatus(id, to); toast(`Dispatch marked ${to}`); refresh();
  },
  'don-cash': () => formModal({ title: 'Record cash donation', done: 'Cash donation recorded', save: v => Svc.donateCash(v), fields: [
    { name: 'donor', label: 'Donor name' }, { name: 'amount', label: 'Amount (PKR)', type: 'number', min: 1 }, { name: 'date', label: 'Date', type: 'date', value: today(), max: today() }] }),
  'don-kind': async () => { const inv = await DB.list('inventory'); formModal({ title: 'Record in-kind donation', done: 'In-kind donation recorded; inventory updated', save: v => Svc.donateInKind(v), fields: [
    { name: 'donor', label: 'Donor name' }, { name: 'itemId', label: 'Item', options: inv.map(i => ({ v: i.id, l: `${i.name} (${i.unit})` })) },
    { name: 'qty', label: 'Quantity', type: 'number', min: 1 }, { name: 'date', label: 'Date', type: 'date', value: today(), max: today() }] }); },
  'vol-add': () => formModal({ title: 'Register volunteer', fields: volFields(), save: v => Svc.saveVolunteer(v), done: 'Volunteer registered' }),
  'vol-edit': async ({ id }) => { const v = await DB.get('volunteers', id); formModal({ title: 'Edit volunteer', fields: volFields(v), save: x => Svc.saveVolunteer(x, v), done: 'Volunteer updated' }); },
  'vol-del': del('Delete this volunteer?', Svc.deleteVolunteer),
  'vol-as': async ({ id }) => {
    const camps = (await DB.list('camps')).filter(c => c.status !== 'Closed');
    formModal({ title: 'Assign to camp', label: 'Assign', done: 'Volunteer assigned', save: v => Svc.assign(id, v.campId), fields: [{ name: 'campId', label: 'Camp (Closed camps are not listed)', options: camps.map(c => ({ v: c.id, l: `${c.name} — ${c.district}` })) }] });
  },
  'vol-un': async ({ id }) => { await Svc.unassign(id); toast('Volunteer unassigned'); refresh(); },
};
