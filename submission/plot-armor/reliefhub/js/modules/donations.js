/* MODULE: Donations (Milestone 4, part A) — OWNER: Syeda Anusha Ali (@SyedaAnushaAli)
 *
 * Rules from the issue:
 *  - Record Cash and In-Kind donations.
 *      * Cash: amount (number > 0) + category (e.g. General/Zakat/Sponsor).
 *      * In-Kind: pick an inventory item + quantity (> 0); recording it must
 *        INCREASE that item's stock (API.patch('inventory', itemId, {stock: ...})).
 *  - Show total cash received and totals per donation category (aggregate
 *    client-side from the donations collection; a small summary card row or
 *    table on top of the list).
 *  - Coordinator-only mutations (App.canEdit()); volunteers read-only.
 */
App.registerModule({
  id: 'donations', title: 'Donations', icon: '💰', order: 5,
  subtitle: 'Cash and in-kind contributions',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Donations module — pending implementation by Syeda Anusha Ali.');
  },
});
