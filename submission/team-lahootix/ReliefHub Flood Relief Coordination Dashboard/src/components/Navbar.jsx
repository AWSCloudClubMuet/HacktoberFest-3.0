import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { useTheme } from '../context/ThemeContext';
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Monitor,
  Moon,
  PackageCheck,
  Sun,
  Truck,
  UserRound,
  UsersRound,
  Waves,
} from 'lucide-react';

const ROLE_COLOR = {
  'Relief Coordinator (Admin)': '#c5f135',
  'Field Volunteer':            '#38bdf8',
  'Medical Lead':               '#f87171',
  'District Observer':          '#fbbf24',
};

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',  end: true, icon: LayoutDashboard },
  { to: '/camps',      label: 'Camps', icon: Building2 },
  { to: '/inventory',  label: 'Inventory', icon: Boxes },
  { to: '/dispatches', label: 'Dispatches', icon: Truck },
  { to: '/donations',  label: 'Donations', icon: PackageCheck },
  { to: '/volunteers', label: 'Volunteers', icon: UsersRound },
];

export function Navbar() {
  const { session, logout, role } = useRole();
  const { mode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const accentColor = ROLE_COLOR[role] || '#c5f135';

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <div className="brand-icon"><Waves size={19} strokeWidth={2.5} /></div>
          <div className="brand-title">
            ReliefHub
            <span className="brand-badge">Sindh Response</span>
          </div>
        </NavLink>

        {/* Navigation Links (Desktop) */}
        <ul className="nav-links">
          {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} /> {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div className="navbar-user">
          {/* Theme Mode Switcher */}
          <div className="theme-toggle" role="group" aria-label="Theme mode switcher">
            <button
              type="button"
              className={`theme-btn ${mode === 'light' ? 'active' : ''}`}
              onClick={() => setMode('light')}
              title="Light theme"
              aria-label="Light mode"
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              className={`theme-btn ${mode === 'dark' ? 'active' : ''}`}
              onClick={() => setMode('dark')}
              title="Dark theme"
              aria-label="Dark mode"
            >
              <Moon size={14} />
            </button>
            <button
              type="button"
              className={`theme-btn ${mode === 'system' ? 'active' : ''}`}
              onClick={() => setMode('system')}
              title="System theme"
              aria-label="System mode"
            >
              <Monitor size={14} />
            </button>
          </div>

          {/* User chip */}
          <div className="navbar-user-chip">
            <span className="navbar-avatar"><UserRound size={15} /></span>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{session?.name || 'User'}</span>
              <span
                className="navbar-user-role"
                style={{ color: accentColor }}
              >
                {role}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            className="navbar-logout-btn"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={`hamburger ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} role="navigation" aria-label="Mobile Navigation">
        {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
