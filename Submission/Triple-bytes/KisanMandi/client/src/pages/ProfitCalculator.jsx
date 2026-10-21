import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { compareMarkets, getCrops, getMarkets } from '../api/prices.js';
import { apiMessage } from '../api/client.js';
import { LoadingState } from '../components/StatusState.jsx';
import { localizedName, money } from '../utils/format.js';

export default function ProfitCalculator() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [cropId, setCropId] = useState(params.get('crop_id') || '');
  const [marketId, setMarketId] = useState(params.get('market_id') || '');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(50);
  const [cost, setCost] = useState(2800);
  const [shift, setShift] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getCrops(), getMarkets()]).then(([cropRows, marketRows]) => {
      if (!active) return;
      setCrops(cropRows); setMarkets(marketRows);
      setCropId((old) => old || String(cropRows[0]?.id || ''));
      setMarketId((old) => old || String(marketRows[0]?.id || ''));
      if (!cropRows.length || !marketRows.length) setLoading(false);
    }).catch((err) => {
      if (!active) return;
      setError(apiMessage(err, t('profit.error')));
      setLoading(false);
    });
    return () => { active = false; };
  }, [t]);
  useEffect(() => {
    if (!cropId || !marketId) return;
    let active = true; setLoading(true);
    compareMarkets(cropId).then((rows) => { if (active) setPrice(Number(rows.find((row) => String(row.market_id) === marketId)?.price || 0)); }).catch((err) => active && setError(apiMessage(err, t('profit.error')))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [cropId, marketId, t]);
  const result = useMemo(() => {
    const adjusted = price * (1 + Number(shift) / 100);
    const revenue = Number(quantity || 0) * adjusted;
    const totalCost = Number(quantity || 0) * Number(cost || 0);
    const profit = revenue - totalCost;
    return { adjusted, revenue, totalCost, profit, margin: revenue ? profit / revenue * 100 : 0 };
  }, [price, shift, quantity, cost]);
  return <section className="section profit-page"><div className="wrap"><Link className="back-link" to="/prices">← {t('common.back')}</Link><div className="calc"><div className="calc-copy"><div className="eyebrow">{t('profit.eyebrow')}</div><h1>{t('profit.title')}</h1><p>{t('profit.text')}</p><p className="subtle">{t('profit.unit')}</p></div><div className="calc-form">{loading ? <LoadingState /> : <><div className="field-grid"><div className="field"><label>{t('profit.crop')}</label><select value={cropId} onChange={(e) => setCropId(e.target.value)}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{localizedName(crop, i18n.language)}</option>)}</select></div><div className="field"><label>{t('profit.market')}</label><select value={marketId} onChange={(e) => setMarketId(e.target.value)}>{markets.map((market) => <option key={market.id} value={market.id}>{localizedName(market, i18n.language)}</option>)}</select></div><div className="field"><label>{t('profit.quantity')}</label><input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)}/></div><div className="field"><label>{t('profit.cost')}</label><input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)}/></div></div>{error && <div className="form-alert">{error}</div>}<div className="current-price"><span>{t('profit.adjustedPrice')}</span><strong>{money(result.adjusted)}</strong></div><div className="slider-wrap"><div className="slider-label"><label>{t('profit.shift')}</label><span>{shift > 0 ? '+' : ''}{shift}%</span></div><input type="range" min="-20" max="20" step="1" value={shift} onChange={(e) => setShift(Number(e.target.value))}/><div className="range-labels"><span>−20%</span><span>{t('profit.current')}</span><span>+20%</span></div></div><div className="calc-results"><div className="result"><span>{t('profit.revenue')}</span><strong>{money(result.revenue)}</strong></div><div className="result"><span>{t('profit.totalCost')}</span><strong>{money(result.totalCost)}</strong></div><div className="result profit"><span>{result.profit >= 0 ? t('profit.profit') : t('profit.loss')}</span><strong className={result.profit < 0 ? 'loss' : ''}>{money(result.profit)}</strong></div></div><p className="subtle margin-text">{t('profit.margin')}: {result.margin.toFixed(1)}%</p></>}</div></div></div></section>;
}
