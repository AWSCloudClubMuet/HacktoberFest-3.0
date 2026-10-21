import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGigs } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import useReveal from '../hooks/useReveal.js';
import HeroSlider from '../components/HeroSlider.jsx';
import Filters from '../components/Filters.jsx';
import GigCard, { GigCardSkeleton } from '../components/GigCard.jsx';
import { CATEGORIES, CATEGORY_ICONS } from '../utils/constants.js';

const gigCache = new Map();
const EMPTY_FILTERS = { cats: [], types: [], pays: [], min: '', max: '' };

export default function Home() {
  const { t } = useTranslation();
  const toast = useToast();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useReveal(loading);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (filters.cats.length === 1) params.category = filters.cats[0];
      if (filters.types.length === 1) params.type = filters.types[0];
      if (filters.pays.length === 1) params.payment_type = filters.pays[0];
      if (filters.min !== '') params.min_budget = filters.min;
      if (filters.max !== '') params.max_budget = filters.max;

      const key = JSON.stringify(params);
      if (gigCache.has(key) && !ignore) {
        setGigs(gigCache.get(key));
        setLoading(false);
      }

      try {
        const data = await getGigs(params);
        gigCache.set(key, data);
        if (!ignore) setGigs(data);
      } catch (err) {
        if (!ignore) toast.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, q ? 300 : 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [q, filters]);

  const visible = useMemo(() => {
    const list = gigs.filter(
      (g) =>
        (!filters.cats.length || filters.cats.includes(g.category)) &&
        (!filters.types.length || filters.types.includes(g.type)) &&
        (!filters.pays.length || filters.pays.includes(g.payment_type)),
    );
    if (sort === 'low') list.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0));
    if (sort === 'high') list.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
    return list;
  }, [gigs, filters, sort]);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setQ('');
    setSort('new');
  }, []);

  function pickCategory(cat) {
    setFilters({ ...EMPTY_FILTERS, cats: [cat] });
    setQ('');
    document.getElementById('allgigs')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section className="home-hero">
        <div className="wrap hero-copy reveal">
          <div className="eyebrow">
            <span className="dot" /> {t('hero.eyebrow')}
          </div>
          <h1>
            {t('hero.title1')}
            <br />
            <em>{t('hero.title2')}</em>
          </h1>
          <p>{t('hero.sub')}</p>
          <div className="hero-actions">
            <a className="btn" href="#browse">
              {t('hero.explore')} <span className="arrow">↗</span>
            </a>
            <Link className="btn light" to="/gigs/new">
              {t('hero.post')}
            </Link>
          </div>
        </div>
        <HeroSlider />
      </section>

      <section className="wrap section" id="browse">
        <div className="section-head reveal">
          <div>
            <div className="eyebrow">{t('categories.eyebrow')}</div>
            <h2>{t('categories.title')}</h2>
            <p>{t('categories.sub')}</p>
          </div>
          <a className="textlink" href="#allgigs">
            {t('categories.browseAll')} <span className="arrow">↗</span>
          </a>
        </div>

        <div className="category-row reveal">
          {CATEGORIES.map((c) => (
            <button type="button" className="category" key={c} onClick={() => pickCategory(c)}>
              <div className="cat-icon">{CATEGORY_ICONS[c]}</div>
              <div>
                <strong>{t(`categories.${c}`)}</strong>
                <span className="sub">{t(`categories.${c}Sub`)}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="section-head reveal" id="allgigs">
          <div>
            <div className="eyebrow">{t('board.eyebrow')}</div>
            <h2>{t('board.title')}</h2>
            <p>{t('board.sub')}</p>
          </div>
          <span className="tag">{t('board.tag')}</span>
        </div>

        <div className="browse">
          <Filters value={filters} onChange={setFilters} onReset={reset} />

          <div>
            <div className="searchbar">
              <div className="searchwrap">
                <span>⌕</span>
                <input
                  type="search"
                  value={q}
                  placeholder={t('search.placeholder')}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="new">{t('search.sortNew')}</option>
                <option value="low">{t('search.sortLow')}</option>
                <option value="high">{t('search.sortHigh')}</option>
              </select>
            </div>

            <div className="resultsline">
              <span>
                <strong>{t('results.count', { count: visible.length })}</strong> {t('results.suffix')}
              </span>
              <span>{t('results.right')}</span>
            </div>

            <div className="gigs">
              {loading && Array.from({ length: 4 }, (_, i) => <GigCardSkeleton key={i} />)}

              {!loading && visible.map((g) => <GigCard key={g.id} gig={g} />)}

              {!loading && visible.length === 0 && (
                <div className="empty">
                  <strong style={{ color: 'var(--ink)' }}>{t('empty.title')}</strong>
                  <br />
                  {t('empty.hint')}
                  <br />
                  <button className="btn light small" style={{ marginTop: 13 }} onClick={reset}>
                    {t('empty.reset')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="steps" id="how">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">{t('how.eyebrow')}</div>
              <h2>{t('how.title')}</h2>
              <p>{t('how.sub')}</p>
            </div>
          </div>
          <div className="steps-grid">
            {[1, 2, 3].map((n) => (
              <article className="step reveal" key={n}>
                <div className="stepnum">0{n}</div>
                <h3>{t(`how.s${n}Title`)}</h3>
                <p>{t(`how.s${n}Body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap cta" id="community">
        <div className="cta-box reveal">
          <div>
            <h2>{t('cta.title')}</h2>
            <p>{t('cta.sub')}</p>
          </div>
          <Link className="btn lime" to="/gigs/new">
            {t('cta.button')} <span className="arrow">↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
