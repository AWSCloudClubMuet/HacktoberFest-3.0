import React, { useState, useEffect, useCallback } from 'react';
import { getPrices } from '../services/api';
import { evaluateUserAlerts } from '../services/alertService';
import { isSupabaseConfigured } from '../services/supabase';
import PricesScreen from './PricesScreen';
import MarketplaceScreen from './MarketplaceScreen';
import AlertsScreen from './AlertsScreen';
import MyListingsScreen from './MyListingsScreen';
import ProfitCalculator from './ProfitCalculator';
import AccountModal from './AccountModal';

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

export default function AppShell({ currentUser, onLogout }) {
  const [tab, setTab] = useState('prices');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [triggeredCount, setTriggeredCount] = useState(0);

  const isFarmer = currentUser?.role === 'farmer';
  const tabs = isFarmer ? FARMER_TABS : BUYER_TABS;

  // Handle price refresh to re-evaluate active alerts
  const handlePricesRefreshed = useCallback(async (currentPrices) => {
    if (isFarmer && currentUser?.id) {
      const count = await evaluateUserAlerts(currentUser.id, currentPrices);
      setTriggeredCount(count);
    }
  }, [currentUser, isFarmer]);

  // Initial alert count check for farmer
  useEffect(() => {
    if (isFarmer && currentUser?.id) {
      getPrices().then(p => handlePricesRefreshed(p)).catch(() => {});
    } else {
      setTriggeredCount(0);
    }
  }, [currentUser, isFarmer, handlePricesRefreshed]);

  // Ensure active tab is valid for this role
  useEffect(() => {
    if (!tabs.find(t => t.id === tab)) setTab('prices');
  }, [currentUser?.role, tabs, tab]);

  return (
    <div className="app-wrapper">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-brand">
          🌾 KisanMandi
          <span>Sindh Produce Marketplace</span>
        </div>
        <div className="top-bar-right">
          <button
            className="demo-user-btn"
            onClick={() => setShowAccountModal(true)}
            title="View account profile"
            aria-label="Account details"
          >
            👤 {(currentUser?.name || 'User').split(' ')[0]} ({isFarmer ? 'Farmer' : 'Buyer'})
          </button>
          <button
            className="btn-icon"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,0.3)', padding: '.3rem .5rem', fontSize: '.9rem' }}
          >
            🚪
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
        {tab === 'alerts'      && isFarmer && (
          <AlertsScreen
            currentUser={currentUser}
            onTriggeredCountChange={setTriggeredCount}
          />
        )}
        {tab === 'mylistings'  && isFarmer && (
          <MyListingsScreen currentUser={currentUser} />
        )}
        {tab === 'calculator'  && isFarmer && (
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

      {/* Profile & Account Details Modal */}
      {showAccountModal && (
        <AccountModal
          user={currentUser}
          onClose={() => setShowAccountModal(false)}
          onLogout={() => {
            setShowAccountModal(false);
            onLogout();
          }}
        />
      )}
    </div>
  );
}
