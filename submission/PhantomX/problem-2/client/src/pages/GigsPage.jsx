import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { CATEGORIES } from '../constants.js';
import { Alert, Empty, Link, buttonClass } from '../components.jsx';
import { CatalogueSkeleton, GigCard, GigRow, PageHeader } from '../ui.jsx';
import { SECTIONS, isResultsView, parseSearch, presentGigs, toQuery } from '../section.js';

export function GigsPage() {
  const { section, query, navigate, users, userId } = useApp();
  const filters = parseSearch(query);
  const copy = SECTIONS[section] || SECTIONS.offer;
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('type', copy.browseType);
    if (filters.category) params.set('category', filters.category);
    if (filters.payment_type) params.set('payment_type', filters.payment_type);
    if (filters.min.trim() !== '' && Number.isFinite(Number(filters.min))) params.set('min', filters.min.trim());
    if (filters.max.trim() !== '' && Number.isFinite(Number(filters.max))) params.set('max', filters.max.trim());
    if (filters.q) params.set('q', filters.q);

    let cancelled = false;
    setError('');
    setGigs(null);
    api(`/gigs?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setGigs(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setGigs([]);
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [copy.browseType, filters.category, filters.payment_type, filters.min, filters.max, filters.q]);

  function go(next) {
    navigate(`/${section}${toQuery(next)}`);
  }

  function removeFilter(key) {
    go({ ...filters, [key]: '' });
  }

  const results = isResultsView(filters);
  const others = gigs ? gigs.filter((gig) => gig.user_id !== userId) : [];
  const rows = gigs ? presentGigs(others, filters) : [];
  const catalogue = gigs ? presentGigs(others, {}) : [];
  const newest = [...catalogue].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const paid = catalogue.filter((gig) => gig.payment_type === 'Paid').slice(0, 8);
  const swapFree = catalogue.filter((gig) => gig.payment_type !== 'Paid').slice(0, 8);
  const closing = catalogue
    .filter((gig) => gig.status === 'Open')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);

  const post = (
    <Link to={`/gigs/new?type=${copy.postType}`} className={`${buttonClass} ${section === 'request' ? 'fill-request' : ''}`}>
      {copy.post}
    </Link>
  );
  const openCount = catalogue.filter((gig) => gig.status === 'Open').length;
  const swapCount = catalogue.filter((gig) => gig.payment_type === 'SkillSwap').length;
  const closingCount = catalogue.filter((gig) => (
    gig.status === 'Open' && new Date(gig.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  )).length;

  return (
    <div id={section === 'request' ? 'panel-request' : 'panel-offer'} role="tabpanel" aria-labelledby={section === 'request' ? 'tab-request' : 'tab-offer'} className="space-y-4">
      <section className={`rounded-2xl px-4 py-4 shadow-card sm:px-5 sm:py-5 ${section === 'request' ? 'hero-request' : 'hero-offer'}`}>
        <PageHeader eyebrow={copy.label} title={copy.headline} subtitle={copy.subtitle} actions={post} />
      </section>

      {!results && catalogue.length > 0 ? (
        <dl className="grid grid-cols-3 gap-2">
          <Stat value={openCount} label="Open gigs" />
          <Stat value={swapCount} label="SkillSwaps" />
          <Stat value={closingCount} label="Closing soon" />
        </dl>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Popular categories</p>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${filters.category === category ? 'border-transparent text-white ' + (section === 'request' ? 'fill-request' : 'fill-offer') : 'border-line bg-surface text-ink'}`}
            onClick={() => go({ ...filters, category: filters.category === category ? '' : category, status: filters.category === category ? filters.status : 'Open' })}
          >
            {category}
          </button>
        ))}
        </div>
      </div>

      <Alert>{error}</Alert>
      {gigs === null && !error ? <CatalogueSkeleton /> : null}

      {results ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{rows.length} {rows.length === 1 ? 'result' : 'results'}</p>
            {chipList(filters).map((chip) => (
              <button key={chip.key} type="button" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-3 text-sm font-semibold text-ink shadow-card" onClick={() => removeFilter(chip.key)}>
                {chip.label}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove {chip.label}</span>
              </button>
            ))}
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-offer" onClick={() => navigate(`/${section}`)}>
              Clear all
            </button>
          </div>
          {rows.length === 0 && !error ? (
            <Empty>
              Nothing matches these filters.{' '}
              <button type="button" className="font-semibold text-offer underline-offset-2 hover:underline" onClick={() => navigate(`/${section}`)}>Back to the catalogue</button>
            </Empty>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((gig) => (
                <li key={gig.id} className="min-w-0">
                  <GigCard gig={gig} section={section} posterName={users.find((user) => user.id === gig.user_id)?.name} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {!results && gigs && catalogue.length === 0 && !error ? (
        <Empty>
          {copy.empty}{' '}
          <Link to={`/gigs/new?type=${copy.postType}`} className={`font-semibold underline-offset-2 hover:underline ${section === 'request' ? 'text-request' : 'text-offer'}`}>{copy.post}</Link>
        </Empty>
      ) : null}

      {!results && catalogue.length > 0 ? (
        <div className="space-y-4">
          <GigRow title={`Newest ${copy.noun}`} gigs={newest} users={users} section={section} seeAllTo={`/${section}?sort=newest`} />
          <GigRow title={`Paid ${copy.noun}`} gigs={paid} users={users} section={section} seeAllTo={`/${section}?payment_type=Paid`} />
          <GigRow title="SkillSwap & Free" gigs={swapFree} users={users} section={section} seeAllTo={`/${section}?group=unpaid`} />
          <GigRow title="Closing soon" gigs={closing} users={users} section={section} seeAllTo={`/${section}?group=closing&sort=deadline`} />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2 shadow-card">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function chipList(filters) {
  const chips = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”` });
  if (filters.category) chips.push({ key: 'category', label: filters.category });
  if (filters.payment_type) chips.push({ key: 'payment_type', label: filters.payment_type === 'SkillSwap' ? 'Skill Swap' : filters.payment_type });
  if (filters.min) chips.push({ key: 'min', label: `Min $${filters.min}` });
  if (filters.max) chips.push({ key: 'max', label: `Max $${filters.max}` });
  if (filters.status) chips.push({ key: 'status', label: filters.status });
  if (filters.sort) chips.push({ key: 'sort', label: filters.sort });
  if (filters.group === 'unpaid') chips.push({ key: 'group', label: 'SkillSwap & Free' });
  if (filters.group === 'closing') chips.push({ key: 'group', label: 'Closing soon' });
  return chips;
}
