import React from 'react';
import { isSupabaseConfigured } from '../services/supabase';

export default function AccountModal({ user, onClose, onLogout }) {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="acc-title">
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="acc-title" className="modal-title" style={{ margin: 0 }}>My Account</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0', borderBottom: '1px solid var(--gray-200)', marginBottom: '1rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--green-pale)',
            color: 'var(--green-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, border: '2px solid var(--green)'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '.5rem', color: 'var(--gray-900)' }}>
            {user.name}
          </h3>
          <div style={{ display: 'inline-block', marginTop: '.25rem' }}>
            <span className={`pill ${user.role === 'farmer' ? 'pill-green' : 'pill-amber'}`}>
              {user.role === 'farmer' ? '👨‍🌾 Registered Farmer' : '🛒 Produce Buyer'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.88rem' }}>
          {user.email && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Email Address</span>
              <strong style={{ color: 'var(--gray-800)' }}>{user.email}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)' }}>Mobile Number</span>
            <strong style={{ color: 'var(--gray-800)' }}>{user.phone || 'Not specified'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)' }}>District</span>
            <strong style={{ color: 'var(--gray-800)' }}>{user.district}, Sindh</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)' }}>Auth Provider</span>
            <span style={{ fontSize: '.8rem', color: isSupabaseConfigured() ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
              {isSupabaseConfigured() ? '⚡ Supabase Auth (Cloud)' : '💻 Local Development Mock'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0' }}>
            <span style={{ color: 'var(--gray-500)' }}>User ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--gray-400)' }}>
              {user.id ? `${user.id.substring(0, 12)}...` : 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Back
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
