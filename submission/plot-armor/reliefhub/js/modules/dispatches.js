/* MODULE: Dispatches & Stock Reservations (Milestone 3) — OWNER: Syeda Anusha Ali (@SyedaAnushaAli)
 *
 * Rules from the issue (this is the hardest module — the business rules matter):
 *  - Create a dispatch by choosing a camp, one of that camp's needs, and a quantity.
 *  - Reserve stock IMMEDIATELY on dispatch creation: model reservations by
 *    deducting the quantity from inventory stock (API.patch('inventory', itemId,
 *    { stock: newStock })). "Available stock" therefore == current item stock.
 *  - NEVER dispatch more than available stock (validate before create).
 *  - NEVER exceed the need's remaining unreserved quantity:
 *      required_quantity − fulfilled_quantity − SUM(quantity of that need's
 *      dispatches with status Pending or In Transit)
 *    (validate before create).
 *  - Statuses and transitions: Pending → In Transit → Delivered; Cancel allowed
 *    from Pending or In Transit only.
 *      * Mark Delivered: increase the need's fulfilled_quantity by the dispatch
 *        quantity (API.patch('needs', needId, {fulfilled_quantity: ...})).
 *      * Cancel (undelivered): restore the reserved stock (item.stock += quantity).
 *  - Status filter on the dispatch list (All/Pending/In Transit/Delivered/Cancelled).
 *  - Coordinator-only mutations (App.canEdit()); volunteers read-only.
 *
 * Helper: UI.statusBadge(status) already maps Pending=warn, In Transit=info,
 * Delivered=ok, Cancelled=muted.
 */
App.registerModule({
  id: 'dispatches', title: 'Dispatches', icon: '🚚', order: 4,
  subtitle: 'Stock reservations and deliveries to camps',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Dispatches module — pending implementation by Syeda Anusha Ali.');
  },
});
