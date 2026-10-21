import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localizedName, money } from '../utils/format.js';

export default function PriceInsight({ crop, market }) {
  const { t, i18n } = useTranslation();
  if (!crop) return null;
  return <aside className="panel insight-card">
    <div className="insight-top"><div className="panel-title"><h3>{t('prices.trend')}</h3><span className="subtle">{t('prices.days')}</span></div><p>{localizedName(crop, i18n.language)} · {localizedName(market, i18n.language)}</p>
      <svg className="chart" viewBox="0 0 320 155" role="img" aria-label={t('prices.trend')}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6e9b69" stopOpacity=".25"/><stop offset="1" stopColor="#6e9b69" stopOpacity="0"/></linearGradient></defs><path d="M0 118 H320 M0 82 H320 M0 46 H320" stroke="#e8ede3" fill="none"/><path d="M0 123 L25 111 L48 116 L72 87 L96 93 L120 75 L145 88 L168 59 L193 65 L217 43 L242 55 L265 34 L291 42 L320 18 L320 155 L0 155Z" fill="url(#chartFill)"/><path d="M0 123 L25 111 L48 116 L72 87 L96 93 L120 75 L145 88 L168 59 L193 65 L217 43 L242 55 L265 34 L291 42 L320 18" fill="none" stroke="#39734b" strokeWidth="2.5" strokeLinecap="round"/><circle cx="320" cy="18" r="4.5" fill="#245c3a" stroke="#fff" strokeWidth="2"/></svg>
    </div>
    <div className="best-market"><span className="tag">{t('common.today')}</span><h4>{localizedName(crop, i18n.language)}</h4><p>{t('common.perUnit')}</p><div className="best-price"><strong>{money(crop.today_price)}</strong><Link className="text-link" to={`/prices/${crop.crop_id}`} state={{ crop, marketId: market?.id }}>{t('prices.compare')} ↗</Link></div></div>
  </aside>;
}
