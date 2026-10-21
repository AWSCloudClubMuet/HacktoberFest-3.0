import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteAlert, getAlerts, toggleAlert } from '../api/alerts.js';
import { apiMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusState.jsx';
import { money } from '../utils/format.js';

function isTriggered(alert) {
  if (!alert.active_status || alert.latest_price == null) return false;
  return alert.condition === 'Above' ? alert.latest_price >= alert.target_price : alert.latest_price <= alert.target_price;
}

export default function Alerts() {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAlerts(await getAlerts()); }
    catch (err) { setError(apiMessage(err, t('alerts.error'))); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    setBusyId(id);
    try {
      const updated = await toggleAlert(id);
      setAlerts((rows) => rows.map((item) => item.id === id ? updated : item));
      window.dispatchEvent(new Event('kisan:alerts-changed'));
    } catch (err) { setError(apiMessage(err, t('alerts.actionError'))); }
    finally { setBusyId(null); }
  };
  const remove = async (id) => {
    if (!window.confirm(t('alerts.deleteConfirm'))) return;
    setBusyId(id);
    try {
      await deleteAlert(id); setAlerts((rows) => rows.filter((item) => item.id !== id));
      window.dispatchEvent(new Event('kisan:alerts-changed'));
    } catch (err) { setError(apiMessage(err, t('alerts.actionError'))); }
    finally { setBusyId(null); }
  };

  return <section className="section tool-page"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{t('alerts.eyebrow')}</div><h2>{t('alerts.title')}</h2><p>{t('alerts.subtitle')}</p></div><Link className="btn" to="/alerts/new">＋ {t('alerts.add')}</Link></div>
    {error && !loading && <div className="inline-error">{error}</div>}
    {loading ? <LoadingState /> : !alerts.length ? <EmptyState message={t('alerts.empty')} /> : <div className="alert-list">{alerts.map((alert) => {
      const triggered = isTriggered(alert);
      const cropName = i18n.language === 'ur' ? alert.crop_name_ur : alert.crop_name;
      const marketName = i18n.language === 'ur' ? alert.market_name_ur : alert.market_name;
      return <article className={`alert-card ${triggered ? 'triggered' : ''} ${!alert.active_status ? 'inactive' : ''}`} key={alert.id}>
        <div className="alert-icon">{triggered ? '↗' : '♢'}</div><div className="alert-main"><div className="alert-heading"><div><span className="alert-status">{triggered ? t('alerts.triggered') : alert.active_status ? t('alerts.watching') : t('alerts.paused')}</span><h3>{cropName}</h3><p>{marketName}</p></div><label className="switch"><input type="checkbox" checked={alert.active_status} disabled={busyId === alert.id} onChange={() => toggle(alert.id)} /><span /></label></div><div className="alert-values"><div><span>{t('alerts.condition')}</span><strong>{t(`alerts.${alert.condition.toLowerCase()}`)} {money(alert.target_price)}</strong></div><div><span>{t('alerts.latest')}</span><strong>{alert.latest_price == null ? '—' : money(alert.latest_price)}</strong></div></div><div className="card-actions"><Link className="row-action" to={`/alerts/${alert.id}/edit`}>{t('common.edit')}</Link><button className="row-action danger" disabled={busyId === alert.id} onClick={() => remove(alert.id)}>{t('common.delete')}</button></div></div>
      </article>;
    })}</div>}
  </div></section>;
}
