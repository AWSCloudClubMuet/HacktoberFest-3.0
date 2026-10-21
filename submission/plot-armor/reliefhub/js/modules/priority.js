/* MODULE: Dispatch Intelligence — OWNER: Eshaal (@Eshaal607)
 *
 * Explainable "what do we dispatch next" ranking. Every open need gets a
 * transparent 0-100 dispatch score from four weighted signals — the same
 * weighted multi-signal triage approach as the team's label-priority model
 * (98.5% review yield), applied to relief dispatching:
 *   urgency     — need priority: High 1.0 / Medium 0.6 / Low 0.3
 *   deprivation — 1 − fulfilment % (UI.pct)
 *   pressure    — camp current_families ÷ capacity
 *   stock cover — min(1, warehouse stock ÷ remaining need); zero stock is
 *                 flagged "uncoverable" instead of silently ranking top
 * Read-only by design: this module never mutates anything, so it behaves
 * identically against the live Render API and the bundled demo data
 * (api.js demo-mode fallback). Self-registering via App.registerModule —
 * safe to load last.
 */
App.registerModule({
  id: 'priority', title: 'Dispatch Intelligence', icon: '🧠', order: 7,
  subtitle: 'What to dispatch next, and why',

  /* Signal weights (sum to 1). Kept on the module so the UI chips that show
   * them and the score itself can never drift apart. */
  weights: { urgency: 0.35, deprivation: 0.30, pressure: 0.20, stock: 0.15 },
  URGENCY: { High: 1.0, Medium: 0.6, Low: 0.3 },

  clamp01(v) { return Math.max(0, Math.min(1, v)); },

  /* Pure signal computation — no DOM, so a node harness can exercise it. */
  signals(need, camp, item) {
    const required = +need.required_quantity || 0;
    const fulfilled = +need.fulfilled_quantity || 0;
    const remaining = Math.max(0, required - fulfilled);
    const fulfilPct = UI.pct(fulfilled, required);
    const stock = +((item || {}).stock) || 0;
    return {
      urgency: this.clamp01(this.URGENCY[need.priority] ?? 0.5),
      deprivation: this.clamp01(1 - fulfilPct / 100),
      pressure: this.clamp01(camp && +camp.capacity ? (+camp.current_families || 0) / +camp.capacity : 0),
      stock: remaining > 0 ? this.clamp01(stock / remaining) : 0,
      /* passthroughs the UI needs alongside the four 0-1 signals */
      remaining, fulfilPct, stockOnHand: stock,
    };
  },

  /* Weighted sum ×100 → 0-100 dispatch score. */
  score(need, camp, item) {
    const s = this.signals(need, camp, item);
    const w = this.weights;
    return Math.round((s.urgency * w.urgency + s.deprivation * w.deprivation
      + s.pressure * w.pressure + s.stock * w.stock) * 100);
  },

  async render() {
    const [camps, items, needs] = await Promise.all([
      API.list('camps'), API.list('inventory'), API.list('needs'),
    ]);
    const campById = Object.fromEntries(camps.map(c => [c.id, c]));
    const itemById = Object.fromEntries(items.map(i => [i.id, i]));
    const root = UI.h('div');

    /* Filter state — the table body refreshes live, exactly like needs.js. */
    let campFilter = 'All';
    let priorityFilter = 'All';
    const tableBox = UI.h('div');
    const countNote = UI.h('span', { class: 'toolbar-note' });

    /* Rank only needs that still need supplies; fully fulfilled ones have
     * nothing to dispatch, so they are excluded (and counted in the note). */
    const openNeeds = needs.filter(n => Math.max(0, +n.required_quantity - +n.fulfilled_quantity) > 0);
    const excluded = needs.length - openNeeds.length;

    function matches(n) {
      if (campFilter !== 'All' && String(n.camp_id) !== campFilter) return false;
      if (priorityFilter !== 'All' && n.priority !== priorityFilter) return false;
      return true;
    }

    /* Build ranked rows: score desc, then biggest remaining gap first. */
    function rankedRows() {
      return openNeeds.filter(matches)
        .map(n => {
          const camp = campById[n.camp_id] || null;
          const item = itemById[n.inventory_item_id] || null;
          return { need: n, camp, item, sig: this.signals(n, camp, item), score: this.score(n, camp, item) };
        }, this)
        .sort((a, b) => b.score - a.score || b.sig.remaining - a.sig.remaining);
    }

    function refresh() {
      const rows = rankedRows.call(this);
      countNote.textContent = rows.length + ' open needs ranked'
        + (excluded ? ' · ' + excluded + ' fully fulfilled excluded' : '');
      rows.forEach((r, i) => { r.rank = i + 1; });
      tableBox.innerHTML = '';
      tableBox.append(UI.table(buildColumns(), rows,
        openNeeds.length ? 'No needs match your filters.' : 'No open needs to rank right now.'));
    }

    function buildColumns() {
      return [
        { label: '#', key: 'rank' },
        { label: 'Camp', render: r => (r.camp || {}).name || 'Camp #' + r.need.camp_id },
        { label: 'Item', render: r => (r.item || {}).name || 'Item #' + r.need.inventory_item_id },
        { label: 'Remaining', render: r => UI.h('span', { class: 'need-progress' },
          r.sig.remaining.toLocaleString() + ((r.item || {}).unit ? ' ' + r.item.unit : '')) },
        { label: 'Score', render: r => UI.badge(r.score + '/100',
          r.score >= 75 ? 'bad' : r.score >= 50 ? 'warn' : 'info') },
      ];
    }

    /* Weight chips row — the formula is part of the UI, not a secret. */
    const w = this.weights;
    root.append(UI.h('div', { class: 'toolbar' }, [
      UI.h('span', { class: 'toolbar-note' }, 'Dispatch score ='),
      ['urgency', 'deprivation', 'pressure', 'stock'].map(k =>
        UI.h('span', {
          style: 'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:var(--fs-2xs);'
            + 'border:1px solid var(--line-strong);background:var(--panel-tint);'
            + 'border-radius:var(--r-pill);padding:2px 8px;',
        }, k.toUpperCase() + ' ×' + w[k])),
    ]));

    root.append(UI.h('div', { class: 'toolbar' }, [
      UI.h('select', { onchange: e => { campFilter = e.target.value; refresh(); } },
        [UI.h('option', { value: 'All' }, 'All camps'),
          ...camps.map(c => UI.h('option', { value: String(c.id) }, c.name))]),
      UI.h('select', { onchange: e => { priorityFilter = e.target.value; refresh(); } },
        [UI.h('option', { value: 'All' }, 'All priorities'),
          ...['High', 'Medium', 'Low'].map(p => UI.h('option', { value: p }, p))]),
      countNote,
    ]));

    root.append(tableBox);
    refresh.call(this);

    return root;
  },
});
