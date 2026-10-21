/* MODULE: Ops Map — stylized Sindh operations map. OWNER: Eshaal (@Eshaal607)
 *
 * One new file on purpose: the lead adds the script tag + nav entry at merge
 * time, so this module self-registers and injects its own small stylesheet
 * (same trick camps.js uses with a link tag, just inline since I ship one file).
 *
 * Design decision: the province outline is a hand-simplified Sindh silhouette —
 * wide arable north, the Kirthar range wall on the west, the Rann/delta coast
 * and the Thar edge on the east. Points are stored as real lat/lon and drawn
 * through one linear projection, so camp markers (added next) land where the
 * geography says. A believable stylization, not survey-accurate.
 */
(function () {
  if (!document.getElementById('opsmap-module-css')) {
    const style = document.createElement('style');
    style.id = 'opsmap-module-css';
    style.textContent = [
      '/* injected by js/modules/opsmap.js — scoped under .ops- */',
      '.ops-map-panel {',
      '  position: relative; flex: 1 1 460px; min-width: 300px;',
      '  background: linear-gradient(165deg, #0a4736 0%, #083d2e 55%, #052a1f 100%);',
      '  border-radius: var(--r-lg); padding: var(--sp-5);',
      '  box-shadow: 0 24px 48px -28px rgba(8, 61, 46, .65), inset 0 1px 0 rgba(209, 250, 229, .07);',
      '  overflow: hidden;',
      '}',
      '.ops-map-panel svg { display: block; width: 100%; height: auto; }',
      '.ops-mark { width: 30px; height: 36px; position: absolute; top: 14px; right: 18px; opacity: .75; }',
      '.ops-plate {',
      '  position: absolute; top: 16px; left: 20px;',
      '  font-size: var(--fs-2xs); font-weight: 700; letter-spacing: .22em;',
      '  color: rgba(209, 250, 229, .55); text-transform: uppercase; pointer-events: none;',
      '}',
      '.ops-province { fill: rgba(16, 185, 129, .13); stroke: #34d399; stroke-width: 1.6; stroke-linejoin: round; }',
      '.ops-grid line { stroke: rgba(209, 250, 229, .09); stroke-width: 1; }',
      '.ops-river { fill: none; stroke: rgba(147, 226, 199, .35); stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 1 7; }',
    ].join('\n');
    document.head.append(style);
  }
})();

App.registerModule({
  id: 'opsmap', title: 'Ops Map', icon: '🗺️', order: 8,
  subtitle: 'Sindh at a glance — camps sized by families, coloured by fulfilment',

  /* One linear projection shared by the outline, the river and (soon) markers:
   * x = (lon - 66.5) * 131 + 31.5 ; y = (28.7 - lat) * 95 + 30 (600x520 box). */
  PROJ(lon, lat) { return [(lon - 66.5) * 131 + 31.5, (28.7 - lat) * 95 + 30]; },

  /* Simplified Sindh silhouette, clockwise from the Kirthar crest (NW). */
  OUTLINE: [
    [67.15, 28.10], [67.70, 28.45], [68.60, 28.55], [69.35, 28.30], [69.75, 28.50],
    [70.05, 27.65], [70.35, 27.05], [70.05, 26.30], [69.75, 25.75], [70.10, 25.30],
    [69.80, 24.85], [69.45, 24.35], [69.05, 24.10], [68.70, 23.95], [68.15, 24.05],
    [67.65, 24.15], [67.40, 23.95], [67.25, 24.40], [66.95, 24.65], [66.85, 24.90],
    [66.75, 25.40], [67.05, 25.85], [66.85, 26.30], [67.10, 26.80], [66.90, 27.15],
    [67.15, 27.65],
  ],

  /* The Indus: from the north, past Sukkur and Hyderabad, out through the delta. */
  RIVER: [
    [69.00, 28.20], [68.85, 27.70], [68.55, 27.20], [68.10, 26.75], [67.85, 26.42],
    [68.15, 26.10], [68.35, 25.75], [68.37, 25.38], [68.15, 25.00], [67.90, 24.70],
    [67.55, 24.30], [67.35, 24.00],
  ],

  /* Mild Catmull-Rom smoothing so the lat/lon polyline reads as a coastline,
   * not a polygon. k small = mostly faithful with softened corners. */
  smoothPath(pts, closed, k = 0.18) {
    const p = pts.map(([lon, lat]) => this.PROJ(lon, lat));
    const n = p.length;
    const f = v => v.toFixed(1);
    let d = `M ${f(p[0][0])} ${f(p[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      d += ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? ' Z' : '');
  },

  /* SVG DOM builder (UI.h is HTML-only, SVG needs its own namespace). */
  S(tag, attrs = {}, children = []) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.setAttribute('class', v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      el.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return el;
  },

  async render() {
    const outlineD = this.smoothPath(this.OUTLINE, true);
    const riverD = this.smoothPath(this.RIVER, false, 0.22);

    const shape = this.S('path', { id: 'ops-sindh-shape', class: 'ops-province', d: outlineD });
    const clip = this.S('clipPath', { id: 'ops-sindh-clip' }, this.S('use', { href: '#ops-sindh-shape' }));

    /* faint lat/lon graticule, clipped so it only shows inside the province */
    const grid = this.S('g', { class: 'ops-grid', 'clip-path': 'url(#ops-sindh-clip)' });
    for (let lat = 24; lat <= 28; lat++) {
      const [, y] = this.PROJ(66.5, lat);
      grid.append(this.S('line', { x1: 0, y1: y, x2: 600, y2: y }));
    }
    for (let lon = 67; lon <= 70; lon++) {
      const [x] = this.PROJ(lon, 23.5);
      grid.append(this.S('line', { x1: x, y1: 0, x2: x, y2: 520 }));
    }

    /* compass needle, top-right of the panel */
    const compass = this.S('svg', { class: 'ops-mark', viewBox: '0 0 30 36', 'aria-hidden': 'true' }, [
      this.S('path', { d: 'M15 4 L21 22 L15 18 L9 22 Z', fill: '#d1fae5', opacity: .85 }),
      this.S('path', { d: 'M15 34 L11 24 L15 26.5 L19 24 Z', fill: '#34d399', opacity: .55 }),
      this.S('text', { x: 15, y: 3.4, dy: 2, 'text-anchor': 'middle', 'font-size': 6, fill: 'rgba(209,250,229,.8)' }, 'N'),
    ]);

    const mapSvg = this.S('svg', {
      viewBox: '0 0 600 520', role: 'img',
      'aria-label': 'Stylized map of Sindh province, emerald on deep green.',
    }, [clip, shape, grid, this.S('path', { class: 'ops-river', d: riverD, 'aria-hidden': 'true' })]);

    const mapPanel = UI.h('div', { class: 'ops-map-panel reveal' }, [
      UI.h('span', { class: 'ops-plate' }, 'Sindh · Flood Response 2026'),
      compass, mapSvg,
    ]);
    return UI.h('div', {}, [mapPanel]);
  },
});
