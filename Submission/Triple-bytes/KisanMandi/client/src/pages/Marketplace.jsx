import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getListings } from '../api/listings.js';
import { apiMessage } from '../api/client.js';
import ListingCard from '../components/ListingCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusState.jsx';
import { useUser } from '../context/UserContext.jsx';

const districts = ['Hyderabad', 'Sukkur', 'Mirpurkhas', 'Karachi'];

export default function Marketplace() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [grade, setGrade] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setListings(await getListings({ district: district || undefined, grade: grade || undefined, sort })); }
    catch (err) { setError(apiMessage(err, t('marketplace.error'))); }
    finally { setLoading(false); }
  }, [district, grade, sort, t]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase();
    return listings.filter((item) => !query || item.crop_name.toLocaleLowerCase().includes(query) || item.crop_name_ur?.includes(search));
  }, [listings, search]);

  return <>
    <section className="marketplace-hero"><div className="wrap marketplace-hero-inner"><div><div className="eyebrow">{t('marketplace.eyebrow')}</div><h1>{t('marketplace.title')}</h1><p>{t('marketplace.subtitle')}</p></div>{user.role === 'Farmer' && <Link className="btn" to="/my-listings/new">＋ {t('myListings.add')}</Link>}</div></section>
    <section className="section marketplace-section"><div className="wrap"><div className="search-row marketplace-tools"><div className="searchbox"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('marketplace.search')} /></div><select className="select" value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">{t('marketplace.district')}</option>{districts.map((item) => <option key={item} value={item}>{t(`districts.${item}`)}</option>)}</select><select className="select" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">{t('marketplace.grade')}</option>{['A','B','C'].map((item) => <option key={item}>{item}</option>)}</select><select className="select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">{t('marketplace.newest')}</option><option value="price_asc">{t('marketplace.priceAsc')}</option></select></div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length ? <div className="listing-grid">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <EmptyState message={t('marketplace.empty')} />}
    </div></section>
  </>;
}
