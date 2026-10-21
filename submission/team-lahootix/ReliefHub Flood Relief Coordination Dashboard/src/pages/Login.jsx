import React, { useState } from 'react';
import { useRole, USERS } from '../context/RoleContext';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HeartHandshake,
  Monitor,
  Moon,
  Stethoscope,
  Sun,
  UserRound,
  UsersRound,
  Waves,
} from 'lucide-react';

/* Map roles → accent color token */
const ROLE_META = {
  'Relief Coordinator (Admin)': { color: '#c5f135', bg: 'rgba(197,241,53,0.12)', border: 'rgba(197,241,53,0.4)',  label: 'Full Access', Icon: HeartHandshake },
  'Field Volunteer':            { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.4)', label: 'Camp Ops', Icon: UsersRound },
  'Medical Lead':               { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)',label: 'Medical', Icon: Stethoscope },
  'District Observer':          { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.4)', label: 'Read-only', Icon: UserRound },
};

export function Login() {
  const { login } = useRole();
  const { mode, setMode } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  /* Quick-fill from credential card */
  function quickFill(user) {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    /* Tiny artificial delay for UX */
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon"><Waves size={24} strokeWidth={2.5} /></div>
          <div>
            <div className="login-brand-name">ReliefHub</div>
            <div className="login-brand-sub">Sindh Flood Relief OS</div>
          </div>
        </div>

        <div className="login-hero-text">
          <p className="login-eyebrow">ONE PLATFORM. ONE CLEAR PICTURE.</p>
          <h1 className="login-heading">
            From depot<br />
            to <span className="login-heading-accent">doorstep.</span>
          </h1>
          <p className="login-desc">
            Coordinate emergency camps, track aid dispatches, and close
            critical supply gaps — all from a single command dashboard.
          </p>
        </div>

        {/* Stats strip */}
        <div className="login-stats">
          <div className="login-stat">
            <span className="login-stat-val">8</span>
            <span className="login-stat-label">Active Camps</span>
          </div>
          <div className="login-stat-divider" />
          <div className="login-stat">
            <span className="login-stat-val">2,440</span>
            <span className="login-stat-label">Families Sheltered</span>
          </div>
          <div className="login-stat-divider" />
          <div className="login-stat">
            <span className="login-stat-val">4</span>
            <span className="login-stat-label">Districts Covered</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Sign in</h2>
            <p className="login-card-sub">Access your relief dashboard</p>
          </div>

          {/* Theme switcher */}
          <div className="login-theme-row" role="group" aria-label="Theme mode switcher">
            <button
              type="button"
              className={`login-theme-btn ${mode === 'light' ? 'active' : ''}`}
              onClick={() => setMode('light')}
              title="Light mode"
            >
              <Sun size={14} /> Light
            </button>
            <button
              type="button"
              className={`login-theme-btn ${mode === 'dark' ? 'active' : ''}`}
              onClick={() => setMode('dark')}
              title="Dark mode"
            >
              <Moon size={14} /> Dark
            </button>
            <button
              type="button"
              className={`login-theme-btn ${mode === 'system' ? 'active' : ''}`}
              onClick={() => setMode('system')}
              title="System default"
            >
              <Monitor size={14} /> System
            </button>
          </div>

          {/* Quick-access role cards */}
          <div className="login-role-grid">
            {USERS.map(user => {
              const meta = ROLE_META[user.role] || ROLE_META['District Observer'];
              const RoleIcon = meta.Icon;
              const isSelected = email === user.email;
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`login-role-card ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? {
                    background: meta.bg,
                    borderColor: meta.border,
                  } : {}}
                  onClick={() => quickFill(user)}
                  title={`Sign in as ${user.name}`}
                >
                  <span className="login-role-avatar"><RoleIcon size={18} /></span>
                  <div className="login-role-info">
                    <span className="login-role-name">{user.name}</span>
                    <span
                      className="login-role-tag"
                      style={isSelected ? { color: meta.color, borderColor: meta.border } : {}}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="login-role-check" style={{ color: meta.color }}><Check size={16} /></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="login-divider">
            <span>or sign in manually</span>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="login-error-banner" role="alert">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@reliefhub.pk"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute', right: '0.85rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: '1rem',
                    color: 'var(--text-muted)', padding: 0,
                  }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem 1rem', fontSize: '0.9rem', marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span className="login-spinner" /> Signing in…
                </span>
              ) : <span className="button-label">Sign in <ArrowRight size={16} /></span>}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="login-cred-hint">
            <p className="login-cred-title">Demo Credentials</p>
            <div className="login-cred-list">
              {USERS.map(u => (
                <div key={u.id} className="login-cred-row">
                  <span className="login-cred-email">{u.email}</span>
                  <span className="login-cred-pw">{u.password}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
