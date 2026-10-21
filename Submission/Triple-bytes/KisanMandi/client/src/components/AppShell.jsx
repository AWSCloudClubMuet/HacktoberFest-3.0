import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Brand from './Brand.jsx';
import LanguageButton from './LanguageButton.jsx';
import { useUser } from '../context/UserContext.jsx';
import { getAlerts } from '../api/alerts.js';

export default function AppShell() {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const logout = () => { const next = user.demo ? '/demo' : '/onboarding'; setUser(null); window.location.replace(next); };
  const farmer = user.role === 'Farmer';
  const [triggeredCount, setTriggeredCount] = useState(0);
  const refreshBadge = useCallback(async () => {
    if (!farmer) return;
    try {
      const rows = await getAlerts();
      setTriggeredCount(rows.filter((item) => item.active_status && item.latest_price != null
        && (item.condition === 'Above' ? item.latest_price >= item.target_price : item.latest_price <= item.target_price)).length);
    } catch { setTriggeredCount(0); }
  }, [farmer]);
  useEffect(() => {
    refreshBadge();
    window.addEventListener('kisan:prices-refreshed', refreshBadge);
    window.addEventListener('kisan:alerts-changed', refreshBadge);
    return () => {
      window.removeEventListener('kisan:prices-refreshed', refreshBadge);
      window.removeEventListener('kisan:alerts-changed', refreshBadge);
    };
  }, [refreshBadge]);
  const links = [
    ['/prices', t('nav.prices'), '⌁'], ['/marketplace', t('nav.marketplace'), '◇'],
    ...(farmer ? [['/alerts', t('nav.alerts'), '♢'], ['/my-listings', t('nav.myListings'), '▤']] : []),
  ];
  return <div className="app-frame">
    <div className="topline" />
    <header className="site-header"><div className="wrap nav">
      <Brand />
      <nav className="navlinks" aria-label="Main navigation">
        {links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}{to === '/alerts' && triggeredCount > 0 && <b className="nav-badge">{triggeredCount}</b>}</NavLink>)}
      </nav>
      <div className="navright"><LanguageButton /><span className="profile-chip"><span>{user.name.charAt(0)}</span>{user.name.split(' ')[0]}{user.demo && <em className="demo-badge">{t('demo.badge')}</em>}</span><button type="button" className="language logout-btn" onClick={logout}>{t('nav.logout')}</button></div>
    </div></header>
    <main><Outlet /></main>
    <footer className="footer"><div className="wrap footer-inner"><div><Brand footer /><p>{t('brandTagline')}</p></div><div className="footer-links"><NavLink to="/prices">{t('footer.prices')}</NavLink><NavLink to="/marketplace">{t('footer.marketplace')}</NavLink><span>{t('footer.phase')}</span></div></div></footer>
    <nav className="mobile-tabs" aria-label="Mobile navigation">{links.map(([to, label, icon]) => <NavLink key={to} to={to}><span>{icon}{to === '/alerts' && triggeredCount > 0 && <b className="nav-badge">{triggeredCount}</b>}</span><small>{label}</small></NavLink>)}</nav>
  </div>;
}
