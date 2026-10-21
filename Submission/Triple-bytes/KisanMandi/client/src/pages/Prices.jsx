import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCrops, getLatestPrices, getMarkets } from '../api/prices.js';
import { apiMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusState.jsx';
import PriceTable from '../components/PriceTable.jsx';
import PriceInsight from '../components/PriceInsight.jsx';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { localizedName, money, priceChange } from '../utils/format.js';
import { useUser } from '../context/UserContext.jsx';

export default function Prices() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [markets, setMarkets] = useState([]);
  const [crops, setCrops] = useState([]);
  const [marketId, setMarketId] = useState('');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getMarkets(), getCrops()]).then(([marketData, cropData]) => {
      if (!active) return;
      setMarkets(marketData); setCrops(cropData); setMarketId(String(marketData[0]?.id || ''));
    }).catch((err) => {
      if (!active) return;
      setError(apiMessage(err, t('prices.error')));
      setLoading(false);
    });
    return () => { active = false; };
  }, [t]);

  const loadPrices = useCallback(async () => {
    if (!marketId) return;
    setLoading(true); setError('');
    try { setRows(await getLatestPrices({ market_id: marketId })); window.dispatchEvent(new Event('kisan:prices-refreshed')); }
    catch (err) { setError(apiMessage(err, t('prices.error'))); }
    finally { setLoading(false); }
  }, [marketId, t]);

  useEffect(() => { loadPrices(); }, [loadPrices]);
  usePullToRefresh(loadPrices);

  const categories = useMemo(() => [...new Set(crops.map((crop) => crop.category))], [crops]);
  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.toLocaleLowerCase();
    const matchesName = !query || row.crop_name.toLocaleLowerCase().includes(query) || row.crop_name_ur?.includes(search);
    return matchesName && (category === 'All' || row.category === category);
  }), [rows, search, category]);
  const selectedMarket = markets.find((market) => String(market.id) === marketId);

  return <>
    <section className="hero"><div className="wrap hero-grid">
      <div className="hero-copy"><div className="eyebrow">{t('prices.heroEyebrow')}</div><h1>{t('prices.heroTitle')}</h1><p>{t('prices.heroText')}</p><div className="hero-actions"><a className="btn" href="#price-board">{t('prices.explore')} ↗</a><Link className="btn btn-outline" to="/marketplace">{t('prices.browse')}</Link></div><div className="micro-proof"><div className="avatar-stack"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces" alt=""/><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces" alt=""/><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces" alt=""/></div><span>{t('prices.proof')}</span></div></div>
      <div className="hero-visual"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&auto=format&fit=crop&q=88" alt="Green agricultural fields"/><div className="float-price"><span className="label">{rows[0] ? localizedName(rows[0], i18n.language) : t('common.loading')}</span><strong>{rows[0] ? money(rows[0].today_price) : '—'}</strong>{rows[0] && <span className={priceChange(rows[0].today_price, rows[0].yesterday_price).change >= 0 ? 'up' : 'down'}>↗ {Math.abs(priceChange(rows[0].today_price, rows[0].yesterday_price).percent).toFixed(1)}%</span>}</div><div className="visual-caption"><div><strong>{t('onboarding.visualTitle')}</strong><small>{t('onboarding.visualText')}</small></div><span>01 / 03</span></div></div>
    </div></section>
    {!!rows.length && <section className="wrap"><div className="market-strip"><div className="market-intro"><small>{t('prices.pulse')}</small><h3>{t('prices.pulseTitle')}</h3><p>{t('prices.sampleUnit')}</p></div>{rows.slice(0, 3).map((row) => { const change = priceChange(row.today_price, row.yesterday_price); return <div className="market-stat" key={row.crop_id}><span>{localizedName(row, i18n.language)}</span><strong>{Number(row.today_price).toLocaleString('en-PK')}</strong><em className={change.change < 0 ? 'negative' : ''}>{change.change >= 0 ? '↑' : '↓'} {Math.abs(change.percent).toFixed(1)}%</em></div>; })}</div></section>}
    <section className="section" id="price-board"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{t('prices.eyebrow')}</div><h2>{t('prices.title')}</h2><p>{t('prices.subtitle')}</p></div><div className="section-links"><Link className="text-link" to="/marketplace">{t('footer.marketplace')} ↗</Link>{user.role === 'Farmer' && <Link className="text-link" to="/profit">{t('profit.open')} ↗</Link>}</div></div>
      <div className="dashboard-grid"><div className="panel"><div className="panel-title"><h3>{t('prices.title')}</h3><button className="row-action" type="button" onClick={loadPrices}>{t('common.refresh')} ↻</button></div><div className="search-row"><div className="searchbox"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('prices.search')} /></div><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="All">{t('prices.category')}</option>{categories.map((item) => <option key={item} value={item}>{t(`categories.${item}`, item)}</option>)}</select><select className="select" value={marketId} onChange={(e) => setMarketId(e.target.value)} aria-label={t('prices.market')}>{markets.map((market) => <option key={market.id} value={market.id}>{localizedName(market, i18n.language)}</option>)}</select></div>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={loadPrices} /> : filtered.length ? <PriceTable rows={filtered} marketId={marketId} /> : <EmptyState message={t('prices.empty')} />}<p className="subtle board-note">{t('prices.pull')}</p></div>
        {!loading && !error && <PriceInsight crop={filtered[0] || rows[0]} market={selectedMarket} />}</div>
    </div></section>
  </>;
}
