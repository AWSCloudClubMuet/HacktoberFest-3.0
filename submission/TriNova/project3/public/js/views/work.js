/* Needs and Dispatches screens. Needs lists.js (window.Common) to be loaded first. */
(function () {
  'use strict';
  const { esc } = window.UI;
  const L = window.Logic;
  const A = window.Api;
  const { crudView, pill, bar, byId, fetchAll, campLabel, itemLabel, parseId } = window.Common;
  window.Views = window.Views || {};

  const PRIORITY_KIND = { High: 'bad', Medium: 'warn', Low: 'mute' };
  const STATUS_KIND = { Pending: 'warn', 'In Transit': 'warn', Delivered: 'ok', Cancelled: 'mute' };

  // ---------------------------------------------------------------- Needs
  window.Views.needs = crudView({
    title: 'Needs', noun: 'need', endpoint: 'needs', addLabel: 'Add need', sort: 'id',
    search: false,
    filter: { param: 'priority', all: 'All priorities', options: L.PRIORITIES },
    loadCtx: () => fetchAll(['camps', 'inventory', 'dispatches']),
    canAdd: (r) => L.can(r, 'need.create'),
    canEdit: (r) => L.can(r, 'need.edit'),
    canDelete: (r) => L.can(r, 'need.delete'),
    columns: [
      { label: 'Camp', render: (n, ctx) => { const c = byId(ctx.camps, n.camp_id); return `<strong>${esc(c ? c.name : '#' + n.camp_id)}</strong>`; } },
      { label: 'Item', render: (n, ctx) => { const i = byId(ctx.inventory, n.inventory_item_id); return esc(i ? i.name : '#' + n.inventory_item_id); } },
      { label: 'Progress', render: (n, ctx) => {
        const m = L.needMetrics(n, ctx.dispatches);
        const i = byId(ctx.inventory, n.inventory_item_id);
        return bar(m.progress, m.progress < L.CRITICAL_THRESHOLD ? 'full' : '') +
          `<div class="muted">${m.fulfilled} / ${m.required} ${esc(i ? i.unit : '')} (${Math.round(m.progress)}%)</div>`;
      } },
      { label: 'On the way', render: (n, ctx) => esc(L.needMetrics(n, ctx.dispatches).reserved) },
      { label: 'Still to send', render: (n, ctx) => esc(L.needMetrics(n, ctx.dispatches).remaining) },
      { label: 'Priority', render: (n) => pill(n.priority, PRIORITY_KIND[n.priority]) },
    ],
    fields: (n, ctx) => {
      const c = n ? byId(ctx.camps, n.camp_id) : null;
      const i = n ? byId(ctx.inventory, n.inventory_item_id) : null;
      return [
        { name: 'camp_id', label: 'Camp', type: 'select', options: ctx.camps.map(campLabel), value: c ? campLabel(c) : '' },
        { name: 'inventory_item_id', label: 'Item needed', type: 'select', options: ctx.inventory.map(itemLabel), value: i ? itemLabel(i) : '' },
        { name: 'required_quantity', label: 'Required quantity', type: 'number', min: 1, value: n ? n.required_quantity : '' },
        { name: 'priority', label: 'Priority', type: 'select', options: L.PRIORITIES, value: n ? n.priority : 'Medium' },
      ];
    },
    normalize: (v) => ({ ...v, camp_id: parseId(v.camp_id), inventory_item_id: parseId(v.inventory_item_id) }),
    validate: (v) => L.validateNeed(v),
    payload: (value, row) => ({ ...value, fulfilled_quantity: row ? Number(row.fulfilled_quantity) || 0 : 0 }),
  });

  // ---------------------------------------------------------------- Dispatches
  function needLabel(n, ctx) {
    const c = byId(ctx.camps, n.camp_id);
    const i = byId(ctx.inventory, n.inventory_item_id);
    const max = i ? L.maxDispatchQty(n, i, ctx.dispatches) : 0;
    return `${n.id} - ${c ? c.name : 'Camp'} / ${i ? i.name : 'Item'} (max ${max} ${i ? i.unit : ''})`;
  }

  window.Views.dispatches = crudView({
    title: 'Dispatches', noun: 'dispatch', endpoint: 'dispatches', addLabel: 'New dispatch',
    sort: 'id', order: 'desc', search: false,
    filter: { param: 'status', all: 'All statuses', options: L.DISPATCH_STATUSES },
    loadCtx: () => fetchAll(['camps', 'inventory', 'needs', 'dispatches']),
    canAdd: (r) => L.can(r, 'dispatch.create'),
    columns: [
      { label: '#', render: (d) => esc(d.id) },
      { label: 'Camp', render: (d, ctx) => {
        const n = byId(ctx.needs, d.need_id);
        const c = byId(ctx.camps, d.camp_id !== undefined ? d.camp_id : n && n.camp_id);
        return `<strong>${esc(c ? c.name : '-')}</strong>`;
      } },
      { label: 'Item', render: (d, ctx) => {
        const n = byId(ctx.needs, d.need_id);
        const i = byId(ctx.inventory, n && n.inventory_item_id);
        return esc(i ? i.name : '-');
      } },
      { label: 'Quantity', render: (d, ctx) => {
        const n = byId(ctx.needs, d.need_id);
        const i = byId(ctx.inventory, n && n.inventory_item_id);
        return `${esc(d.quantity)} ${esc(i ? i.unit : '')}`;
      } },
      { label: 'Status', render: (d) => pill(d.status, STATUS_KIND[d.status]) },
    ],
    extraActions: (d, role) => {
      const out = [];
      if (L.canTransition(d.status, 'In Transit') && L.can(role, 'dispatch.inTransit')) out.push({ act: 'to:In Transit', label: 'Mark in transit', cls: 'secondary' });
      if (L.canTransition(d.status, 'Delivered') && L.can(role, 'dispatch.deliver')) out.push({ act: 'to:Delivered', label: 'Mark delivered' });
      if (L.canTransition(d.status, 'Cancelled') && L.can(role, 'dispatch.cancel')) out.push({ act: 'to:Cancelled', label: 'Cancel', cls: 'danger' });
      return out;
    },
    onAction: async (act, d) => {
      if (!act.startsWith('to:')) return '';
      const status = act.slice(3);
      await A.patch('/api/dispatches/' + d.id, { status });
      return 'Dispatch marked ' + status;
    },
    fields: (d, ctx) => {
      const open = ctx.needs.filter((n) => {
        const c = byId(ctx.camps, n.camp_id);
        const i = byId(ctx.inventory, n.inventory_item_id);
        return c && c.status !== 'Closed' && i && L.maxDispatchQty(n, i, ctx.dispatches) > 0;
      });
      const options = open.length ? open.map((n) => needLabel(n, ctx)) : ['No open needs can be dispatched'];
      return [
        { name: 'need_id', label: 'Need to fulfil', type: 'select', options, value: options[0] },
        { name: 'quantity', label: 'Quantity to send', type: 'number', min: 1, value: '' },
      ];
    },
    normalize: (v) => ({ ...v, need_id: parseId(v.need_id) }),
    validate: (v, ctx) => {
      const need = byId(ctx.needs, v.need_id);
      const camp = need ? byId(ctx.camps, need.camp_id) : null;
      const item = need ? byId(ctx.inventory, need.inventory_item_id) : null;
      const res = L.validateDispatch({ quantity: v.quantity }, { camp, need, item, dispatches: ctx.dispatches });
      const errors = { ...res.errors };
      if (errors.camp_id && !errors.need_id) errors.need_id = errors.camp_id;   // no camp field in this form
      delete errors.camp_id;
      const value = need ? {
        need_id: need.id, camp_id: need.camp_id, inventory_item_id: need.inventory_item_id,
        quantity: res.value.quantity, status: 'Pending',
      } : res.value;
      return { ok: Object.keys(errors).length === 0, errors, value };
    },
  });
})();