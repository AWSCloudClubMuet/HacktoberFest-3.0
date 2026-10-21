import React, { useState, useEffect, useCallback } from 'react';
import { getPrices } from '../services/api';
import { evaluateUserAlerts } from '../services/alertService';
import PricesScreen from './PricesScreen';
import MarketplaceScreen from './MarketplaceScreen';
import AlertsScreen from './AlertsScreen';
import MyListingsScreen from './MyListingsScreen';
import ProfitCalculator from './ProfitCalculator';

const FARMER_TABS = [
  { id: 'prices',      label: 'Prices',     icon: '📊' },
  { id: 'marketplace', label: 'Market',     icon: '🏪' },
  { id: 'alerts',      label: 'Alerts',     icon: '🔔' },
  { id: 'mylistings',  label: 'My List',    icon: '📋' },
  { id: 'calculator',  label: 'Calc',       icon: '🧮' },
];

const BUYER_TABS = [
  { id: 'prices',      label: 'Prices',     icon: '📊' },
  { id: 'marketplace', label: 'Market',     icon: '🏪' },
];

export default function AppShell({ currentUser, allUsers, onSwitchUser }) {
  const [tab, setTab]             = useState('prices');
  const [showUserModal, setShowUserModal] = useState(false);
  const [triggeredCount, setTriggeredCount] = useState(0);

  const tabs = currentUser.role === 'farmer' ? FARMER_TABS : BUYER_TABS;

  // Handle price refresh to re-evaluate active alerts
  const handlePricesRefreshed = useCallback(async (currentPrices) => {
    if (currentUser.role === 'farmer') {
      const count = await evaluateUserAlerts(currentUser.id, currentPrices);
      setTriggeredCount(count);
    }
  }, [currentUser]);

  // Initial alert count check for farmer
  useEffect(() => {
    if (currentUser.role === 'farmer') {
      getPrices().then(p => handlePricesRefreshed(p)).catch(() => {});
    } else {
      setTriggeredCount(0);
    }
  }, [currentUser, handlePricesRefreshed]);

  // Ensure active tab is valid for this role
  useEffect(() => {
    if (!tabs.find(t => t.id === tab)) setTab('prices');
  }, [currentUser.role, tabs, tab]);

  return (
    <div className="app-wrapper">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-brand">
          🌾 KisanMandi
          <span>Sindh Produce Marketplace</span>
        </div>
        <div className="top-bar-right">
          <button className="demo-user-btn" onClick={() => setShowUserModal(true)} title="Switch demo user">
            👤 {currentUser.name.split(' ')[0]} ({currentUser.role === 'farmer' ? 'Farmer' : 'Buyer'})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {tab === 'prices'      && (
          <PricesScreen
            currentUser={currentUser}
            onPricesRefreshed={handlePricesRefreshed}
          />
        )}
        {tab === 'marketplace' && <MarketplaceScreen currentUser={currentUser} />}
        {tab === 'alerts'      && currentUser.role === 'farmer' && (
          <AlertsScreen
            currentUser={currentUser}
            onTriggeredCountChange={setTriggeredCount}
          />
        )}
        {tab === 'mylistings'  && currentUser.role === 'farmer' && (
          <MyListingsScreen currentUser={currentUser} />
        )}
        {tab === 'calculator'  && currentUser.role === 'farmer' && (
          <ProfitCalculator currentUser={currentUser} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            aria-label={t.label}
          >
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'alerts' && triggeredCount > 0 && (
              <span className="nav-badge" aria-label={`${triggeredCount} triggered alerts`}>
                {triggeredCount > 9 ? '9+' : triggeredCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Demo User Switcher Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Switch Demo User</h2>
            <p style={{ fontSize: '.8rem', color: 'var(--gray-500)', marginBottom: '.75rem' }}>
              ⚠️ Demo user switching only. Real production would use authenticated sessions. Active user is kept in React memory.
            </p>
            {allUsers.map(u => (
              <div
                key={u.id}
                className={`user-option ${u.id === currentUser.id ? 'active' : ''}`}
                onClick={() => { onSwitchUser(u); setShowUserModal(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && (onSwitchUser(u), setShowUserModal(false))}
              >
                <div className="user-avatar">{u.name[0]}</div>
                <div className="user-info">
                  <div className="user-name">{u.name}</div>
                  <div className="user-meta">{u.district} · {u.role === 'farmer' ? '👨‍🌾 Farmer' : '🛒 Buyer'}</div>
                </div>
                {u.id === currentUser.id && (
                  <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: '.75rem', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                )}
              </div>
            ))}
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUserModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
