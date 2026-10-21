/* Dashboard: KPIs, pie charts, bar graphs, fulfilment by category, critical gaps. */
(function () {
  'use strict';
  const { esc } = window.UI;
  const L = window.Logic;
  const { bar, card, cardGrid, fetchAll, pill } = window.Common;

  const COLORS = {
    Open: '#1e8449', Full: '#b9770e', Closed: '#8a949e',
    Pending: '#b9770e', 'In Transit': '#2e86c1', Delivered: '#1e8449', Cancelled: '#8a949e',
  };

  // ---------- pie chart (SVG) ----------
  function pie(data) {
    const items = data.filter((d) => d.value > 0);
    const total = items.reduce((s, d) => s + d.value, 0);
    if (!total) return '<div class="empty">No data yet.</div>';
    const cx = 90, cy = 90, r = 80;
    let angle = -Math.PI / 2;
    const slices = items.map((d) => {
      if (d.value === total) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.color}"><title>${esc(d.label)}: ${d.value}</title></circle>`;
      const a2 = angle + (d.value / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = a2 - angle > Math.PI ? 1 : 0;
      angle = a2;
      return `<path d="M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${d.color}" stroke="#fff" stroke-width="2"><title>${esc(d.label)}: ${d.value}</title></path>`;
    }).join('');
    const legend = data.map((d) =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">` +
      `<span style="width:12px;height:12px;border-radius:3px;background:${d.color};display:inline-block"></span>` +
      `<span>${esc(d.label)}</span><strong style="margin-left:auto;padding-left:16px">${d.value} (${Math.round((d.value / total) * 100)}%)</strong></div>`).join('');
    return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:20px;justify-content:center">` +
      `<svg viewBox="0 0 180 180" width="180" height="180" role="img">${slices}</svg>` +
      `<div style="min-width:170px">${legend}</div></div>`;
  }

  // ---------- horizontal bar graph (two bars per row) ----------
  function hbars(rows, nameA, nameB) {
    if (!rows.length) return '<div class="empty">No data yet.</div>';
    const max = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
    const w = (v) => Math.max(0, Math.min(100, (v / max) * 100));
    const legend = `<div class="muted" style="margin-bottom:10px">` +
      `<span style="display:inline-block;width:10px;height:10px;background:#b8c4cf;margin-right:4px"></span>${esc(nameA)} &nbsp; ` +
      `<span style="display:inline-block;width:10px;height:10px;background:#0b6e6e;margin-right:4px"></span>${esc(nameB)}</div>`;
    return legend + rows.map((r) =>
      `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px">` +
      `<strong>${esc(r.label)}</strong><span class="muted">${r.b} / ${r.a}</span></div>` +
      `<div style="height:8px;background:#b8c4cf;border-radius:4px;width:${w(r.a)}%;margin-bottom:3px"></div>` +
      `<div style="height:8px;background:${r.bColor || '#0b6e6e'};border-radius:4px;width:${w(r.b)}%"></div></div>`).join('');
  }

  const panel = (title, body) =>
    `<div class="card" style="padding:16px"><h3 style="margin:0 0 12px;font-size:16px">${esc(title)}</h3>${body}</div>`;

  async function render(container) {
    container.innerHTML = '<div class="page-head"><h1>Dashboard</h1></div><div class="card loading">Loading...</div>';
    let d;
    try { d = await fetchAll(['camps', 'needs', 'inventory', 'volunteers', 'dispatches']); }
    catch (err) { container.innerHTML = `<div class="card error-box">${esc(err.message)}</div>`; return; }

    const k = L.computeKPIs({ camps: d.camps, needs: d.needs, inventory: d.inventory, volunteers: d.volunteers });
    const cats = L.fulfilmentByCategory(d.needs, d.inventory);
    const gaps = L.criticalGaps(d.needs, d.camps, d.inventory);

    const campPie = pie(L.CAMP_STATUSES.map((s) => ({
      label: s, color: COLORS[s] || '#888', value: d.camps.filter((c) => c.status === s).length })));
    const dispPie = pie(L.DISPATCH_STATUSES.map((s) => ({
      label: s, color: COLORS[s] || '#888', value: d.dispatches.filter((x) => x.status === s).length })));

    const occupancy = hbars(d.camps.slice(0, 12).map((c) => ({
      label: c.name, a: Number(c.capacity) || 0, b: Number(c.current_families) || 0 })), 'Capacity', 'Families');
    const stock = hbars(d.inventory.slice(0, 12).map((i) => ({
      label: i.name + ' (' + i.unit + ')', a: Number(i.reorder_level) || 0, b: Number(i.stock) || 0,
      bColor: L.isLowStock(i) ? '#c0392b' : '#0b6e6e' })), 'Reorder level', 'Stock');

    const catHtml = cats.length ? cats.map((c) =>
      `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between">` +
      `<strong>${esc(c.category)}</strong><span class="muted">${c.fulfilled} / ${c.required} (${Math.round(c.pct)}%)</span></div>` +
      bar(c.pct, c.pct < L.CRITICAL_THRESHOLD ? 'full' : c.pct < 70 ? 'hot' : '') + '</div>').join('')
      : '<div class="empty">No needs recorded yet.</div>';

    const gapHtml = gaps.length
      ? '<table><thead><tr><th>Camp</th><th>Item</th><th>Fulfilled</th><th>Shortfall</th></tr></thead><tbody>' +
        gaps.map((g) => `<tr><td><strong>${esc(g.camp ? g.camp.name : '-')}</strong></td>` +
          `<td>${esc(g.item ? g.item.name : '-')}</td>` +
          `<td>${pill(Math.round(g.pct) + '%', 'bad')}</td>` +
          `<td>${esc(g.shortfall)} ${esc(g.item ? g.item.unit : '')}</td></tr>`).join('') + '</tbody></table>'
      : '<div class="empty">No critical gaps. All high-priority needs are above ' + L.CRITICAL_THRESHOLD + '%.</div>';

    const twoCol = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-bottom:14px';

    container.innerHTML = `
      <div class="page-head"><h1>Dashboard</h1></div>
      ${cardGrid(
        card(k.activeCamps, 'Active camps') +
        card(k.familiesSheltered.toLocaleString(), 'Families sheltered') +
        card(Math.round(k.fulfilmentPct) + '%', 'Needs fulfilled') +
        card(k.lowStockCount, 'Low-stock items') +
        card(k.volunteersDeployed, 'Volunteers deployed'))}
      <div style="${twoCol}">
        ${panel('Camps by status', campPie)}
        ${panel('Dispatches by status', dispPie)}
      </div>
      <div style="${twoCol}">
        ${panel('Camp occupancy (families vs capacity)', occupancy)}
        ${panel('Inventory (stock vs reorder level)', stock)}
      </div>
      <h2 style="font-size:17px;margin:18px 0 8px">Fulfilment by category</h2>
      <div class="card" style="padding:16px">${catHtml}</div>
      <h2 style="font-size:17px;margin:18px 0 8px">Critical gaps (high priority, under ${L.CRITICAL_THRESHOLD}%)</h2>
      <div class="card table-wrap">${gapHtml}</div>`;
  }

  window.Views = window.Views || {};
  window.Views.dashboard = { render };
})();
