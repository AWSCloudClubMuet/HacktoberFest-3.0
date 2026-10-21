import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createAlert, getAlerts, updateAlert } from '../api/alerts.js';
import { getCrops, getMarkets } from '../api/prices.js';
import { apiMessage } from '../api/client.js';
import { LoadingState } from '../components/StatusState.jsx';
import { localizedName } from '../utils/format.js';

export default function AlertForm() {
  const { alertId } = useParams();
  const editing = Boolean(alertId);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [form, setForm] = useState({ crop_id: '', market_id: '', condition: 'Above', target_price: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all([getCrops(), getMarkets(), editing ? getAlerts() : Promise.resolve([])]).then(([cropRows, marketRows, alerts]) => {
      if (!active) return;
      setCrops(cropRows); setMarkets(marketRows);
      const existing = alerts.find((item) => String(item.id) === alertId);
      setForm(existing ? { crop_id: String(existing.crop_id), market_id: String(existing.market_id), condition: existing.condition, target_price: String(existing.target_price) }
        : { crop_id: String(cropRows[0]?.id || ''), market_id: String(marketRows[0]?.id || ''), condition: 'Above', target_price: '' });
    }).catch((err) => active && setError(apiMessage(err, t('alerts.formLoadError')))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [alertId, editing, t]);

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextFields = {};
    if (!(Number(form.target_price) > 0)) nextFields.target_price = t('validation.positive');
    setFields(nextFields); if (Object.keys(nextFields).length) return;
    setSubmitting(true); setError('');
    const payload = { crop_id: Number(form.crop_id), market_id: Number(form.market_id), condition: form.condition, target_price: Number(form.target_price) };
    try {
      if (editing) await updateAlert(alertId, payload); else await createAlert(payload);
      window.dispatchEvent(new Event('kisan:alerts-changed'));
      navigate('/alerts');
    } catch (err) { setError(apiMessage(err, t('alerts.saveError'))); setFields(err.response?.data?.error?.fields || {}); }
    finally { setSubmitting(false); }
  };
  if (loading) return <section className="section"><LoadingState /></section>;
  return <section className="section form-page"><div className="wrap narrow-wrap"><Link className="back-link" to="/alerts">← {t('common.back')}</Link><div className="form-card"><div className="eyebrow">{editing ? t('alerts.edit') : t('alerts.create')}</div><h1>{editing ? t('alerts.editTitle') : t('alerts.createTitle')}</h1><p>{t('alerts.formText')}</p>{error && <div className="form-alert">{error}</div>}<form onSubmit={submit}>
    <div className="field-grid"><div className="field"><label>{t('alerts.crop')}</label><select name="crop_id" value={form.crop_id} onChange={update}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{localizedName(crop, i18n.language)}</option>)}</select></div><div className="field"><label>{t('alerts.market')}</label><select name="market_id" value={form.market_id} onChange={update}>{markets.map((market) => <option key={market.id} value={market.id}>{localizedName(market, i18n.language)}</option>)}</select></div></div>
    <div className="field-grid"><div className="field"><label>{t('alerts.condition')}</label><select name="condition" value={form.condition} onChange={update}><option value="Above">{t('alerts.above')}</option><option value="Below">{t('alerts.below')}</option></select></div><div className="field"><label>{t('alerts.target')}</label><input name="target_price" type="number" min="1" value={form.target_price} onChange={update} placeholder="5000" />{fields.target_price && <small className="field-error">{fields.target_price}</small>}</div></div>
    <div className="form-actions"><Link className="btn btn-outline" to="/alerts">{t('common.cancel')}</Link><button className="btn" disabled={submitting}>{submitting ? t('common.saving') : t('common.save')}</button></div>
  </form></div></div></section>;
}
