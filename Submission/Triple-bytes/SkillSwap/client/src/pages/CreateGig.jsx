import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createGig } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES, PAYMENT_TYPES } from '../utils/constants.js';

const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const INITIAL = {
  type: 'Offering',
  title: '',
  description: '',
  category: 'Programming',
  payment_type: 'Paid',
  budget: '',
  deadline: '',
};

export default function CreateGig() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };
  const isPaid = form.payment_type === 'Paid';

  function validate() {
    const e = {};
    const title = form.title.trim();
    const desc = form.description.trim();
    if (title.length < 3 || title.length > 100) e.title = t('create.errTitle');
    if (desc.length < 10 || desc.length > 2000) e.description = t('create.errDesc');
    if (isPaid && !(Number(form.budget) > 0)) e.budget = t('create.errBudget');
    if (!form.deadline) e.deadline = t('create.errDeadline');
    else if (form.deadline < todayStr()) e.deadline = t('create.errDeadlinePast');
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const gig = await createGig({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        payment_type: form.payment_type,
        budget: isPaid ? Number(form.budget) : null,
        deadline: form.deadline,
      });
      toast.show(t('create.success'));
      navigate(`/gigs/${gig.id}`);
    } catch (err) {
      const fields = err?.apiError?.details?.fields;
      if (fields) setErrors(fields);
      toast.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' invalid' : ''}`;
  const err = (name) => errors[name] && <div className="err">{errors[name]}</div>;

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <form className="formcard" onSubmit={submit} noValidate>
        <h1>{t('create.title')}</h1>
        <p className="formsub">{t('create.sub')}</p>

        <div className="field">
          <label>{t('create.typeLabel')}</label>
          <div className="typepick">
            {['Offering', 'Requesting'].map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  name="gigtype"
                  value={v}
                  checked={form.type === v}
                  onChange={set('type')}
                />
                {v === 'Offering' ? t('create.offering') : t('create.requesting')}
              </label>
            ))}
          </div>
        </div>

        <div className={fieldClass('title')}>
          <label htmlFor="title">{t('create.titleLabel')}</label>
          <input id="title" maxLength={100} value={form.title} placeholder={t('create.titlePh')} onChange={set('title')} />
          {err('title')}
        </div>

        <div className={fieldClass('description')}>
          <label htmlFor="desc">{t('create.descLabel')}</label>
          <textarea id="desc" maxLength={2000} value={form.description} placeholder={t('create.descPh')} onChange={set('description')} />
          {err('description')}
        </div>

        <div className="fieldrow">
          <div className="field">
            <label htmlFor="category">{t('create.category')}</label>
            <select id="category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="payment">{t('create.payment')}</label>
            <select id="payment" value={form.payment_type} onChange={set('payment_type')}>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {t(`payment.${p}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="fieldrow">
          {isPaid && (
            <div className={fieldClass('budget')}>
              <label htmlFor="budget">{t('create.budget')}</label>
              <input
                id="budget"
                type="number"
                min="1"
                value={form.budget}
                placeholder={t('create.budgetPh')}
                onChange={set('budget')}
              />
              {err('budget')}
            </div>
          )}
          <div className={fieldClass('deadline')}>
            <label htmlFor="deadline">{t('create.deadline')}</label>
            <input id="deadline" type="date" min={todayStr()} value={form.deadline} onChange={set('deadline')} />
            {err('deadline')}
          </div>
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
          {submitting ? t('create.publishing') : t('create.submit')} {!submitting && <span className="arrow">↗</span>}
        </button>
      </form>
    </div>
  );
}
