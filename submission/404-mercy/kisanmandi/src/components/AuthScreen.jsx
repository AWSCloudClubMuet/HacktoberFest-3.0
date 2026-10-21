import React, { useState } from 'react';
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail } from '../services/supabase';
import { createUser, getUsers } from '../services/api';

const DISTRICTS = [
  'Hyderabad', 'Sukkur', 'Larkana', 'Mirpurkhas', 'Nawabshah',
  'Karachi', 'Thatta', 'Badin', 'Khairpur', 'Jacobabad',
  'Shikarpur', 'Dadu', 'Sanghar', 'Tharparkar',
];

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) return '0' + digits.slice(2);
  return digits;
}

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const isCloud = isSupabaseConfigured();

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [role, setRole] = useState('farmer');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const validateSignIn = () => {
    const errs = {};
    if (!loginEmail.trim()) {
      errs.loginEmail = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(loginEmail.trim())) {
      errs.loginEmail = 'Enter a valid email address';
    }
    if (!loginPassword) {
      errs.loginPassword = 'Password is required';
    }
    return errs;
  };

  const validateSignUp = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    const normPhone = normalizePhone(phone.trim());
    if (!phone.trim()) {
      errs.phone = 'Mobile number is required';
    } else if (!/^03[0-9]{9}$/.test(normPhone)) {
      errs.phone = 'Enter a valid Pakistani mobile number (e.g. 03001234567)';
    }
    if (!district) errs.district = 'Please select a district in Sindh';
    if (!regEmail.trim()) {
      errs.regEmail = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(regEmail.trim())) {
      errs.regEmail = 'Enter a valid email address';
    }
    if (!regPassword) {
      errs.regPassword = 'Password is required';
    } else if (regPassword.length < 6) {
      errs.regPassword = 'Password must be at least 6 characters';
    }
    if (regPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const errs = validateSignIn();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAuthError('');
    try {
      if (isCloud) {
        const { user, profile } = await signInWithEmail({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        });
        onAuthSuccess({
          ...profile,
          id: user.id,
          email: user.email,
          name: profile?.full_name || user.user_metadata?.full_name || loginEmail.split('@')[0],
          role: profile?.role || user.user_metadata?.role || 'farmer',
          phone: profile?.phone || '',
          district: profile?.district || 'Hyderabad',
        });
      } else {
        // Local fallback: lookup in JSON server users
        const users = await getUsers();
        const found = users.find(u => 
          (u.email && u.email.toLowerCase() === loginEmail.trim().toLowerCase()) ||
          u.phone === loginEmail.trim() ||
          u.name.toLowerCase() === loginEmail.trim().toLowerCase()
        );
        if (found) {
          onAuthSuccess(found);
        } else {
          // Allow login as demo user if matched
          throw new Error('User not found. In local mode, enter a seeded user phone (e.g. 03001234567) or create a new account.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const errs = validateSignUp();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAuthError('');
    setInfoMessage('');
    try {
      const cleanPhone = normalizePhone(phone.trim());
      if (isCloud) {
        const result = await signUpWithEmail({
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          fullName: fullName.trim(),
          phone: cleanPhone,
          district,
          role,
        });

        if (result.user && result.profile) {
          onAuthSuccess({
            ...result.profile,
            id: result.user.id,
            email: result.user.email,
            name: result.profile.full_name,
            role: result.profile.role,
            phone: result.profile.phone,
            district: result.profile.district,
          });
        } else {
          setInfoMessage('Account created! Please check your email inbox to confirm your address, or sign in.');
          setMode('signin');
        }
      } else {
        // Local fallback registration
        const newUser = await createUser({
          name: fullName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: cleanPhone,
          district,
          role,
        });
        onAuthSuccess(newUser);
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-wrap">
      <div className="onboard-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo-wrap">
          <img
            src="/images/kisanmandi-logo.png"
            alt="KisanMandi logo"
            className="auth-logo"
          />
        </div>
        <h1 className="onboard-title">KisanMandi</h1>
        <p className="onboard-sub">Sindh Agricultural Marketplace</p>

        {/* Backend mode pill */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span className={`pill ${isCloud ? 'pill-green' : 'pill-amber'}`} style={{ fontSize: '.72rem' }}>
            {isCloud ? '🟢 Live Cloud Backend (Supabase)' : '🟡 Local Development Mode'}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="tab-pills" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`tab-pill ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setAuthError(''); setErrors({}); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-pill ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setAuthError(''); setErrors({}); }}
          >
            Create Account
          </button>
        </div>

        {infoMessage && (
          <div style={{ background: 'var(--green-pale)', border: '1px solid var(--green-hover)', borderRadius: 'var(--radius-sm)', padding: '.6rem .75rem', fontSize: '.82rem', color: 'var(--green-dark)', marginBottom: '.75rem' }}>
            ✓ {infoMessage}
          </div>
        )}

        {authError && (
          <div style={{ background: 'var(--red-pale)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '.6rem .75rem', fontSize: '.82rem', color: 'var(--red)', marginBottom: '.75rem' }}>
            ⚠️ {authError}
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {isCloud ? 'Email Address' : 'Email, Phone, or Seeded Name'}
              </label>
              <input
                id="login-email"
                className={`form-control ${errors.loginEmail ? 'error' : ''}`}
                type={isCloud ? 'email' : 'text'}
                placeholder={isCloud ? 'farmer@example.com' : '03001234567 or email'}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                autoComplete="username"
              />
              {errors.loginEmail && <p className="form-error">{errors.loginEmail}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-pass">Password</label>
              <input
                id="login-pass"
                className={`form-control ${errors.loginPassword ? 'error' : ''}`}
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
              {errors.loginPassword && <p className="form-error">{errors.loginPassword}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '.5rem' }}>
              {loading ? 'Authenticating…' : 'Sign In →'}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className={`form-control ${errors.fullName ? 'error' : ''}`}
                type="text"
                placeholder="Muhammad Ali"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
              />
              {errors.fullName && <p className="form-error">{errors.fullName}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Mobile Number</label>
                <input
                  id="reg-phone"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-dist">District</label>
                <select
                  id="reg-dist"
                  className={`form-control ${errors.district ? 'error' : ''}`}
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                >
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="form-error">{errors.district}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I am registering as…</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === 'farmer' ? 'selected' : ''}`}
                  onClick={() => setRole('farmer')}
                >
                  <span className="role-icon">👨‍🌾</span>
                  <span className="role-label">Farmer</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'buyer' ? 'selected' : ''}`}
                  onClick={() => setRole('buyer')}
                >
                  <span className="role-icon">🛒</span>
                  <span className="role-label">Buyer</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                className={`form-control ${errors.regEmail ? 'error' : ''}`}
                type="email"
                placeholder="ali@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.regEmail && <p className="form-error">{errors.regEmail}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pw">Password</label>
                <input
                  id="reg-pw"
                  className={`form-control ${errors.regPassword ? 'error' : ''}`}
                  type="password"
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.regPassword && <p className="form-error">{errors.regPassword}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-cpw">Confirm</label>
                <input
                  id="reg-cpw"
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '.5rem' }}>
              {loading ? 'Creating Account…' : 'Register & Enter Mandi →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

