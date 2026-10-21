import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import LanguageButton from '../components/LanguageButton.jsx';
import { createOrLoginUser } from '../api/users.js';
import { apiMessage } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';

const districts = ['Hyderabad', 'Sukkur', 'Mirpurkhas', 'Shikarpur'];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [form, setForm] = useState({ name: '', phone: '', district: 'Hyderabad', role: 'Farmer' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = t('onboarding.required');
    if (!/^03\d{9}$/.test(form.phone)) nextErrors.phone = t('onboarding.phoneError');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setServerError('');
    try {
      const user = await createOrLoginUser({ ...form, name: form.name.trim() });
      setUser(user);
      navigate('/prices', { replace: true });
    } catch (error) {
      setServerError(apiMessage(error, t('onboarding.failed')));
      const fields = error.response?.data?.error?.fields;
      if (fields) setErrors(fields);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="onboarding-page">
    <div className="topline" />
    <header className="onboarding-header"><div className="wrap nav"><Brand /><div className="navright"><LanguageButton /></div></div></header>
    <main className="wrap onboarding-grid">
      <section className="onboarding-copy">
        <div className="eyebrow">{t('onboarding.eyebrow')}</div>
        <h1>{t('onboarding.titleStart')}<br /><span className="highlight">{t('onboarding.titleEnd')}</span></h1>
        <p>{t('onboarding.description')}</p>
        <div className="onboarding-visual">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&auto=format&fit=crop&q=88" alt="Green agricultural fields" />
          <div className="visual-caption"><div><strong>{t('onboarding.visualTitle')}</strong><small>{t('onboarding.visualText')}</small></div><span>01 / 03</span></div>
        </div>
      </section>
      <section className="onboarding-card">
        <span className="card-mark">✳</span><h2>{t('onboarding.cardTitle')}</h2><p>{t('onboarding.cardText')}</p>
        {serverError && <div className="form-alert">{serverError}</div>}
        <form onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="name">{t('onboarding.name')}</label><input id="name" name="name" value={form.name} onChange={update} placeholder={t('onboarding.namePlaceholder')} autoComplete="name" />{errors.name && <small className="field-error">{errors.name}</small>}</div>
          <div className="field"><label htmlFor="phone">{t('onboarding.phone')}</label><input id="phone" name="phone" value={form.phone} onChange={update} placeholder={t('onboarding.phonePlaceholder')} inputMode="numeric" autoComplete="tel" maxLength="11" />{errors.phone && <small className="field-error">{errors.phone}</small>}</div>
          <div className="field-grid">
            <div className="field"><label htmlFor="district">{t('onboarding.district')}</label><select id="district" name="district" value={form.district} onChange={update}>{districts.map((district) => <option key={district} value={district}>{t(`districts.${district}`)}</option>)}</select></div>
            <div className="field"><label htmlFor="role">{t('onboarding.role')}</label><select id="role" name="role" value={form.role} onChange={update}><option value="Farmer">{t('onboarding.farmer')}</option><option value="Buyer">{t('onboarding.buyer')}</option></select></div>
          </div>
          <button className="btn form-submit" type="submit" disabled={submitting}>{submitting ? t('common.loading') : t('onboarding.submit')}</button>
        </form>
        <p className="demo-link"><Link className="text-link" to="/demo">{t('demo.link')}</Link></p>
      </section>
    </main>
  </div>;
}
