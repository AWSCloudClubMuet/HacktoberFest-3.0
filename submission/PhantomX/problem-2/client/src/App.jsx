import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { Link, buttonClass, secondaryButtonClass } from './components.jsx';
import { AppContext, AuthContext } from './context.js';
import { SECTIONS, parseSearch, readSection, sectionFromPath, toQuery, writeSection } from './section.js';
import { SearchDock, SectionTabs } from './ui.jsx';
import { GigsPage } from './pages/GigsPage.jsx';
import { GigDetailPage } from './pages/GigDetailPage.jsx';
import { CreateGigPage } from './pages/CreateGigPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';
import { MyGigsPage } from './pages/MyGigsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';

function useRoute() {
  const initial = splitTarget(window.location.pathname + window.location.search);
  const [path, setPath] = useState(initial.path);
  const [query, setQuery] = useState(initial.query);

  useEffect(() => {
    const onPop = () => {
      const next = splitTarget(window.location.pathname + window.location.search);
      setPath(next.path);
      setQuery(next.query);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(to, options = {}) {
    const next = splitTarget(to);
    const target = next.path + next.query + next.hash;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (target !== current) {
      window.history[options.replace ? 'replaceState' : 'pushState']({}, '', target);
    }
    setPath(next.path);
    setQuery(next.query);
    if (!next.hash) window.scrollTo(0, 0);
  }

  return { path, query, navigate };
}

function splitTarget(to) {
  const raw = String(to || '/');
  const hashAt = raw.indexOf('#');
  const hash = hashAt === -1 ? '' : raw.slice(hashAt);
  const withoutHash = hashAt === -1 ? raw : raw.slice(0, hashAt);
  const mark = withoutHash.indexOf('?');
  const pathname = mark === -1 ? withoutHash : withoutHash.slice(0, mark);
  const query = mark === -1 ? '' : withoutHash.slice(mark);
  return { path: normalize(pathname), query, hash };
}

function normalize(path) {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '');
}

function matchRoute(path) {
  if (path === '/' || path === '/offer' || path === '/request') return { name: 'gigs' };
  if (path === '/login') return { name: 'login' };
  if (path === '/signup') return { name: 'signup' };
  if (path === '/gigs/new') return { name: 'create' };
  if (path === '/applications') return { name: 'applications' };
  if (path === '/my-gigs') return { name: 'my-gigs' };
  if (path === '/profile') return { name: 'profile' };
  const gig = path.match(/^\/gigs\/([^/]+)$/);
  if (gig) return { name: 'gig', id: decodeURIComponent(gig[1]) };
  const user = path.match(/^\/users\/([^/]+)$/);
  if (user) return { name: 'profile', userId: decodeURIComponent(user[1]) };
  return { name: 'missing' };
}

const nav = [
  { to: '/my-gigs', label: 'My gigs' },
  { to: '/applications', label: 'My applications' },
  { to: '/profile', label: 'Profile' },
];

function navClass(active) {
  return `flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition duration-150 ${active ? 'bg-white/15 text-on-night' : 'text-on-night-muted hover:bg-white/10 hover:text-on-night'}`;
}

export function App() {
  const { path, query, navigate } = useRoute();
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [section, setSection] = useState(() => sectionFromPath(normalize(window.location.pathname)) || readSection());
  const userId = user?.id || '';

  function chooseSection(next, goCatalogue = false) {
    const safe = writeSection(next);
    setSection(safe);
    if (goCatalogue) navigate(`/${safe}`);
  }

  function pushToast(tone, message) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setBooting(false);
      return undefined;
    }
    api('/auth/me')
      .then(async (me) => {
        if (cancelled) return;
        setUser(me);
        const list = await api('/users');
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) {
          setToken('');
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function establish(data) {
    setToken(data.token);
    setUser(data.user);
    const list = await api('/users');
    setUsers(list);
    return data.user;
  }

  function login(email, password) {
    return api('/auth/login', { method: 'POST', body: { email, password } }).then(establish);
  }

  function signup(payload) {
    return api('/auth/signup', { method: 'POST', body: payload }).then(establish);
  }

  function logout() {
    setToken('');
    setUser(null);
    setUsers([]);
    navigate('/login');
  }

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [path, query]);

  useEffect(() => {
    const fromPath = sectionFromPath(path);
    if (fromPath) {
      setSection(fromPath);
      writeSection(fromPath);
    }
  }, [path]);

  const route = matchRoute(path);
  const isPublic = route.name === 'login' || route.name === 'signup';

  useEffect(() => {
    if (booting) return;
    if (!user && !isPublic) navigate('/login');
    else if (user && (isPublic || path === '/')) navigate(`/${readSection()}`, { replace: path === '/' });
  }, [booting, user, isPublic, path]);

  let page = <p className="text-sm text-muted">That page does not exist.</p>;
  if (booting) page = <p className="text-sm text-muted">Loading…</p>;
  else if (route.name === 'login') page = <LoginPage />;
  else if (route.name === 'signup') page = <SignupPage />;
  else if (!user) page = <p className="text-sm text-muted">Redirecting to login…</p>;
  else if (route.name === 'gigs') page = <GigsPage key={userId} />;
  else if (route.name === 'create') page = <CreateGigPage key={`${userId}-${section}-${query}`} />;
  else if (route.name === 'gig') page = <GigDetailPage key={`${userId}-${route.id}`} gigId={route.id} />;
  else if (route.name === 'applications') page = <ApplicationsPage key={userId} />;
  else if (route.name === 'my-gigs') page = <MyGigsPage key={userId} />;
  else if (route.name === 'profile') page = <ProfilePage key={`${userId}-${route.userId || 'me'}`} profileId={route.userId || userId} />;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
    <AppContext.Provider value={{ path, query, navigate, userId, users, pushToast, section, chooseSection }}>
      <div className="min-h-screen">
        <header className="site-header sticky top-0 z-40 border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <Link to={user ? `/${section}` : '/login'} className="flex min-h-11 min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-on-night">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl fill-offer text-sm text-white" aria-hidden="true">CG</span>
              <span className="truncate">Campus Gig</span>
            </Link>
            {user && !isPublic ? (
              <SearchDock
                section={section}
                filters={parseSearch(query)}
                open={searchOpen}
                onOpen={() => setSearchOpen(true)}
                onClose={() => setSearchOpen(false)}
                onApply={(draft) => {
                  setSearchOpen(false);
                  navigate(`/${section}${toQuery({ ...draft, group: '' })}`);
                }}
                onClear={() => {
                  setSearchOpen(false);
                  navigate(`/${section}`);
                }}
              />
            ) : null}
            {user && !isPublic ? (
              <Link to={`/gigs/new?type=${SECTIONS[section].postType}`} className={`${buttonClass} hidden px-4 sm:inline-flex ${section === 'request' ? 'fill-request' : ''}`}>
                {SECTIONS[section].post}
              </Link>
            ) : null}
            {user ? (
              <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Primary">
                {nav.map((item) => (
                  <Link key={item.to} to={item.to} className={navClass(path === item.to)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : (
              <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Account">
                <Link to="/login" className={navClass(path === '/login')}>Log in</Link>
                <Link to="/signup" className={navClass(path === '/signup')}>Sign up</Link>
              </nav>
            )}
            {user ? (
              <div className="ml-auto hidden min-w-0 items-center gap-3 lg:flex">
                <span className="max-w-40 truncate text-sm font-semibold text-on-night">{user.name}</span>
                <button type="button" className={secondaryButtonClass} onClick={logout}>Log out</button>
              </div>
            ) : null}
            <button
              type="button"
              className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 text-on-night lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
                </svg>
              )}
            </button>
          </div>
          <div id="site-menu" className="menu-panel lg:hidden" data-open={menuOpen ? 'true' : 'false'} inert={menuOpen ? undefined : true}>
            <div>
              <nav className="flex flex-col gap-1 px-4 pb-4 sm:px-6" aria-label={user ? 'Primary' : 'Account'}>
                {user ? nav.map((item) => (
                  <Link key={item.to} to={item.to} className={navClass(path === item.to)}>
                    {item.label}
                  </Link>
                )) : (
                  <>
                    <Link to="/login" className={navClass(path === '/login')}>Log in</Link>
                    <Link to="/signup" className={navClass(path === '/signup')}>Sign up</Link>
                  </>
                )}
                {user ? (
                  <div className="mt-2 flex flex-col gap-2 border-t border-white/15 pt-3">
                    <p className="truncate px-3 text-sm font-semibold text-on-night">{user.name}</p>
                    <button type="button" className={`${secondaryButtonClass} w-full`} onClick={logout}>Log out</button>
                  </div>
                ) : null}
              </nav>
            </div>
          </div>
          {user && !isPublic ? (
            <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
              <SectionTabs value={section} onChange={(next) => chooseSection(next, true)} />
            </div>
          ) : null}
        </header>
        <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{page}</main>
        <div className="toast-stack pointer-events-none fixed inset-x-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
          {toasts.map((toast) => (
            <p
              key={toast.id}
              role="status"
              className={`toast-in pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm font-medium shadow-pop ${toast.tone === 'error' ? 'border-danger-line bg-danger-soft text-danger' : 'border-success-line bg-success-soft text-success'}`}
            >
              {toast.message}
            </p>
          ))}
        </div>
      </div>
    </AppContext.Provider>
    </AuthContext.Provider>
  );
}
