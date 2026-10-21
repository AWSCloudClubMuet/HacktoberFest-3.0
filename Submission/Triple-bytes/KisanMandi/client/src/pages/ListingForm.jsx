import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createListing, getListing, updateListing } from '../api/listings.js';
import { getCrops } from '../api/prices.js';
import { apiMessage } from '../api/client.js';
import { LoadingState } from '../components/StatusState.jsx';
import { localizedName } from '../utils/format.js';
import { useUser } from '../context/UserContext.jsx';

const districts = ['Hyderabad', 'Sukkur', 'Mirpurkhas', 'Karachi', 'Shikarpur'];
const pakistanToday = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function ListingForm() {
  const { listingId } = useParams();
  const editing = Boolean(listingId);
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({ crop_id: '', quantity: '', asking_price: '', district: user.district, grade: 'A', available_from: pakistanToday(), contact_phone: user.phone });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  useEffect(() => {
    let active = true;
    Promise.all([getCrops(), editing ? getListing(listingId) : Promise.resolve(null)]).then(([cropRows, existing]) => {
      if (!active) return;
      setCrops(cropRows);
      setForm(existing ? { crop_id: String(existing.crop_id), quantity: String(existing.quantity), asking_price: String(existing.asking_price), district: existing.district, grade: existing.grade, available_from: existing.available_from, contact_phone: existing.contact_phone }
        : (old) => ({ ...old, crop_id: String(cropRows[0]?.id || '') }));
    }).catch((err) => active && setError(apiMessage(err, t('listingForm.loadError')))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [editing, listingId, t]);
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!(Number(form.quantity) > 0)) next.quantity = t('validation.positive');
    if (!(Number(form.asking_price) > 0)) next.asking_price = t('validation.positive');
    if (form.available_from < pakistanToday()) next.available_from = t('validation.pastDate');
    if (!/^03\d{9}$/.test(form.contact_phone)) next.contact_phone = t('onboarding.phoneError');
    setFields(next); if (Object.keys(next).length) return;
    const payload = { ...form, crop_id: Number(form.crop_id), quantity: Number(form.quantity), asking_price: Number(form.asking_price) };
    setSubmitting(true); setError('');
    try { if (editing) await updateListing(listingId, payload); else await createListing(payload); navigate('/my-listings'); }
    catch (err) { setError(apiMessage(err, t('listingForm.saveError'))); setFields(err.response?.data?.error?.fields || {}); }
    finally { setSubmitting(false); }
  };
  if (loading) return <section className="section"><LoadingState /></section>;
  return <section className="section form-page"><div className="wrap narrow-wrap"><Link className="back-link" to="/my-listings">← {t('common.back')}</Link><div className="form-card"><div className="eyebrow">{editing ? t('listingForm.edit') : t('listingForm.create')}</div><h1>{editing ? t('listingForm.editTitle') : t('listingForm.createTitle')}</h1><p>{t('listingForm.text')}</p>{error && <div className="form-alert">{error}</div>}<form onSubmit={submit}>
    <div className="field-grid">
      <div className="field"><label>{t('listingForm.crop')}</label><select name="crop_id" value={form.crop_id} onChange={update}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{localizedName(crop, i18n.language)}</option>)}</select></div>
      <div className="field"><label>{t('listingForm.grade')}</label><select name="grade" value={form.grade} onChange={update}>{['A','B','C'].map((grade) => <option key={grade}>{grade}</option>)}</select></div>
      <div className="field"><label>{t('listingForm.quantity')}</label><input name="quantity" type="number" min="1" value={form.quantity} onChange={update}/>{fields.quantity && <small className="field-error">{fields.quantity}</small>}</div>
      <div className="field"><label>{t('listingForm.price')}</label><input name="asking_price" type="number" min="1" value={form.asking_price} onChange={update}/>{fields.asking_price && <small className="field-error">{fields.asking_price}</small>}</div>
      <div className="field"><label>{t('listingForm.district')}</label><select name="district" value={form.district} onChange={update}>{districts.map((district) => <option key={district} value={district}>{t(`districts.${district}`, district)}</option>)}</select></div>
      <div className="field"><label>{t('listingForm.availableFrom')}</label><input name="available_from" type="date" min={pakistanToday()} value={form.available_from} onChange={update}/>{fields.available_from && <small className="field-error">{fields.available_from}</small>}</div>
    </div><div className="field"><label>{t('listingForm.phone')}</label><input name="contact_phone" inputMode="numeric" maxLength="11" value={form.contact_phone} onChange={update}/>{fields.contact_phone && <small className="field-error">{fields.contact_phone}</small>}</div>
    <div className="form-actions"><Link className="btn btn-outline" to="/my-listings">{t('common.cancel')}</Link><button className="btn" disabled={submitting}>{submitting ? t('common.saving') : t('common.save')}</button></div>
  </form></div></div></section>;
}
