import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login as loginRequest } from '../api/index.js';
import { errorCode } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_PASSWORD } from '../utils/demo.js';

const DEMO_EMAIL = 'ayesha.khan@campus.edu';

export default function Login() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { login } = useUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError('');
  };

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = t('auth.errEmail');
    if (!form.password) found.password = t('auth.errPasswordRequired');
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const session = await loginRequest({ email: form.email.trim(), password: form.password });
      toast.show(t('auth.welcomeBack', { name: session.user.name.split(' ')[0] }));
      login(session);
    } catch (err) {
      const code = errorCode(err);
      setFormError(i18n.exists(`errors.${code}`) ? t(`errors.${code}`) : t('errors.INTERNAL_ERROR'));
      setSubmitting(false);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' invalid' : ''}`;

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <form className="formcard authcard" onSubmit={submit} noValidate>
        <div className="eyebrow">
          <span className="dot" /> {t('auth.loginEyebrow')}
        </div>
        <h1 style={{ marginTop: 14 }}>{t('auth.loginTitle')}</h1>
        <p className="formsub">{t('auth.loginSub')}</p>

        {formError && (
          <div className="formerror" role="alert">
            {formError}
          </div>
        )}

        <div className={fieldClass('email')}>
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            placeholder={t('auth.emailPh')}
            onChange={set('email')}
          />
          {errors.email && <div className="err">{errors.email}</div>}
        </div>

        <div className={fieldClass('password')}>
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
          />
          {errors.password && <div className="err">{errors.password}</div>}
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
          {submitting ? t('auth.loggingIn') : t('auth.loginSubmit')}
        </button>

        <p className="authswitch">
          {t('auth.noAccount')} <Link to="/signup">{t('auth.signupLink')}</Link>
        </p>

        <div className="notice demonote">
          <strong>{t('auth.demoTitle')}</strong>
          <span dir="ltr">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </span>
          <Link to="/demo">{t('auth.demoAll')}</Link>
        </div>
      </form>
    </div>
  );
}
