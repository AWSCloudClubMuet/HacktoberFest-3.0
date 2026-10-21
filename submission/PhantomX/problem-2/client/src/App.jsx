import { useEffect, useState } from 'react';
import { api, getCurrentUserId, setCurrentUserId } from './api.js';
import { Link } from './components.jsx';
import { AppContext } from './context.js';
import { GigsPage } from './pages/GigsPage.jsx';
import { GigDetailPage } from './pages/GigDetailPage.jsx';
import { CreateGigPage } from './pages/CreateGigPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';

function useRoute() {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(to) {
    const next = normalize(to);
    if (next !== window.location.pathname) {
      window.history.pushState({}, '', next);
    }
    setPath(next);
    window.scrollTo(0, 0);
  }

  return { path, navigate };
}

function normalize(path) {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '');
}

function matchRoute(path) {
  if (path === '/') return { name: 'gigs' };
  if (path === '/gigs/new') return { name: 'create' };
  if (path === '/applications') return { name: 'applications' };
  if (path === '/profile') return { name: 'profile' };
  const gig = path.match(/^\/gigs\/([^/]+)$/);
  if (gig) return { name: 'gig', id: decodeURIComponent(gig[1]) };
  const user = path.match(/^\/users\/([^/]+)$/);
  if (user) return { name: 'profile', userId: decodeURIComponent(user[1]) };
  return { name: 'missing' };
}

const nav = [
  { to: '/', label: 'Gigs' },
  { to: '/gigs/new', label: 'Post a gig' },
  { to: '/applications', label: 'My applications' },
  { to: '/profile', label: 'Profile' },
];

export function App() {
  const { path, navigate } = useRoute();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [bootError, setBootError] = useState('');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api('/users')
      .then((list) => {
        if (cancelled) return;
        const saved = getCurrentUserId();
        const next = list.some((user) => user.id === saved) ? saved : list[0]?.id || '';
        setCurrentUserId(next);
        setUsers(list);
        setUserId(next);
      })
      .catch((error) => {
        if (!cancelled) setBootError(error.message);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectUser(id) {
    setCurrentUserId(id);
    setUserId(id);
  }

  const route = matchRoute(path);
  let page = <p className="text-sm text-stone-600">That page does not exist.</p>;
  if (booting) page = <p className="text-sm text-stone-500">Loading students…</p>;
  else if (bootError) page = <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{bootError}</p>;
  else if (!userId) page = <p className="text-sm text-stone-600">No students are available.</p>;
  else if (route.name === 'gigs') page = <GigsPage key={userId} />;
  else if (route.name === 'create') page = <CreateGigPage key={userId} />;
  else if (route.name === 'gig') page = <GigDetailPage key={`${userId}-${route.id}`} gigId={route.id} />;
  else if (route.name === 'applications') page = <ApplicationsPage key={userId} />;
  else if (route.name === 'profile') page = <ProfilePage key={`${userId}-${route.userId || 'me'}`} profileId={route.userId || userId} />;

  return (
    <AppContext.Provider value={{ path, navigate, userId, users, selectUser }}>
      <div className="min-h-screen">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
            <Link to="/" className="text-lg font-semibold tracking-tight text-teal-900">
              Campus Gig
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-md px-3 py-1.5 ${path === item.to ? 'bg-teal-800 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <label className="ml-auto flex items-center gap-2 text-sm text-stone-600">
              <span className="font-medium">Current student</span>
              <select
                className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-stone-900"
                value={userId}
                disabled={!users.length}
                onChange={(event) => selectUser(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.major}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{page}</main>
      </div>
    </AppContext.Provider>
  );
}
