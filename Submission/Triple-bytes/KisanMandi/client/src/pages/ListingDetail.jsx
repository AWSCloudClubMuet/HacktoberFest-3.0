import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteListing, getListing, markListingSold } from '../api/listings.js';
import { apiMessage } from '../api/client.js';
import { ErrorState, LoadingState } from '../components/StatusState.jsx';
import { cropImage, marketLabel, money } from '../utils/format.js';
import { useUser } from '../context/UserContext.jsx';

export default function ListingDetail() {
  const { listingId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getListing(listingId).then((data) => active && setListing(data)).catch((err) => active && setError(apiMessage(err, t('marketplace.detailError')))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId, t]);
  if (loading) return <section className="section"><LoadingState /></section>;
  if (error || !listing) return <section className="section"><div className="wrap"><ErrorState message={error || t('marketplace.detailError')} /></div></section>;
  const name = i18n.language === 'ur' ? listing.crop_name_ur : listing.crop_name;
  const label = marketLabel(listing.asking_price, listing.market_avg_price);
  const whatsappPhone = listing.contact_phone.replace(/^0/, '92');
  const ownListing = user.role === 'Farmer' && listing.user_id === user.id;
  const markSold = async () => {
    if (!window.confirm(t('myListings.soldConfirm'))) return;
    try { setListing(await markListingSold(listing.id)); }
    catch (err) { setError(apiMessage(err, t('myListings.actionError'))); }
  };
  const remove = async () => {
    if (!window.confirm(t('myListings.deleteConfirm'))) return;
    try { await deleteListing(listing.id); navigate('/my-listings'); }
    catch (err) { setError(apiMessage(err, t('myListings.actionError'))); }
  };
  return <section className="section detail-section"><div className="wrap"><Link className="back-link" to="/marketplace">← {t('common.back')}</Link><div className="listing-detail">
    <div className="listing-detail-image"><img src={cropImage(listing.crop_name)} alt={name}/><span className={`pill-label ${label}`}>{t(`marketplace.${label}`)}</span></div>
    <div className="listing-detail-copy"><div className="eyebrow">{t('marketplace.gradeLabel', { grade: listing.grade })}</div><h1>{name}</h1><p>{t(`districts.${listing.district}`, listing.district)} · {t('marketplace.availableFrom')} {listing.available_from}</p><div className="listing-price"><strong>{money(listing.asking_price)}</strong><span>{t('common.perUnit')}</span></div><dl><div><dt>{t('marketplace.quantity')}</dt><dd>{listing.quantity} {t('marketplace.available')}</dd></div><div><dt>{t('marketplace.seller')}</dt><dd>{listing.seller_name}</dd></div><div><dt>{t('marketplace.askingPrice')}</dt><dd>{money(listing.asking_price)}</dd></div></dl>{ownListing ? <div className="contact-actions owner-actions"><Link className="btn" to={`/my-listings/${listing.id}/edit`}>{t('common.edit')}</Link>{listing.status === 'Active' && <button className="btn btn-outline" onClick={markSold}>{t('myListings.markSold')}</button>}<button className="btn danger-btn" onClick={remove}>{t('common.delete')}</button></div> : <div className="contact-actions"><a className="btn" href={`tel:${listing.contact_phone}`}>{t('marketplace.call')} ↗</a><a className="btn btn-outline" href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">{t('marketplace.whatsapp')} ↗</a></div>}</div>
  </div></div></section>;
}
