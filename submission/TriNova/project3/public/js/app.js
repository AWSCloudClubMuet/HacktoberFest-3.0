/* App shell: menu, role switch, hash router. */
(function () {
  'use strict';
  const L = window.Logic;

  const MENU = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'camps', label: 'Camps' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'needs', label: 'Needs' },
    { id: 'dispatches', label: 'Dispatches' },
    { id: 'donations', label: 'Donations' },
    { id: 'volunteers', label: 'Volunteers' },
  ];

  const sidebar = document.getElementById('sidebar');
  const view = document.getElementById('view');
  const roleSelect = document.getElementById('roleSelect');

  function currentRoute() {
    const id = (location.hash || '').replace(/^#\/?/, '');
    return MENU.some((m) => m.id === id) ? id : 'camps';
  }

  function renderMenu(active) {
    sidebar.innerHTML = MENU.map((m) =>
      `<a href="#/${m.id}" class="${m.id === active ? 'active' : ''}">${m.label}</a>`).join('');
  }

  function renderPlaceholder(id) {
    const item = MENU.find((m) => m.id === id);
    view.innerHTML = `<div class="page-head"><h1>${window.UI.esc(item.label)}</h1></div>
      <div class="card placeholder">This screen is coming in a later step.</div>`;
  }

  async function route() {
    const id = currentRoute();
    renderMenu(id);
    sidebar.classList.remove('open');
    const v = window.Views && window.Views[id];
    if (v) {
      try { await v.render(view); }
      catch (err) { view.innerHTML = `<div class="card error-box">${window.UI.esc(err.message)}</div>`; }
    } else {
      renderPlaceholder(id);
    }
  }

  roleSelect.value = window.Api.getRole();
  roleSelect.title = L.ROLES[roleSelect.value];
  roleSelect.addEventListener('change', () => {
    window.Api.setRole(roleSelect.value);
    window.UI.toast('Now working as ' + L.ROLES[window.Api.getRole()]);
    route();                                   // re-render so buttons match the new role
  });
  document.getElementById('menuToggle').addEventListener('click', () => sidebar.classList.toggle('open'));
  window.addEventListener('hashchange', route);
  route();
})();