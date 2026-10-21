import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compareMarkets, getCrops, getPriceHistory } from '../api/prices.js';
import { apiMessage } from '../api/client.js';
import { ErrorState, LoadingState } from '../components/StatusState.jsx';
import { localizedName, money } from '../utils/format.js';
import { useUser } from '../context/UserContext.jsx';

export default function CropDetail() {
  const { cropId } = useParams();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [crop, setCrop] = useState(location.state?.crop || null);
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [marketId, setMarketId] = useState(String(location.state?.marketId || ''));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const compare = await compareMarkets(cropId);
        const firstMarket = marketId || String(compare[0]?.market_id || '');
        const [prices, crops] = await Promise.all([getPriceHistory({ crop_id: cropId, market_id: firstMarket, days: 14 }), crop ? Promise.resolve([]) : getCrops()]);
        if (!active) return;
        setComparison(compare); setMarketId(firstMarket); setHistory(prices);
        if (!crop) setCrop(crops.find((item) => String(item.id) === String(cropId)) || null);
      } catch (err) { if (active) setError(apiMessage(err, t('prices.historyError'))); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [cropId, marketId, t]);

  const stats = useMemo(() => {
    const values = history.map((item) => Number(item.price));
    if (!values.length) return { min: 0, max: 0, average: 0 };
    return { min: Math.min(...values), max: Math.max(...values), average: values.reduce((sum, item) => sum + item, 0) / values.length };
  }, [history]);
  const cropName = crop ? localizedName(crop, i18n.language) : '';

  return <section className="section detail-section"><div className="wrap">
    <Link className="back-link" to="/prices">← {t('common.back')}</Link>
    <div className="detail-heading"><div><div className="eyebrow">{t('prices.days')}</div><h1>{cropName || t('prices.trend')}</h1><p>{t('prices.subtitle')}</p>{user.role === 'Farmer' && <Link className="text-link" to={`/profit?crop_id=${cropId}&market_id=${marketId}`}>{t('profit.open')} ↗</Link>}</div>{comparison.length > 0 && <div className="detail-price"><span>{t('common.today')}</span><strong>{money(comparison.find((item) => String(item.market_id) === marketId)?.price)}</strong><small>{t('common.perUnit')}</small></div>}</div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <div className="detail-grid">
      <div className="panel chart-panel"><div className="panel-title"><div><h3>{t('prices.trend')}</h3><span className="subtle">{t('prices.days')}</span></div><select className="select" value={marketId} onChange={(e) => setMarketId(e.target.value)}>{comparison.map((item) => <option key={item.market_id} value={item.market_id}>{localizedName(item, i18n.language)}</option>)}</select></div>
        <div className="rechart"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} /><YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={55} /><Tooltip formatter={(value) => money(value)} /><Line type="monotone" dataKey="price" stroke="#39734b" strokeWidth={3} dot={{ fill: '#245c3a', r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
        <div className="stats-grid"><div><span>{t('prices.minimum')}</span><strong>{money(stats.min)}</strong></div><div><span>{t('prices.maximum')}</span><strong>{money(stats.max)}</strong></div><div><span>{t('prices.average')}</span><strong>{money(stats.average)}</strong></div></div>
      </div>
      <aside className="panel comparison-panel"><div className="panel-title"><div><h3>{t('prices.compare')}</h3><span className="subtle">{t('prices.highest')}</span></div></div>{comparison.map((item, index) => <div className={`comparison-row ${index === 0 ? 'best' : ''}`} key={item.market_id}><span className="rank">{index + 1}</span><div><strong>{localizedName(item, i18n.language)}</strong><small>{t(`districts.${item.district}`, item.district)} · {item.date}</small></div><b>{money(item.price)}</b>{index === 0 && <em>{t('prices.best')}</em>}</div>)}</aside>
    </div>}
  </div></section>;
}
