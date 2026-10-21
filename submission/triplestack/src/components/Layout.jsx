import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROLES, isLowStock, isCriticalGap } from '../../shared/domain.js';
import { api, API_URL } from '../api/client.js';
import { useAction, useData } from '../state/DataContext.jsx';
import { Icon } from './Icon.jsx';
import { Button, Notice, Spinner, fmtTime } from './ui.jsx';
import { useConfirm } from './Modal.jsx';
import { Logo, LogoMark } from './Logo.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/camps', label: 'Camps', icon: 'camp' },
  { to: '/needs', label: 'Camp Needs', icon: 'needs' },
  { to: '/inventory', label: 'Inventory', icon: 'box' },
  { to: '/dispatches', label: 'Dispatches', icon: 'truck' },
  { to: '/donations', label: 'Donations', icon: 'heart' },
  { to: '/volunteers', label: 'Volunteers', icon: 'users' },
];

function Sidebar({ onNavigate }) {
  const { inventory, needs, dispatches, role } = useData();
  const { run, busy } = useAction();
  const [confirmDialog, ask] = useConfirm();
  const counts = {
    '/needs': needs.filter(isCriticalGap).length,
    '/inventory': inventory.filter(isLowStock).length,
    '/dispatches': dispatches.filter((d) => d.status === 'Pending' || d.status === 'In Transit').length,
  };
  const countTitle = { '/needs': 'critical gaps', '/inventory': 'low-stock items', '/dispatches': 'open dispatches' };

  return (
    <div className="on-dark flex h-full flex-col bg-brand-900 text-brand-100">
      <div className="px-5 pb-6 pt-5">
        <Logo tone="dark" subtitle="Sindh flood response" />
      </div>
      <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-300/80">Operations</p>
      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white before:absolute before:inset-y-1.5 before:-left-3 before:w-1 before:rounded-r before:bg-teal-400'
                  : 'text-brand-200 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon name={item.icon} className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {counts[item.to] > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                  { '/needs': 'bg-red-500 text-white', '/inventory': 'bg-amber-400 text-amber-950' }[item.to] || 'bg-white/15 text-white'
                }`}
                title={`${counts[item.to]} ${countTitle[item.to]}`}
              >
                {counts[item.to]}
                <span className="sr-only"> {countTitle[item.to]}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <p className="flex items-center gap-2 px-3 text-xs text-brand-300">
          <Icon name="shield" className="h-3.5 w-3.5 text-teal-400" />
          {ROLES[role]} view
        </p>
      </div>
      {role === 'admin' && (
        <div className="-mt-3 px-4 pb-4">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              ask({
                title: 'Reset demo data?',
                message: 'This replaces every camp, need, item, dispatch, donation and volunteer with the original seed data. Changes made so far will be lost.',
                confirmLabel: 'Reset data',
                onConfirm: () => run(() => api.resetDemoData(), { success: 'Demo data restored from seed.' }),
              })
            }
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-brand-300 hover:bg-white/6 hover:text-white"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" /> Reset demo data
          </button>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useData();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-slate-500 sm:inline">Viewing as</span>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-md border border-slate-300 bg-white py-1.5 pl-2 pr-8 text-sm font-medium text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        aria-label="Role"
      >
        {Object.entries(ROLES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Layout() {
  const { status, error, reload, role, updatedAt } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Mobile drawer: Escape closes it, like the dialogs.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-72 max-w-[85%] shadow-xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="on-dark absolute right-3 top-6 rounded-md p-1 text-brand-200 hover:bg-white/10"
              aria-label="Close navigation"
              autoFocus
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setMenuOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 font-semibold text-brand-900 lg:hidden">
          <LogoMark className="h-7 w-7" />
          <span className="max-[419px]:sr-only">
            Relief<span className="text-teal-600">Hub</span>
          </span>
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex" title={API_URL}>
            <span className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : status === 'ready' ? 'bg-teal-500' : 'bg-slate-300'}`} />
            {error ? 'API unreachable' : status === 'ready' ? `Live · updated ${updatedAt ? fmtTime(updatedAt) : ''}` : 'Connecting…'}
          </span>
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} busy={refreshing} aria-label="Refresh data">
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <RoleSwitcher />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {role === 'volunteer' && (
          <Notice tone="info" className="mb-5">
            You are viewing as a <strong>Field Volunteer</strong>: you can update camp headcounts and mark dispatches In Transit or
            Delivered. Switch to Relief Coordinator for everything else.
          </Notice>
        )}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500" role="status">
            <Spinner className="h-5 w-5" /> Loading relief data…
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto max-w-xl py-16">
            <Notice tone="danger" title="Could not load data from the ReliefHub API">
              <p className="mt-1">{error?.message}</p>
              <p className="mt-2">
                Start it with <code className="rounded bg-red-100 px-1">npm run api</code> (or <code className="rounded bg-red-100 px-1">npm run dev</code> for
                both), then retry.
              </p>
              <Button className="mt-3" size="sm" icon="refresh" onClick={refresh} busy={refreshing}>
                Retry
              </Button>
            </Notice>
          </div>
        )}
        {status === 'ready' && (
          <>
            {error && (
              <Notice tone="danger" className="mb-5">
                <p>Lost connection to the API: {error.message} Data shown may be out of date.</p>
                <Button className="mt-2" size="sm" variant="secondary" icon="refresh" onClick={refresh} busy={refreshing}>
                  Retry
                </Button>
              </Notice>
            )}
            <Outlet />
          </>
        )}
      </main>
    </div>
  );
}
