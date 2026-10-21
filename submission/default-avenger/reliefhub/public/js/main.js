/* ReliefHub bootstrap: auth, routing, global events */
const view = () => $('#view');
const NAV = [
  ['dashboard', 'Overview', 'M3 3h7v7H3z M14 3h7v4h-7z M14 10h7v11h-7z M3 14h7v7H3z'],
  ['camps', 'Relief camps', 'M3 20h18 M5 20V9l7-5 7 5v11 M9 20v-6h6v6'],
  ['needs', 'Camp needs', 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01'],
  ['inventory', 'Inventory', 'M12 3 3 8l9 5 9-5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5'],
  ['dispatches', 'Dispatches', 'M3 7h11v10H3z M14 10h4l3 3v4h-7z M7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  ['donations', 'Donations', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z'],
  ['volunteers', 'Volunteers', 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M20 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],
];
const NAV_GROUPS = [['OPERATIONS', ['dashboard', 'camps', 'needs']], ['RESOURCES', ['inventory', 'dispatches', 'donations', 'volunteers']]];

async function route() {
  if (!Session.user) return;
  const [name = 'dashboard', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const page = pages[name] ? name : 'dashboard';
  document.body.classList.remove('nav-open'); onFilter = null;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.p === page));
  $('#crumb').textContent = NAV.find(([key]) => key === page)?.[1] || 'Overview';
  $('#menu').setAttribute('aria-expanded', 'false');
  view().innerHTML = loading();
  try { await pages[page](arg); }
  catch (e) { view().innerHTML = empty('Something went wrong', e.message) + `<p class="center">${btn('retry', 'Retry')}</p>`; toast(e.message, 'err'); }
}
const refresh = route;

function showApp() {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#uname').textContent = Session.user.name; $('#urole').textContent = isAdmin() ? 'Relief Coordinator (Admin)' : 'Field Volunteer';
  $('#profileName').textContent = Session.user.name;
  $('#profileRole').textContent = isAdmin() ? 'Relief Coordinator · Admin' : 'Field Volunteer';
  const initials = Session.user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  $('#profileInitials').textContent = initials;
  $('#userAvatar').textContent = initials;
  $('#nav').innerHTML = NAV_GROUPS.map(([group, keys]) =>
    `<div class="nav-group"><span class="nav-label">${group}</span>${keys.map(key => {
      const [, label, path] = NAV.find(([id]) => id === key);
      return `<a href="#/${key}" data-p="${key}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg><span>${label}</span></a>`;
    }).join('')}</div>`).join('');
  route();
}
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }

let searchTimer, searchRun = 0;
const closeSearch = () => {
  $('#searchResults').hidden = true;
  $('#globalSearch').setAttribute('aria-expanded', 'false');
};
function renderSearchResults(items, query, error = false) {
  const results = $('#searchResults');
  if (error) {
    results.innerHTML = '<div class="search-empty">Search is temporarily unavailable. Please try again.</div>';
  } else if (!items.length) {
    results.innerHTML = `<div class="search-empty">No camps, supplies or volunteers match “${esc(query)}”.</div>`;
  } else {
    results.innerHTML = items.map(item => `<a href="#/${item.page}" data-search-type="${item.type}" data-search-query="${esc(item.query)}"><span class="search-result-icon">${item.icon}</span><span class="search-result-copy"><strong>${esc(item.name)}</strong><small>${esc(item.meta)}</small></span><span class="search-result-kind">${item.kind}</span></a>`).join('');
  }
  results.hidden = false;
  $('#globalSearch').setAttribute('aria-expanded', 'true');
}
$('#globalSearch').addEventListener('input', e => {
  const query = e.target.value.trim(), run = ++searchRun;
  clearTimeout(searchTimer);
  if (query.length < 2) { closeSearch(); return; }
  searchTimer = setTimeout(async () => {
    try {
      const [camps, inventory, volunteers] = await Promise.all([
        DB.list('camps'), DB.list('inventory'), DB.list('volunteers'),
      ]);
      if (run !== searchRun) return;
      const matches = [];
      const has = value => String(value ?? '').toLowerCase().includes(query.toLowerCase());
      camps.filter(c => has(c.name) || has(c.district)).slice(0, 4).forEach(c => matches.push({
        type: 'camps', page: 'camps', query: c.name, name: c.name, meta: `${c.district} · ${c.families} / ${c.capacity} families`, kind: 'CAMP', icon: '⌂',
      }));
      inventory.filter(i => has(i.name) || has(i.category)).slice(0, 4).forEach(i => matches.push({
        type: 'inv', page: 'inventory', query: i.name, name: i.name, meta: `${i.category} · ${i.stock} ${i.unit} available`, kind: 'SUPPLY', icon: '◇',
      }));
      volunteers.filter(v => has(v.name) || has(v.skill) || has(v.phone)).slice(0, 4).forEach(v => matches.push({
        type: 'vol', page: 'volunteers', query: v.name, name: v.name, meta: `${v.skill} · ${v.phone}`, kind: 'VOLUNTEER', icon: '◎',
      }));
      renderSearchResults(matches.slice(0, 8), query);
    } catch (error) {
      if (run !== searchRun) return;
      renderSearchResults([], query, true);
      toast(error.message, 'err');
    }
  }, 180);
});
$('#globalSearch').addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSearch(); e.target.blur(); }
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#globalSearch').focus();
  }
});
$('#globalSearch').addEventListener('click', e => e.stopPropagation());
$('#notificationsToggle').onclick = () => {
  const menu = $('#notificationsMenu'), open = menu.hidden;
  menu.hidden = !open;
  $('#notificationsToggle').setAttribute('aria-expanded', String(open));
};
$('#profileToggle').onclick = () => {
  const menu = $('#profileMenu'), open = menu.hidden;
  menu.hidden = !open;
  $('#profileToggle').setAttribute('aria-expanded', String(open));
};
document.addEventListener('click', e => {
  if (!e.target.closest('.global-search')) closeSearch();
  if (!e.target.closest('#notificationsToggle') && !e.target.closest('#notificationsMenu')) {
    $('#notificationsMenu').hidden = true;
    $('#notificationsToggle').setAttribute('aria-expanded', 'false');
  }
  if (!e.target.closest('#profileToggle') && !e.target.closest('#profileMenu')) {
    $('#profileMenu').hidden = true;
    $('#profileToggle').setAttribute('aria-expanded', 'false');
  }
  const result = e.target.closest('[data-search-type]');
  if (!result) return;
  searchRun++;
  clearTimeout(searchTimer);
  const filterKey = result.dataset.searchType;
  F[filterKey].q = result.dataset.searchQuery;
  $('#globalSearch').value = '';
  closeSearch();
});

let authMode = 'login';
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup', form = $('#loginForm');
  form.classList.toggle('is-signup', signup);
  $('#authTitle').textContent = signup ? 'Join the response' : 'Welcome back';
  $('#authSubtitle').textContent = signup ? 'Create your volunteer workspace in a few steps.' : 'Sign in to continue coordinating relief.';
  $('#authPrompt').textContent = signup ? 'Already have an account?' : 'New to ReliefHub?';
  $('#authToggleText').textContent = signup ? 'Sign in instead' : 'Create volunteer account';
  $('#authSubmit').querySelector('span').textContent = signup ? 'Create account' : 'Sign in';
  $('#passwordLabel').textContent = signup ? 'Create password' : 'Password';
  $('#p').autocomplete = signup ? 'new-password' : 'current-password';
  $('#p').placeholder = signup ? 'At least 8 characters' : 'Enter your password';
  $('#signupFields').hidden = !signup;
  $('#confirmPasswordField').hidden = !signup;
  $('#demoAccounts').hidden = signup;
  $('#u').closest('label').hidden = signup;
  $('#u').required = !signup;
  $('#signupName').required = signup;
  $('#signupUsername').required = signup;
  $('#p').minLength = signup ? 8 : 0;
  $('#signupConfirm').required = signup;
  $('#signupConfirm').minLength = signup ? 8 : 0;
  $('#loginErr').hidden = true;
  if (signup) $('#signupName').focus();
  else $('#u').focus();
}
$('#authToggle').onclick = () => setAuthMode(authMode === 'login' ? 'signup' : 'login');
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const err = $('#loginErr'), submit = $('#authSubmit');
  err.hidden = true; submit.disabled = true;
  const buttonLabel = authMode === 'signup' ? 'Creating account…' : 'Signing in…';
  submit.querySelector('span').textContent = buttonLabel;
  try {
    if (authMode === 'signup' && $('#signupConfirm').value !== $('#p').value)
      throw new Error('Your passwords do not match.');
    Session.user = authMode === 'signup'
      ? await Svc.signup({ name: $('#signupName').value, username: $('#signupUsername').value, password: $('#p').value })
      : await Svc.login($('#u').value.trim(), $('#p').value);
    localStorage.setItem('rh_user', JSON.stringify(Session.user));
    location.hash = '#/dashboard';
    showApp();
    if (authMode === 'signup') toast('Your volunteer account is ready. Welcome to ReliefHub.');
  } catch (error) {
    Session.user = null;
    err.textContent = error.message;
    err.hidden = false;
    submit.disabled = false;
    submit.querySelector('span').textContent = authMode === 'signup' ? 'Create account' : 'Sign in';
  }
};
document.querySelectorAll('.chip').forEach(c => c.onclick = () => { $('#u').value = c.dataset.u; $('#p').value = c.dataset.p; });
$('#logout').onclick = () => { localStorage.removeItem('rh_user'); Session.user = null; setAuthMode('login'); showLogin(); };
$('#menu').onclick = () => {
  if (window.innerWidth > 900) {
    document.body.classList.toggle('sidebar-collapsed');
    $('#menu').setAttribute('aria-expanded', String(!document.body.classList.contains('sidebar-collapsed')));
  } else {
    document.body.classList.toggle('nav-open');
    $('#menu').setAttribute('aria-expanded', String(document.body.classList.contains('nav-open')));
  }
};
$('#navScrim').onclick = () => {
  document.body.classList.remove('nav-open');
  $('#menu').setAttribute('aria-expanded', 'false');
};
window.addEventListener('hashchange', route);

document.addEventListener('click', async e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  try { if (a.dataset.act === 'retry') return route(); await ACT[a.dataset.act]?.({ ...a.dataset }); }
  catch (x) { toast(x.message, 'err'); }
});
let timer;
document.addEventListener('input', e => {
  const k = e.target.dataset?.f; if (!k || !onFilter) return;
  const [p, n] = k.split('.'); F[p][n] = e.target.value; clearTimeout(timer); timer = setTimeout(() => onFilter()?.catch?.(x => toast(x.message, 'err')), 250);
});
document.addEventListener('change', e => { if (e.target.dataset?.nav) location.hash = `#/${e.target.dataset.nav}/${e.target.value}`; });

try { Session.user = JSON.parse(localStorage.getItem('rh_user')); } catch { Session.user = null; }
Session.user ? showApp() : showLogin();
