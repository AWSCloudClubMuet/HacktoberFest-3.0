/* MODULE: Volunteers (Milestone 4, part B) — OWNER: Syeda Anusha Ali (@SyedaAnushaAli)
 *
 * Rules from the issue:
 *  - Register volunteers: name + skill. Skills are exactly:
 *    Medical, Logistics, Cooking, Driving, Counselling.
 *  - Search by name and filter by skill.
 *  - Assign / unassign volunteers to camps:
 *      * A volunteer may hold only ONE assignment at a time (camp_id is single).
 *      * Cannot be assigned to a Closed camp (validate against camp status).
 *  - Show assigned camp name in the list; badge or icon for assigned/available.
 *  - Coordinator-only mutations (App.canEdit()); volunteers read-only.
 */
App.registerModule({
  id: 'volunteers', title: 'Volunteers', icon: '🤝', order: 6,
  subtitle: 'Skills registry and camp assignments',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Volunteers module — pending implementation by Syeda Anusha Ali.');
  },
});
