/* Camps screen (Milestone 1). Registered as Views.camps. */
(function () {
  'use strict';
  const { esc, toast, formModal, confirmBox } = window.UI;
  const L = window.Logic;

  const state = { search: '', status: '' };

  function occupancy(c) {
    const cap = Number(c.capacity) || 0;
    const cur = Number(c.current_families) || 0;
    const pct = cap > 0 ? Math.min(100, Math.round((cur / cap) * 100)) : 0;
    const cls = pct >= 100 ? 'full' : pct >= 80 ? 'hot' : '';
    return `<div class="bar" title="${pct}%"><span class="${cls}" style="width:${pct}%"></span></div>` +
      `<div class="muted">${cur} / ${cap} families (${pct}%)</div>`;
  }

  function rowHtml(c, role) {
    const canEdit = L.can(role, 'camp.edit');
    const canDelete = L.can(role, 'camp.delete');
    const canFamilies = L.can(role, 'camp.updateFamilies') && c.status !== 'Closed';
    const buttons = [
      canFamilies ? `<button class="btn small secondary" data-act="families" data-id="${c.id}">Update families</button>` : '',
      canEdit ? `<button class="btn small secondary" data-act="edit" data-id="${c.id}">Edit</button>` : '',
      canDelete ? `<button class="btn small danger" data-act="delete" data-id="${c.id}">Delete</button>` : '',
    ].join('');
    return `<tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.district)}</td>
      <td>${occupancy(c)}</td>
      <td><span class="badge ${esc(c.status)}">${esc(c.status)}</span></td>
      <td class="actions">${buttons || '<span class="muted">View only</span>'}</td>
    </tr>`;
  }

  function campFields(camp, role) {
    // A volunteer never reaches this form (admin only), but keep it safe.
    return [
      { name: 'name', label: 'Camp name', value: camp ? camp.name : '' },
      { name: 'district', label: 'District', value: camp ? camp.district : '' },
      { name: 'capacity', label: 'Capacity (families)', type: 'number', min: 1, value: camp ? camp.capacity : '' },
      { name: 'current_families', label: 'Current families', type: 'number', min: 0, value: camp ? camp.current_families : 0 },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'],
        value: camp && camp.status === 'Closed' ? 'Closed' : 'Open' },
    ];
  }

  /** Builds the payload sent to the API. "Full" is derived automatically, Closed is manual. */
  function toPayload(v) {
    const check = L.validateCamp(v);
    const value = check.value;
    value.status = L.deriveCampStatus(value);
    return value;
  }

  function openCampForm(camp, reload) {
    formModal({
      title: camp ? 'Edit camp' : 'Add camp',
      submitLabel: camp ? 'Save changes' : 'Add camp',
      fields: campFields(camp),
      validate: (values) => L.validateCamp(values),
      onSubmit: async (values) => {
        const payload = toPayload(values);
        if (camp) await window.Api.put('/api/camps/' + camp.id, payload);
        else await window.Api.post('/api/camps', payload);
        toast(camp ? 'Camp updated' : 'Camp added', 'ok');
        reload();
      },
    });
  }

  function openFamiliesForm(camp, reload) {
    formModal({
      title: 'Update families - ' + camp.name,
      submitLabel: 'Update',
      fields: [
        { name: 'current_families', label: `Current families (capacity ${camp.capacity})`, type: 'number', min: 0, value: camp.current_families },
      ],
      validate: (values) => L.validateCamp({ ...camp, current_families: values.current_families }),
      onSubmit: async (values) => {
        const merged = { ...camp, current_families: values.current_families };
        const payload = toPayload(merged);
        await window.Api.put('/api/camps/' + camp.id, payload);
        toast(payload.status === 'Full' ? 'Updated - camp is now Full' : 'Families updated', 'ok');
        reload();
      },
    });
  }

  async function render(container) {
    const role = window.Api.getRole();
    const canCreate = L.can(role, 'camp.create');

    container.innerHTML = `
      <div class="page-head">
        <h1>Camps</h1>
        ${canCreate ? '<button class="btn" id="addCamp">+ Add camp</button>' : ''}
      </div>
      <div class="toolbar">
        <input type="search" id="campSearch" placeholder="Search by name or district" value="${esc(state.search)}" aria-label="Search camps">
        <select id="campStatus" aria-label="Filter by status">
          <option value="">All statuses</option>
          ${L.CAMP_STATUSES.map((s) => `<option value="${s}"${state.status === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="card table-wrap" id="campTable"><div class="loading">Loading camps...</div></div>`;

    const table = container.querySelector('#campTable');
    let camps = [];

    async function load() {
      const params = new URLSearchParams();
      if (state.search.trim()) params.set('q', state.search.trim());
      if (state.status) params.set('status', state.status);
      params.set('_sort', 'name');
      try {
        camps = await window.Api.get('/api/camps?' + params.toString());
      } catch (err) {
        table.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
        return;
      }
      if (!camps.length) {
        table.innerHTML = '<div class="empty">No camps found.</div>';
        return;
      }
      table.innerHTML = `<table>
        <thead><tr><th>Camp</th><th>District</th><th>Occupancy</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${camps.map((c) => rowHtml(c, role)).join('')}</tbody></table>`;
    }

    let timer;
    container.querySelector('#campSearch').addEventListener('input', (e) => {
      state.search = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(load, 250);
    });
    container.querySelector('#campStatus').addEventListener('change', (e) => { state.status = e.target.value; load(); });
    const add = container.querySelector('#addCamp');
    if (add) add.addEventListener('click', () => openCampForm(null, load));

    table.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const camp = camps.find((c) => c.id === Number(btn.dataset.id));
      if (!camp) return;
      if (btn.dataset.act === 'edit') openCampForm(camp, load);
      else if (btn.dataset.act === 'families') openFamiliesForm(camp, load);
      else if (btn.dataset.act === 'delete') {
        const ok = await confirmBox('Delete camp', `Delete "${camp.name}"? This cannot be undone.`);
        if (!ok) return;
        try {
          await window.Api.del('/api/camps/' + camp.id);
          toast('Camp deleted', 'ok');
          load();
        } catch (err) { toast(err.message, 'error'); }
      }
    });

    await load();
  }

  window.Views = window.Views || {};
  window.Views.camps = { render };
})();