/* MODULE: Live Ops Feed — OWNER: Eshaal (@Eshaal607)
 *
 * A read-only activity timeline that watches the API and turns snapshot diffs
 * into feed items. Makes the dashboard feel alive during the demo without
 * anybody touching it.
 *
 * How it works:
 *  - On first render we snapshot the five collections (camps, inventory,
 *    needs, dispatches, volunteers). Every 8s while the route is active we
 *    re-fetch and diff fresh-vs-previous; each delta becomes a feed item.
 *  - The interval handle lives at MODULE level: every render stops it first,
 *    so re-renders can never stack timers. A hashchange listener stops it
 *    when you navigate away, and document.hidden pauses it too.
 *  - The diff engine between the [pure] markers is DOM-free, so it can be
 *    exercised from a plain node harness.
 *  - Single-file constraint: my styles ship inside this file as an injected
 *    <style> tag (styles.css belongs to the team lead).
 */
(() => {
  /* my little stylesheet, injected once (styles.css itself is the lead's) */
  if (!document.getElementById('eshaal-opsfeed-css')) {
    const style = document.createElement('style');
    style.id = 'eshaal-opsfeed-css';
    style.textContent = `
      .opsfeed { max-width: 880px; }
      .ops-banner {
        display: flex; gap: 8px; align-items: baseline;
        margin-bottom: var(--sp-4); padding: 10px 14px;
        background: var(--panel-tint); border: 1px dashed var(--line-strong);
        border-radius: var(--r-md); color: var(--muted); font-size: var(--fs-sm);
      }
      .ops-banner strong { color: var(--ink-soft); }
      .ops-statusbar {
        display: flex; align-items: center; gap: 8px;
        margin: 0 0 var(--sp-3); color: var(--muted); font-size: var(--fs-xs);
      }
      .ops-dot {
        width: 8px; height: 8px; border-radius: 50%; flex: none;
        background: var(--brand-500);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, .40);
        animation: opsPulse 2.2s infinite;
      }
      .ops-dot.demo { background: var(--faint); animation: none; box-shadow: none; }
      .ops-dot.warn { background: var(--warn); animation: none; box-shadow: none; }
      @keyframes opsPulse {
        0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, .40); }
        70%  { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      .ops-counter { margin-left: auto; font-variant-numeric: tabular-nums; }
      .ops-feed { display: flex; flex-direction: column; gap: var(--sp-2); }
      .feed-item {
        display: flex; gap: var(--sp-3); align-items: flex-start;
        padding: var(--sp-3) var(--sp-4); background: var(--panel);
        border: 1px solid var(--line); border-radius: var(--r-md);
        box-shadow: var(--shadow-xs);
      }
      .feed-ico {
        flex: none; width: 34px; height: 34px; display: grid; place-items: center;
        font-size: 16px; border-radius: 10px; background: var(--brand-soft);
      }
      .feed-item[data-kind="dispatch"]  .feed-ico { background: var(--brand-100); }
      .feed-item[data-kind="stock"]     .feed-ico { background: var(--ok-soft); }
      .feed-item[data-kind="need"]      .feed-ico { background: var(--warn-soft); }
      .feed-text { margin: 0; font-size: var(--fs-base); color: var(--ink); line-height: 1.45; }
      .feed-time {
        display: block; margin-top: 2px; font-size: var(--fs-2xs);
        color: var(--muted); font-variant-numeric: tabular-nums;
      }
      .feed-new { animation: opsFeedIn .55s cubic-bezier(0.19, 1, 0.22, 1) both; }
      @keyframes opsFeedIn {
        from { opacity: 0; transform: translateY(-12px) scale(.985); }
        to   { opacity: 1; transform: none; }
      }
      .ops-empty {
        padding: var(--sp-5); text-align: center; color: var(--muted);
        font-size: var(--fs-sm); border: 1px dashed var(--line-strong);
        border-radius: var(--r-md); background: var(--panel-tint);
      }
      @media (prefers-reduced-motion: reduce) {
        .feed-new, .ops-dot { animation: none; }
      }
    `;
    document.head.append(style);
  }

  const POLL_INTERVAL = 8000;   /* re-fetch every 8s while the route is active */
  const MAX_ITEMS = 30;         /* feed cap */
  const COLLECTIONS = ['camps', 'inventory', 'needs', 'dispatches', 'volunteers'];

  /* ========================================================================
   * [pure] diff engine — no DOM, no App/API refs. Testable from node:
   * slice this block out of the file and eval it in a harness.
   * ====================================================================== */

  const byId = rows => Object.fromEntries((rows || []).map(r => [String(r.id), r]));

  /* "carton" x50 -> "cartons", x1 -> "carton", "box" x4 -> "boxes";
   * units already plural-shaped ("units" fallback) are left alone */
  function plural(unit, qty) {
    if (+qty === 1) return unit;
    if (unit.endsWith('s')) return unit;
    return unit === 'box' ? 'boxes' : unit + 's';
  }

  /* "just now" / "40s ago" / "2m ago" / "3h ago" / "1d ago" */
  function relTime(ts, now) {
    now = now || Date.now();
    const s = Math.max(0, Math.round((now - ts) / 1000));
    if (s < 10) return 'just now';
    if (s < 60) return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  /* Compare two snapshots ({camps,inventory,needs,dispatches,volunteers}) and
   * translate every change into a feed item. Returns oldest->newest. */
  function diffEvents(prev, next, now) {
    now = now || Date.now();
    const evts = [];
    const add = (icon, text, kind) => evts.push({ icon, text, kind, ts: now });

    const pC = byId(prev.camps), nC = byId(next.camps);
    const pI = byId(prev.inventory), nI = byId(next.inventory);
    const pN = byId(prev.needs), nN = byId(next.needs);
    const pD = byId(prev.dispatches), nD = byId(next.dispatches);
    const pV = byId(prev.volunteers), nV = byId(next.volunteers);

    const campName = (map, id) => { const c = map[String(id)]; return c ? c.name : 'Camp ' + id; };
    const shortCamp = id => { const c = nC[String(id)]; return c ? (c.district || c.name) : 'Camp ' + id; };
    const needOf = d => nN[String(d.need_id)];
    const itemOf = need => (need ? nI[String(need.inventory_item_id)] : null) || {};

    /* stock change caused by dispatch ops this tick (create = -qty reserved,
     * cancel = +qty returned) — used to keep donations and dispatches apart */
    const driven = {};
    const bumpDriven = (itemId, qty) => { if (itemId) driven[itemId] = (driven[itemId] || 0) + qty; };
    /* needs already reported via a Delivered dispatch this tick — don't double-report */
    const touchedNeeds = new Set();

    /* ---- dispatches ---- */
    for (const d of next.dispatches) {
      const p = pD[String(d.id)];
      const need = needOf(d);
      const item = itemOf(need);
      const qty = +d.quantity || 0;
      const iid = need ? String(need.inventory_item_id) : null;
      const camp = campName(nC, d.camp_id);

      if (!p) {
        add('🚚', `dispatch ${d.id} created (${qty} ${item.name || 'supplies'} -> ${camp})`, 'dispatch');
        bumpDriven(iid, -qty);
        continue;
      }
      if (d.status !== p.status) {
        if (d.status === 'Delivered') {
          touchedNeeds.add(String(d.need_id));
          const req = +((need || {}).required_quantity) || 0;
          const pct = req ? Math.round((qty / req) * 100) : null;
          add('✅', `dispatch ${d.id} delivered: ${qty} ${item.name || 'supplies'} -> ${shortCamp(d.camp_id)}` +
            (pct !== null ? ` (+${pct}% fulfilment)` : ''), 'dispatch');
        } else if (d.status === 'Cancelled') {
          add('🚫', `dispatch ${d.id} cancelled (${camp})`, 'dispatch');
          bumpDriven(iid, qty);
        } else {
          add('🔄', `dispatch ${d.id} status: ${p.status} -> ${d.status} (${shortCamp(d.camp_id)})`, 'dispatch');
        }
      } else if (qty !== +p.quantity) {
        add('⚠️', `dispatch ${d.id} quantity ${p.quantity} -> ${d.quantity} (${camp})`, 'dispatch');
      }
    }

    /* ---- camps ---- */
    for (const c of next.camps) {
      const p = pC[String(c.id)];
      if (!p) {
        add('⛺', `camp ${c.name} added (${c.district || 'new district'})`, 'camp');
        continue;
      }
      if (+c.current_families !== +p.current_families) {
        add('🏕️', `camp ${c.name}: families ${p.current_families} -> ${c.current_families}`, 'camp');
      }
      if (c.status !== p.status) {
        add('🔄', `camp ${c.name} status: ${p.status} -> ${c.status}`, 'camp');
      }
    }
    for (const c of prev.camps) {
      if (!nC[String(c.id)]) add('📉', `camp ${c.name} removed`, 'camp');
    }

    /* ---- needs ---- */
    for (const n of next.needs) {
      const p = pN[String(n.id)];
      const item = itemOf(n);
      const camp = campName(nC, n.camp_id);
      if (!p) {
        add('📋', `need ${n.id} added at ${camp}: ${n.required_quantity} ${item.name || 'supplies'}`, 'need');
        continue;
      }
      if (n.priority !== p.priority) {
        add('⚠️', `need ${n.id} priority: ${p.priority} -> ${n.priority} (${item.name || 'supplies'})`, 'need');
      }
      if (+n.fulfilled_quantity !== +p.fulfilled_quantity && !touchedNeeds.has(String(n.id))) {
        add('📈', `need ${n.id} fulfilled: ${p.fulfilled_quantity} -> ${n.fulfilled_quantity} (${camp})`, 'need');
      }
      if (+n.required_quantity !== +p.required_quantity) {
        add('📋', `need ${n.id} required: ${p.required_quantity} -> ${n.required_quantity} (${camp})`, 'need');
      }
    }

    /* ---- inventory: stock moves with no dispatch behind them ---- */
    for (const it of next.inventory) {
      const p = pI[String(it.id)];
      const iid = String(it.id);
      if (!p) {
        add('🏷️', `inventory ${it.name} added (stock ${it.stock})`, 'stock');
        continue;
      }
      const unexplained = (+it.stock || 0) - (+p.stock || 0) - (driven[iid] || 0);
      if (unexplained > 0) add('📦', `stock +${unexplained} ${it.name} (no dispatch)`, 'stock');
      else if (unexplained < 0) add('⚠️', `stock ${unexplained} ${it.name} (unexplained)`, 'stock');
    }
    for (const it of prev.inventory) {
      if (!nI[String(it.id)]) add('🗑️', `inventory ${it.name} removed`, 'stock');
    }

    /* ---- volunteers ---- */
    for (const v of next.volunteers) {
      const p = pV[String(v.id)];
      if (!p) {
        add('🙋', `volunteer ${v.name} added (${v.skill || 'general'})`, 'volunteer');
        continue;
      }
      if (String(v.camp_id) === String(p.camp_id)) continue;
      add('🙋', `volunteer ${v.name}: camp ${p.camp_id ?? 'null'} -> ${v.camp_id ?? 'null'}`, 'volunteer');
    }
    for (const v of prev.volunteers) {
      if (!nV[String(v.id)]) add('👋', `volunteer ${v.name} removed`, 'volunteer');
    }

    return evts;
  }

  /* [/pure] */

  /* ======================================================================
   * Module state — everything at module level so re-renders never stack
   * timers and the timeline survives route round-trips within a session.
   * ==================================================================== */
  let _timer = null;          /* the one interval handle */
  let _polling = false;       /* a fetch is in flight — skip ticks until done */
  let _prev = null;           /* previous snapshot (the diff baseline) */
  let _events = [];           /* feed items, newest first, capped at MAX_ITEMS */
  let _sessionSeen = 0;       /* events seen this session (uncapped) */
  let _eventSeq = 0;          /* monotonically increasing event id */
  let _paintedSeq = 0;        /* ids <= this are already on screen (no re-animate) */
  let _lastCheck = 0;         /* Date.now() of the last successful poll */
  let _reconnecting = false;  /* last poll failed — holding the last snapshot */
  let _demo = false;          /* API._demoMode at poll time */
  let _root = null, _bannerEl = null, _statusText = null, _counterEl = null, _listEl = null;

  function stopPolling() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  function startPolling() {
    stopPolling(); /* never two handles */
    if (_demo || document.hidden) return; /* hidden tabs don't poll */
    _timer = setInterval(() => { if (!document.hidden && !_polling) poll(); }, POLL_INTERVAL);
  }

  async function fetchSnapshot() {
    const [camps, inventory, needs, dispatches, volunteers] =
      await Promise.all(COLLECTIONS.map(c => API.list(c)));
    return { camps, inventory, needs, dispatches, volunteers };
  }

  async function poll() {
    if (_polling) return;
    _polling = true;
    try {
      const snap = await fetchSnapshot();
      _demo = !!API._demoMode;
      _reconnecting = false;
      if (_prev) {
        const evts = diffEvents(_prev, snap);
        if (evts.length) pushEvents(evts);
      } else if (_demo) {
        /* demo timeline lands in a later commit */
      }
      _prev = snap;             /* only a successful fetch replaces the baseline */
      _lastCheck = Date.now();
      paintStatus();
      paintTimes();
    } catch (e) {
      /* silent: keep the last snapshot, flag the reconnecting state */
      _reconnecting = true;
      paintStatus();
    } finally {
      _polling = false;
    }
  }

  function pushEvents(evts) {
    if (!evts.length) return;
    const now = Date.now();
    const stamped = evts.map(e => ({ id: ++_eventSeq, ts: e.ts || now, icon: e.icon, text: e.text, kind: e.kind }));
    _events = [...stamped.reverse(), ..._events].slice(0, MAX_ITEMS); /* newest first, capped */
    _sessionSeen += stamped.length;
    paintList(true);
    paintStatus();
  }

  function paintList(animate) {
    if (!_listEl) return;
    const reduce = typeof App !== 'undefined' && App._reduceMotion && App._reduceMotion();
    _listEl.innerHTML = '';
    if (!_events.length) {
      _listEl.append(UI.h('div', { class: 'ops-empty' },
        'Watching operations… changes will appear here live.'));
      return;
    }
    _events.forEach((e, i) => {
      const isNew = animate && e.id > _paintedSeq && !reduce;
      const row = UI.h('article', { class: 'feed-item' + (isNew ? ' feed-new' : ''), 'data-kind': e.kind }, [
        UI.h('span', { class: 'feed-ico', 'aria-hidden': 'true' }, e.icon),
        UI.h('div', { class: 'feed-body' }, [
          UI.h('p', { class: 'feed-text' }, e.text),
          UI.h('span', { class: 'feed-time', 'data-ts': String(e.ts) }, relTime(e.ts)),
        ]),
      ]);
      if (isNew) row.style.animationDelay = Math.min(i, 8) * 45 + 'ms'; /* soft stagger */
      _listEl.append(row);
    });
    _paintedSeq = _eventSeq;
  }

  function paintStatus() {
    if (!_root || !_statusText || !_counterEl) return;
    let dot = 'live', label;
    if (_demo) { dot = 'demo'; label = 'Demo mode — no live polling'; }
    else if (_reconnecting) { dot = 'warn'; label = 'Reconnecting… holding the last snapshot'; }
    else label = 'Live — polling every 8s';
    const dotEl = _root.querySelector('.ops-dot');
    if (dotEl) dotEl.className = 'ops-dot ' + dot;
    if (_bannerEl) _bannerEl.style.display = _demo ? '' : 'none';
    _statusText.textContent = label;
    const n = _sessionSeen;
    _counterEl.textContent = _lastCheck
      ? `${n} event${n === 1 ? '' : 's'} this session · last checked ${relTime(_lastCheck)}`
      : `${n} events this session · checking…`;
  }

  /* age the relative-time labels on every tick */
  function paintTimes() {
    if (!_root) return;
    _root.querySelectorAll('.feed-time[data-ts]').forEach(el => {
      el.textContent = relTime(+el.dataset.ts);
    });
  }

  App.registerModule({
    id: 'opsfeed', title: 'Ops Feed', icon: '📡', order: 10,
    subtitle: 'Live activity timeline — what changed since you last looked',

    async render() {
      stopPolling(); /* first thing, every render — no stacked timers, ever */

      const root = UI.h('div', { class: 'opsfeed' });
      const statusbar = UI.h('div', { class: 'ops-statusbar' }, [
        UI.h('span', { class: 'ops-dot live', 'aria-hidden': 'true' }),
        UI.h('span', { class: 'ops-status-text' }, 'Connecting…'),
        UI.h('span', { class: 'ops-counter' }, ''),
      ]);
      const list = UI.h('div', { class: 'ops-feed' });
      root.append(UI.h('div', { class: 'panel ops-panel' }, [
        UI.h('h3', {}, 'Live operations'),
        statusbar,
        list,
      ]));

      _root = root; _bannerEl = null; _listEl = list;
      _statusText = statusbar.querySelector('.ops-status-text');
      _counterEl = statusbar.querySelector('.ops-counter');
      paintList(false); /* replay anything already seen this session */
      paintStatus();

      const seq = App._renderSeq; /* detect "user navigated away mid-fetch" */
      await poll();
      if (App._renderSeq !== seq) return root; /* stale render — no timer */
      if (!_demo) startPolling();
      return root;
    },
  });

  /* Route watchers — registered once at module level. */
  window.addEventListener('hashchange', () => {
    if ((location.hash.replace('#/', '') || 'home') !== 'opsfeed') stopPolling();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopPolling(); return; }
    if (_root && _root.isConnected && (location.hash.replace('#/', '') || 'home') === 'opsfeed') {
      startPolling();
    }
  });
})();
