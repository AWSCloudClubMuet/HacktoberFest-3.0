import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signup } from '../api/index.js';
import { errorCode } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);

const INITIAL = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  major: '',
  semester: '1',
  bio: '',
  skills: '',
};

const parseSkills = (text) => [...new Set(text.split(',').map((s) => s.trim()).filter(Boolean))];

export default function Signup() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { login } = useUser();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError('');
  };

  function validate() {
    const found = {};
    const name = form.name.trim();
    const major = form.major.trim();
    const skills = parseSkills(form.skills);

    if (name.length < 2 || name.length > 80) found.name = t('auth.errName');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = t('auth.errEmail');
    if (form.password.length < 8) found.password = t('auth.errPassword');
    if (form.confirm !== form.password) found.confirm = t('auth.errConfirm');
    if (major.length < 2 || major.length > 80) found.major = t('auth.errMajor');
    if (form.bio.trim().length > 300) found.bio = t('auth.errBio');
    if (skills.length > 10 || skills.some((s) => s.length > 30)) found.skills = t('auth.errSkills');
    return found;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const session = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        major: form.major.trim(),
        semester: Number(form.semester),
        bio: form.bio.trim() || null,
        skills: parseSkills(form.skills),
      });
      toast.show(t('auth.welcomeNew', { name: session.user.name.split(' ')[0] }));
      login(session);
    } catch (err) {
      const code = errorCode(err);
      const fields = err?.apiError?.details?.fields;

      if (code === 'EMAIL_TAKEN') setErrors({ email: t('errors.EMAIL_TAKEN') });
      else if (fields) setErrors(fields);
      else setFormError(i18n.exists(`errors.${code}`) ? t(`errors.${code}`) : t('errors.INTERNAL_ERROR'));
      setSubmitting(false);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' invalid' : ''}`;
  const error = (name) => errors[name] && <div className="err">{errors[name]}</div>;

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <form className="formcard" onSubmit={submit} noValidate>
        <div className="eyebrow">
          <span className="dot" /> {t('auth.signupEyebrow')}
        </div>
        <h1 style={{ marginTop: 14 }}>{t('auth.signupTitle')}</h1>
        <p className="formsub">{t('auth.signupSub')}</p>

        {formError && (
          <div className="formerror" role="alert">
            {formError}
          </div>
        )}

        <div className={fieldClass('name')}>
          <label htmlFor="name">{t('auth.name')}</label>
          <input id="name" autoComplete="name" maxLength={80} value={form.name} onChange={set('name')} />
          {error('name')}
        </div>

        <div className={fieldClass('email')}>
          <label htmlFor="email">{t('auth.emailRequired')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            placeholder={t('auth.emailPh')}
            onChange={set('email')}
          />
          {error('email')}
        </div>

        <div className="fieldrow">
          <div className={fieldClass('password')}>
            <label htmlFor="password">{t('auth.passwordRequired')}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={form.password}
              placeholder={t('auth.passwordPh')}
              onChange={set('password')}
            />
            {error('password')}
          </div>
          <div className={fieldClass('confirm')}>
            <label htmlFor="confirm">{t('auth.confirm')}</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={form.confirm}
              onChange={set('confirm')}
            />
            {error('confirm')}
          </div>
        </div>

        <div className="fieldrow">
          <div className={fieldClass('major')}>
            <label htmlFor="major">{t('auth.major')}</label>
            <input id="major" maxLength={80} value={form.major} placeholder={t('auth.majorPh')} onChange={set('major')} />
            {error('major')}
          </div>
          <div className={fieldClass('semester')}>
            <label htmlFor="semester">{t('auth.semester')}</label>
            <select id="semester" value={form.semester} onChange={set('semester')}>
              {SEMESTERS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={fieldClass('bio')}>
          <label htmlFor="bio">{t('auth.bio')}</label>
          <textarea id="bio" maxLength={300} value={form.bio} placeholder={t('auth.bioPh')} onChange={set('bio')} />
          {errors.bio ? error('bio') : <div className="hint">{form.bio.length}/300</div>}
        </div>

        <div className={fieldClass('skills')}>
          <label htmlFor="skills">{t('auth.skills')}</label>
          <input id="skills" value={form.skills} placeholder={t('auth.skillsPh')} onChange={set('skills')} />
          {errors.skills ? error('skills') : <div className="hint" style={{ textAlign: 'start' }}>{t('auth.skillsHint')}</div>}
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
          {submitting ? t('auth.creating') : t('auth.signupSubmit')}
        </button>

        <p className="authswitch">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
        </p>
      </form>
    </div>
  );
}
