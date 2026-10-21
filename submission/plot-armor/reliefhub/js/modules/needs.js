/* MODULE: Camp Needs (Milestone 2, part B) — OWNER: Eshaal (@Eshaal607)
 *
 * Rules from the issue:
 *  - Add, edit and remove a camp's needs. Each need links a camp to an inventory
 *    item: camp_id + inventory_item_id + required_quantity + priority (High/
 *    Medium/Low) + fulfilled_quantity (starts at 0 for new needs).
 *  - Show need fulfilment progress: fulfilled ÷ required as a progress bar
 *    (CSS classes .progress > div, set inner width to the %) plus the % text.
 *  - Validation: required_quantity > 0, camp and item must be selected.
 *  - Filter/sort by camp, priority, or fulfilment level is a plus.
 *
 * NOTE: fulfilled_quantity is advanced by Delivered dispatches (Anusha's module).
 * Read it, render it, but do not mutate it from this module.
 */
App.registerModule({
  id: 'needs', title: 'Camp Needs', icon: '🧾', order: 3,
  subtitle: 'Unmet demand per camp with fulfilment progress',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Needs module — pending implementation by Eshaal.');
  },
});
