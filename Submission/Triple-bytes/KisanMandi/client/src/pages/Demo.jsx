import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Brand from '../components/Brand.jsx';
import LanguageButton from '../components/LanguageButton.jsx';
import { createOrLoginUser } from '../api/users.js';
import { apiMessage } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';

const demoAccounts = [
  { name: 'Ali Raza', phone: '03001234567', district: 'Hyderabad', role: 'Farmer' },
  { name: 'Fatima Bibi', phone: '03111234567', district: 'Sukkur', role: 'Farmer' },
  { name: 'Ghulam Mustafa', phone: '03221234567', district: 'Mirpurkhas', role: 'Farmer' },
  { name: 'Sana Ahmed', phone: '03331234567', district: 'Hyderabad', role: 'Farmer' },
  { name: 'Bilal Traders', phone: '03441234567', district: 'Karachi', role: 'Buyer' },
  { name: 'Mehran Foods', phone: '03551234567', district: 'Sukkur', role: 'Buyer' },
];

export default function Demo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const choose = async (account) => {
    setBusy(account.phone); setError('');
    try {
      const user = await createOrLoginUser(account);
      setUser({ ...user, demo: true });
      navigate('/prices', { replace: true });
    } catch (err) {
      setError(apiMessage(err, t('demo.failed')));
      setBusy('');
    }
  };

  return <div className="onboarding-page">
    <div className="topline" />
    <header className="onboarding-header"><div className="wrap nav"><Brand /><div className="navright"><LanguageButton /></div></div></header>
    <main className="wrap narrow-wrap section">
      <div className="eyebrow">{t('demo.eyebrow')}</div>
      <h1 className="demo-title">{t('demo.title')}</h1>
      <p className="subtle">{t('demo.text')}</p>
      {error && <div className="form-alert">{error}</div>}
      <div className="demo-grid">
        {demoAccounts.map((account) => <button key={account.phone} type="button" className="panel demo-card" disabled={Boolean(busy)} onClick={() => choose(account)}>
          <span className="demo-avatar">{account.name.charAt(0)}</span>
          <span className="demo-info"><strong>{account.name}</strong><small>{t(`districts.${account.district}`)} · {account.phone}</small></span>
          <span className={`demo-role ${account.role === 'Farmer' ? 'farmer' : 'buyer'}`}>{busy === account.phone ? t('common.loading') : t(account.role === 'Farmer' ? 'onboarding.farmer' : 'onboarding.buyer')}</span>
        </button>)}
      </div>
      <p className="subtle"><Link className="text-link" to="/onboarding">{t('demo.manual')}</Link></p>
    </main>
  </div>;
}
