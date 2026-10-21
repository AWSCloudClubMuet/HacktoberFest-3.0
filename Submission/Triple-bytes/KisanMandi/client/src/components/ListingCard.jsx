import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropImage, marketLabel, money } from '../utils/format.js';

export default function ListingCard({ listing }) {
  const { t, i18n } = useTranslation();
  const name = i18n.language === 'ur' ? listing.crop_name_ur : listing.crop_name;
  const label = marketLabel(listing.asking_price, listing.market_avg_price);
  return <article className="listing"><img src={cropImage(listing.crop_name)} alt={name} loading="lazy"/><div className="listing-body"><div className="listing-top"><span className="grade">{t('marketplace.gradeLabel', { grade: listing.grade })}</span><span className={`pill-label ${label}`}>{t(`marketplace.${label}`)}</span></div><h3>{name}</h3><span className="place">{t(`districts.${listing.district}`, listing.district)} · {listing.available_from}</span><div className="listing-bottom"><div><strong>{money(listing.asking_price)}</strong><small>{t('common.perUnit')} · {listing.quantity} {t('marketplace.available')}</small></div><Link className="row-action" to={`/marketplace/${listing.id}`}>{t('marketplace.contact')} ↗</Link></div></div></article>;
}
