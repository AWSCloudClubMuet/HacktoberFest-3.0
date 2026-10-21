/* MODULE: Inventory / Warehouse (Milestone 2, part A) — OWNER: Eshaal (@Eshaal607)
 *
 * Rules from the issue:
 *  - Inventory CRUD (Coordinator only, App.canEdit()): name, category, unit,
 *    stock, reorder_level. Validate: non-empty name/category/unit, stock >= 0,
 *    reorder_level >= 0.
 *  - Highlight items at or below their reorder level as "Low Stock" badge
 *    (use UI.badge('Low Stock', 'warn') or 'bad' when stock == 0).
 *  - Search by name and/or filter by category is a plus.
 *
 * Item categories used in seed data: Food & Water, Medicine, Shelter, Hygiene,
 * Clothing, Energy — reuse these for new items (the dashboard chart groups by them).
 */
App.registerModule({
  id: 'inventory', title: 'Inventory', icon: '📦', order: 2,
  subtitle: 'Warehouse stock and reorder levels',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Inventory module — pending implementation by Eshaal.');
  },
});
