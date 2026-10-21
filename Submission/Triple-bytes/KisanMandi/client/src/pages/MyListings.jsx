import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteListing, getListings, markListingSold } from '../api/listings.js';
import { apiMessage } from '../api/client.js';
import { EmptyState, LoadingState } from '../components/StatusState.jsx';
import { cropImage, money } from '../utils/format.js';

export default function MyListings() {
  const { t, i18n } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setListings(await getListings({ mine: true })); }
    catch (err) { setError(apiMessage(err, t('myListings.error'))); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { load(); }, [load]);
  const sold = async (id) => {
    if (!window.confirm(t('myListings.soldConfirm'))) return;
    setBusyId(id);
    try { const updated = await markListingSold(id); setListings((rows) => rows.map((item) => item.id === id ? updated : item)); }
    catch (err) { setError(apiMessage(err, t('myListings.actionError'))); }
    finally { setBusyId(null); }
  };
  const remove = async (id) => {
    if (!window.confirm(t('myListings.deleteConfirm'))) return;
    setBusyId(id);
    try { await deleteListing(id); setListings((rows) => rows.filter((item) => item.id !== id)); }
    catch (err) { setError(apiMessage(err, t('myListings.actionError'))); }
    finally { setBusyId(null); }
  };
  return <section className="section tool-page"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{t('myListings.eyebrow')}</div><h2>{t('myListings.title')}</h2><p>{t('myListings.subtitle')}</p></div><Link className="btn" to="/my-listings/new">＋ {t('myListings.add')}</Link></div>{error && <div className="inline-error">{error}</div>}{loading ? <LoadingState /> : !listings.length ? <EmptyState message={t('myListings.empty')} /> : <div className="manage-list">{listings.map((listing) => {
    const name = i18n.language === 'ur' ? listing.crop_name_ur : listing.crop_name;
    return <article className="manage-card" key={listing.id}><img src={cropImage(listing.crop_name)} alt=""/><div className="manage-info"><div><span className={`status-pill ${listing.status.toLowerCase()}`}>{t(`myListings.${listing.status.toLowerCase()}`)}</span><h3>{name}</h3><p>{t(`districts.${listing.district}`, listing.district)} · {listing.grade}</p></div><div className="manage-numbers"><strong>{money(listing.asking_price)}</strong><span>{listing.quantity} {t('marketplace.available')}</span></div></div><div className="card-actions"><Link className="row-action" to={`/marketplace/${listing.id}`}>{t('common.details')}</Link><Link className="row-action" to={`/my-listings/${listing.id}/edit`}>{t('common.edit')}</Link>{listing.status === 'Active' && <button className="row-action" disabled={busyId === listing.id} onClick={() => sold(listing.id)}>{t('myListings.markSold')}</button>}<button className="row-action danger" disabled={busyId === listing.id} onClick={() => remove(listing.id)}>{t('common.delete')}</button></div></article>;
  })}</div>}</div></section>;
}
