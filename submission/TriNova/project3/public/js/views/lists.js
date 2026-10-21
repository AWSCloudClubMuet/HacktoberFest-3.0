/* Shared list helper (window.Common) + Inventory, Volunteers and Donations screens. */
(function () {
  'use strict';
  const { esc, toast, formModal, confirmBox } = window.UI;
  const L = window.Logic;
  const A = window.Api;

  // ---------------------------------------------------------------- helpers
  const PILL = {
    ok: 'background:#d5f5e3;color:#1e8449', warn: 'background:#fdebd0;color:#b9770e',
    bad: 'background:#fadbd8;color:#c0392b', mute: 'background:#e5e8eb;color:#66727f',
  };
  const pill = (text, kind) => `<span class="badge" style="${PILL[kind] || PILL.mute}">${esc(text)}</span>`;
  const bar = (pct, cls) =>
    `<div class="bar"><span class="${cls || ''}" style="width:${Math.max(0, Math.min(100, pct))}%"></span></div>`;
  const byId = (list, id) => (list || []).find((x) => x.id === Number(id));
  const fetchAll = async (names) => {
    const out = {};
    const results = await Promise.all(names.map((n) => A.get('/api/' + n)));
    names.forEach((n, i) => { out[n] = results[i]; });
    return out;
  };
  const campLabel = (c) => `${c.id} - ${c.name}`;
  const itemLabel = (i) => `${i.id} - ${i.name}`;
  const parseId = (s) => { const n = parseInt(s, 10); return Number.isNaN(n) ? '' : String(n); };
  const card = (value, label) =>
    `<div class="card" style="padding:14px 16px"><div style="font-size:24px;font-weight:700">${esc(value)}</div>` +
    `<div class="muted">${esc(label)}</div></div>`;
  const cardGrid = (html) =>
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:14px">${html}</div>`;

  /**
   * Generic list screen: search/filter toolbar, table, add/edit form, delete, custom row actions.
   * cfg: title, noun, endpoint, addLabel, search, sort, order, filter{param,all,options},
   *      canAdd(role), canEdit(role,row), canDelete(role,row), extraActions(row,role,ctx),
   *      onAction(act,row,ctx)->message, columns[{label,render(row,ctx)}], loadCtx(), summary(rows,ctx),
   *      fields(row,ctx), normalize(values,ctx), validate(values,ctx)->{ok,errors,value}, payload(value,row,ctx)
   */
  function crudView(cfg) {
    const state = { search: '', filter: '' };

    async function render(container) {
      const role = A.getRole();
      container.innerHTML = `
        <div class="page-head"><h1>${esc(cfg.title)}</h1>
          ${cfg.canAdd(role) ? `<button class="btn" id="addBtn">+ ${esc(cfg.addLabel)}</button>` : ''}</div>
        <div id="summary"></div>
        <div class="toolbar">
          ${cfg.search === false ? '' : `<input type="search" id="q" placeholder="${esc(cfg.search || 'Search')}" aria-label="Search" value="${esc(state.search)}">`}
          ${cfg.filter ? `<select id="flt" aria-label="Filter"><option value="">${esc(cfg.filter.all)}</option>` +
            cfg.filter.options.map((o) => `<option value="${esc(o)}"${state.filter === o ? ' selected' : ''}>${esc(o)}</option>`).join('') + '</select>' : ''}
        </div>
        <div class="card table-wrap" id="tbl"><div class="loading">Loading...</div></div>`;

      const tbl = container.querySelector('#tbl');
      const summary = container.querySelector('#summary');
      let rows = [];
      let ctx = {};

      function buttons(row) {
        const list = cfg.extraActions ? cfg.extraActions(row, role, ctx).slice() : [];
        if (cfg.canEdit && cfg.canEdit(role, row)) list.push({ act: 'edit', label: 'Edit', cls: 'secondary' });
        if (cfg.canDelete && cfg.canDelete(role, row)) list.push({ act: 'delete', label: 'Delete', cls: 'danger' });
        if (!list.length) return '<span class="muted">View only</span>';
        return list.map((a) =>
          `<button class="btn small ${a.cls || 'secondary'}" data-act="${esc(a.act)}" data-id="${row.id}">${esc(a.label)}</button>`).join('');
      }

      async function load() {
        const p = new URLSearchParams();
        if (state.search.trim()) p.set('q', state.search.trim());
        if (cfg.filter && state.filter) p.set(cfg.filter.param, state.filter);
        if (cfg.sort) { p.set('_sort', cfg.sort); if (cfg.order) p.set('_order', cfg.order); }
        try {
          const got = await Promise.all([A.get('/api/' + cfg.endpoint + '?' + p.toString()), cfg.loadCtx ? cfg.loadCtx() : {}]);
          rows = got[0];
          ctx = got[1];
        } catch (err) {
          tbl.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
          return;
        }
        summary.innerHTML = cfg.summary ? cfg.summary(rows, ctx) : '';
        if (!rows.length) { tbl.innerHTML = '<div class="empty">Nothing here yet.</div>'; return; }
        tbl.innerHTML = '<table><thead><tr>' + cfg.columns.map((c) => `<th>${esc(c.label)}</th>`).join('') +
          '<th>Actions</th></tr></thead><tbody>' +
          rows.map((r) => '<tr>' + cfg.columns.map((c) => `<td>${c.render(r, ctx)}</td>`).join('') +
            `<td><div style="display:flex;gap:6px;flex-wrap:wrap">${buttons(r)}</div></td></tr>`).join('') +
          '</tbody></table>';
      }

      function check(values) {
        const v = cfg.normalize ? cfg.normalize(values, ctx) : values;
        return cfg.validate(v, ctx);
      }

      function openForm(row) {
        formModal({
          title: (row ? 'Edit ' : 'Add ') + cfg.noun,
          submitLabel: row ? 'Save changes' : 'Add',
          fields: cfg.fields(row, ctx),
          validate: check,
          onSubmit: async (values) => {
            const res = check(values);
            const payload = cfg.payload ? cfg.payload(res.value, row, ctx) : res.value;
            if (row) await A.put(`/api/${cfg.endpoint}/${row.id}`, payload);
            else await A.post('/api/' + cfg.endpoint, payload);
            toast(row ? 'Saved' : 'Added', 'ok');
            load();
          },
        });
      }

      let timer;
      const q = container.querySelector('#q');
      if (q) q.addEventListener('input', (e) => { state.search = e.target.value; clearTimeout(timer); timer = setTimeout(load, 250); });
      const flt = container.querySelector('#flt');
      if (flt) flt.addEventListener('change', (e) => { state.filter = e.target.value; load(); });
      const add = container.querySelector('#addBtn');
      if (add) add.addEventListener('click', () => openForm(null));

      tbl.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const row = rows.find((r) => r.id === Number(b.dataset.id));
        if (!row) return;
        const act = b.dataset.act;
        if (act === 'edit') return openForm(row);
        if (act === 'delete') {
          const ok = await confirmBox('Delete ' + cfg.noun, 'Delete this record? This cannot be undone.');
          if (!ok) return;
          try { await A.del(`/api/${cfg.endpoint}/${row.id}`); toast('Deleted', 'ok'); load(); }
          catch (err) { toast(err.message, 'error'); }
          return;
        }
        if (cfg.onAction) {
          try { const msg = await cfg.onAction(act, row, ctx); if (msg) toast(msg, 'ok'); load(); }
          catch (err) { toast(err.message, 'error'); }
        }
      });

      await load();
    }
    return { render };
  }

  window.Common = { crudView, pill, bar, byId, fetchAll, campLabel, itemLabel, parseId, card, cardGrid };
  window.Views = window.Views || {};

  // ---------------------------------------------------------------- Inventory
  window.Views.inventory = crudView({
    title: 'Inventory', noun: 'item', endpoint: 'inventory', addLabel: 'Add item',
    search: 'Search by item or category', sort: 'name',
    filter: { param: 'category', all: 'All categories', options: L.CATEGORIES },
    canAdd: (r) => L.can(r, 'inventory.create'),
    canEdit: (r) => L.can(r, 'inventory.edit'),
    canDelete: (r) => L.can(r, 'inventory.delete'),
    columns: [
      { label: 'Item', render: (i) => `<strong>${esc(i.name)}</strong>` },
      { label: 'Category', render: (i) => esc(i.category) },
      { label: 'Stock', render: (i) => `${esc(i.stock)} ${esc(i.unit)}` },
      { label: 'Reorder level', render: (i) => esc(i.reorder_level) },
      { label: 'Status', render: (i) => (L.isLowStock(i) ? pill('Low stock', 'bad') : pill('In stock', 'ok')) },
    ],
    fields: (i) => [
      { name: 'name', label: 'Item name', value: i ? i.name : '' },
      { name: 'category', label: 'Category', type: 'select', options: L.CATEGORIES, value: i ? i.category : L.CATEGORIES[0] },
      { name: 'unit', label: 'Unit (e.g. kg, packs)', value: i ? i.unit : '' },
      { name: 'stock', label: 'Stock', type: 'number', min: 0, value: i ? i.stock : 0 },
      { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0, value: i ? i.reorder_level : 0 },
    ],
    validate: (v) => L.validateInventory(v),
  });

  // ---------------------------------------------------------------- Volunteers
  window.Views.volunteers = crudView({
    title: 'Volunteers', noun: 'volunteer', endpoint: 'volunteers', addLabel: 'Register volunteer',
    search: 'Search by name or skill', sort: 'name',
    filter: { param: 'skill', all: 'All skills', options: L.SKILLS },
    loadCtx: () => fetchAll(['camps']),
    canAdd: (r) => L.can(r, 'volunteer.register'),
    canEdit: (r) => L.can(r, 'volunteer.edit'),
    canDelete: (r) => L.can(r, 'volunteer.delete'),
    columns: [
      { label: 'Name', render: (v) => `<strong>${esc(v.name)}</strong>` },
      { label: 'Skill', render: (v) => esc(v.skill) },
      { label: 'Deployed at', render: (v, ctx) => {
        const c = byId(ctx.camps, v.camp_id);
        return v.camp_id === null || v.camp_id === undefined ? pill('Unassigned', 'mute') : esc(c ? c.name : 'Camp #' + v.camp_id);
      } },
    ],
    fields: (v, ctx) => {
      const c = v ? byId(ctx.camps, v.camp_id) : null;
      return [
        { name: 'name', label: 'Name', value: v ? v.name : '' },
        { name: 'skill', label: 'Skill', type: 'select', options: L.SKILLS, value: v ? v.skill : L.SKILLS[0] },
        { name: 'camp_id', label: 'Deployed at', type: 'select',
          options: ['Unassigned'].concat(ctx.camps.map(campLabel)), value: c ? campLabel(c) : 'Unassigned' },
      ];
    },
    normalize: (v) => ({ ...v, camp_id: v.camp_id === 'Unassigned' ? '' : parseId(v.camp_id) }),
    validate: (v) => L.validateVolunteer(v),
  });

  // ---------------------------------------------------------------- Donations
  window.Views.donations = crudView({
    title: 'Donations', noun: 'donation', endpoint: 'donations', addLabel: 'Record donation',
    search: 'Search by donor or category',
    filter: { param: 'type', all: 'Cash and In-Kind', options: L.DONATION_TYPES },
    loadCtx: () => fetchAll(['inventory']),
    canAdd: (r) => L.can(r, 'donation.create'),
    canDelete: (r) => L.can(r, 'donation.delete'),
    summary: (rows) => {
      const t = L.donationTotals(rows);
      return cardGrid(card(t.cashTotal.toLocaleString(), 'Cash donated') + card(t.cashCount, 'Cash donations') +
        card(t.inKindCount, 'In-kind donations'));
    },
    columns: [
      { label: 'Type', render: (d) => pill(d.type, d.type === 'Cash' ? 'ok' : 'warn') },
      { label: 'Donor', render: (d) => esc(d.donor || 'Anonymous') },
      { label: 'Category', render: (d) => esc(d.category) },
      { label: 'Amount / Quantity', render: (d, ctx) => {
        if (d.type === 'Cash') return Number(d.amount_or_quantity).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const item = byId(ctx.inventory, d.item_id);
        return `${esc(d.amount_or_quantity)} ${item ? esc(item.unit + ' ' + item.name) : ''}`;
      } },
    ],
    fields: (d, ctx) => [
      { name: 'type', label: 'Type', type: 'select', options: L.DONATION_TYPES, value: 'Cash' },
      { name: 'donor', label: 'Donor (optional)', value: '' },
      { name: 'category', label: 'Category', type: 'select', options: L.DONATION_CATEGORIES, value: 'General' },
      { name: 'amount_or_quantity', label: 'Amount (Cash) or Quantity (In-Kind)', type: 'number', min: 0, value: '' },
      { name: 'item_id', label: 'Item donated (In-Kind only)', type: 'select',
        options: ['None'].concat(ctx.inventory.map(itemLabel)), value: 'None' },
    ],
    normalize: (v) => ({ ...v, item_id: v.item_id === 'None' ? '' : parseId(v.item_id) }),
    validate: (v) => L.validateDonation(v),
    payload: (value, row, ctx) => {
      const item = value.item_id !== null ? byId(ctx.inventory, value.item_id) : null;
      return { ...value, category: value.type === 'In-Kind' && item ? item.category : value.category };
    },
  });
})();