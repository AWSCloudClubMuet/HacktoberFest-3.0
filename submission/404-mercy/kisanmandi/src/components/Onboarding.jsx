import React, { useState } from 'react';
import { createUser } from '../services/api';

const DISTRICTS = [
  'Hyderabad','Sukkur','Larkana','Mirpurkhas','Nawabshah',
  'Karachi','Thatta','Badin','Khairpur','Jacobabad',
  'Shikarpur','Dadu','Sanghar','Tharparkar',
];

function validate(form) {
  const errs = {};
  if (!form.name.trim())    errs.name = 'Name is required';
  if (!form.phone.trim())   errs.phone = 'Phone is required';
  else if (!/^03[0-9]{9}$/.test(form.phone.trim())) errs.phone = 'Enter a valid Pakistani mobile number (e.g. 03001234567)';
  if (!form.district)       errs.district = 'Please select a district';
  if (!form.role)           errs.role = 'Please select a role';
  return errs;
}

export default function Onboarding({ onComplete }) {
  const [form, setForm]     = useState({ name: '', phone: '', district: '', role: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError('');
    try {
      const user = await createUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        district: form.district,
        role: form.role,
      });
      onComplete(user);
    } catch (err) {
      setApiError(err.message || 'Failed to create account. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-wrap">
      <div className="onboard-card">
        <div className="onboard-logo">🌾</div>
        <h1 className="onboard-title">KisanMandi</h1>
        <p className="onboard-sub">Crop Prices & Produce Marketplace — Sindh</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className={`form-control ${errors.name ? 'error' : ''}`}
              type="text"
              placeholder="Muhammad Ali"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoComplete="name"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Mobile Number</label>
            <input
              id="phone"
              className={`form-control ${errors.phone ? 'error' : ''}`}
              type="tel"
              placeholder="03001234567"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              autoComplete="tel"
            />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="district">District</label>
            <select
              id="district"
              className={`form-control ${errors.district ? 'error' : ''}`}
              value={form.district}
              onChange={e => set('district', e.target.value)}
            >
              <option value="">Select district…</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.district && <p className="form-error">{errors.district}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">I am a…</label>
            {errors.role && <p className="form-error">{errors.role}</p>}
            <div className="role-selector">
              <button type="button" className={`role-btn ${form.role === 'farmer' ? 'selected' : ''}`} onClick={() => set('role', 'farmer')}>
                <span className="role-icon">👨‍🌾</span>
                <span className="role-label">Farmer</span>
              </button>
              <button type="button" className={`role-btn ${form.role === 'buyer' ? 'selected' : ''}`} onClick={() => set('role', 'buyer')}>
                <span className="role-icon">🛒</span>
                <span className="role-label">Buyer</span>
              </button>
            </div>
          </div>

          {apiError && (
            <div style={{ background: 'var(--red-pale)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '.6rem .75rem', fontSize: '.82rem', color: 'var(--red)', marginBottom: '.75rem' }}>
              ⚠️ {apiError}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Get Started →'}
          </button>
        </form>
      </div>
    </div>
  );
}

