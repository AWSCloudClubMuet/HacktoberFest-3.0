/* MODULE: Camp Management (Milestone 1) — OWNER: Eshaal (@Eshaal607)
 *
 * Rules from the issue:
 *  - Roles: Relief Coordinator (Admin) and Field Volunteer. Only Coordinators may
 *    create/edit/delete — gate every mutating control behind App.canEdit().
 *  - Camp fields: name, district, capacity, current_families, status.
 *    Validate: name/district non-empty, capacity > 0, current_families >= 0,
 *    current_families may exceed capacity but then the camp must show Full.
 *  - Search camps by name OR district (single search box matches either),
 *    plus a status filter dropdown (All/Active/Full/Closed).
 *  - Automatically mark a camp "Full" when current_families reaches capacity,
 *    and revert to "Active" when it drops below (never auto-change "Closed").
 *
 * Available helpers: API.list/create/update/remove('camps', ...), UI.table/form/
 * badge/statusBadge/confirm/toast, UI.pct(). Status values: Active | Full | Closed.
 */
App.registerModule({
  id: 'camps', title: 'Camps', icon: '⛺', order: 1,
  subtitle: 'Camp registry — search, status and capacity management',
  async render() {
    return UI.h('p', { class: 'empty' }, 'Camps module — pending implementation by Eshaal.');
  },
});
