/* ReliefHub reusable UI components */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-PK');
const pkr = n => 'PKR ' + fmt(n);
const pct = (a, b) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
const F = { camps: {}, needs: {}, inv: {}, disp: {}, vol: {} };   // persisted filter state

function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.setAttribute('role', 'status');
  t.textContent = (type === 'ok' ? '✓ ' : '⚠ ') + msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 4500);
}
const badge = s => `<span class="badge b-${String(s).toLowerCase().replace(/\s/g, '')}">${esc(s)}</span>`;
const bar = (p, cls) => `<div class="bar"><i class="${cls || (p < 40 ? 'low' : p < 75 ? 'mid' : 'ok')}" style="width:${p}%"></i></div><small>${p}%</small>`;
const empty = (t, s = '') => `<div class="empty"><div class="ico">🗂️</div><h3>${esc(t)}</h3><p>${esc(s)}</p></div>`;
const loading = () => `<div class="loading"><div class="spin"></div><span>Loading…</span></div>`;
const head = (t, s, actions = '') => `<div class="head"><div><h1>${esc(t)}</h1><p>${esc(s)}</p></div><div class="acts">${actions}</div></div>`;
const btn = (act, label, attrs = '', cls = '') => `<button class="btn ${cls}" data-act="${act}" ${attrs}>${label}</button>`;
const ab = (act, label, id, cls = 'ghost', extra = '') => btn(act, label, `data-id="${id}" ${extra}`, 'sm ' + cls);
const kpi = (icon, label, value, sub = '', cls = '') => `<div class="kpi ${cls}"><span class="ki">${icon}</span><div><small>${label}</small><strong>${value}</strong><em>${sub}</em></div></div>`;
const table = (heads, rows) => `<div class="tw"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const input = (k, n, ph) => `<input type="search" data-f="${k}.${n}" placeholder="${ph}" aria-label="${ph}" value="${esc(F[k][n] || '')}">`;
const select = (k, n, opts, all) => `<select data-f="${k}.${n}" aria-label="${all}"><option value="">${all}</option>${opts.map(o => { const v = o.v ?? o, l = o.l ?? o; return `<option value="${esc(v)}"${String(F[k][n] ?? '') === String(v) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;

function formModal({ title, fields, save, label = 'Save', done = 'Saved' }) {
  const m = document.createElement('div'); m.className = 'overlay';
  const field = f => `<label>${esc(f.label)}${f.hint ? `<small> ${esc(f.hint)}</small>` : ''}` + (f.options
    ? `<select name="${f.name}">${f.options.map(o => { const v = o.v ?? o, l = o.l ?? o; return `<option value="${esc(v)}"${String(v) === String(f.value ?? '') ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`
    : `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''} autocomplete="off">`) + '</label>';
  m.innerHTML = `<form class="modal" novalidate role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><div class="err" hidden></div>${fields.map(field).join('')}<div class="mact"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${label}</button></div></form>`;
  document.body.append(m);
  m.querySelector('input,select')?.focus();
  m.addEventListener('mousedown', e => { if (e.target === m || e.target.hasAttribute('data-close')) m.remove(); });
  m.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.querySelector('.mact .btn:last-child'), err = m.querySelector('.err'); b.disabled = true; err.hidden = true;
    try { await save(Object.fromEntries(new FormData(e.target))); m.remove(); toast(done); refresh(); }
    catch (x) { err.textContent = x.message; err.hidden = false; b.disabled = false; }
  };
}
function confirmBox(msg) {
  return new Promise(res => {
    const m = document.createElement('div'); m.className = 'overlay';
    m.innerHTML = `<div class="modal" role="alertdialog"><h2>Please confirm</h2><p>${esc(msg)}</p><div class="mact"><button class="btn ghost" data-v="0">Cancel</button><button class="btn danger" data-v="1">Confirm</button></div></div>`;
    m.onclick = e => { const v = e.target.dataset?.v; if (v != null || e.target === m) { m.remove(); res(v === '1'); } };
    document.body.append(m);
  });
}
