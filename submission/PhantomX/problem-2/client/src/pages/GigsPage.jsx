import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { CATEGORIES, PAYMENTS, paymentLabel } from '../constants.js';
import { SECTIONS } from '../section.js';
import { formatMoney, formatWhen } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, inputClass, paymentTone, secondaryButtonClass, statusTone } from '../components.jsx';

const initialFilters = {
  category: '',
  type: '',
  payment_type: '',
  min: '',
  max: '',
};

export function GigsPage() {
  const { section } = useApp();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    params.set('type', SECTIONS[section]?.type || 'Offering');
    if (filters.payment_type) params.set('payment_type', filters.payment_type);
    if (filters.min.trim() !== '' && Number.isFinite(Number(filters.min))) params.set('min', filters.min.trim());
    if (filters.max.trim() !== '' && Number.isFinite(Number(filters.max))) params.set('max', filters.max.trim());
    if (search) params.set('q', search);
    const query = params.toString();

    let cancelled = false;
    setError('');
    api(query ? `/gigs?${query}` : '/gigs')
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
  }, [filters, search, section]);

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const filtering = Boolean(filters.category || filters.type || filters.payment_type || filters.min || filters.max || searchInput);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title text-ink">Gigs</h1>
        <p className="mt-2 text-base text-muted">Find short campus help, or offer a skill of your own.</p>
      </div>

      <button
        type="button"
        className={`${secondaryButtonClass} w-full md:hidden`}
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        {filtersOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <form className={`${filtersOpen ? 'grid' : 'hidden'} gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card md:grid sm:grid-cols-2 lg:grid-cols-3`} onSubmit={(event) => event.preventDefault()}>
        <label className="block min-w-0 text-base">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Category</span>
          <select className={inputClass} value={filters.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-base">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Payment</span>
          <select className={inputClass} value={filters.payment_type} onChange={(event) => update('payment_type', event.target.value)}>
            <option value="">Any payment</option>
            {PAYMENTS.map((payment) => <option key={payment.value} value={payment.value}>{payment.label}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-base">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Min budget</span>
          <input className={inputClass} type="number" min="0" step="1" value={filters.min} onChange={(event) => update('min', event.target.value)} />
        </label>
        <label className="block min-w-0 text-base">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Max budget</span>
          <input className={inputClass} type="number" min="0" step="1" value={filters.max} onChange={(event) => update('max', event.target.value)} />
        </label>
        <label className="block min-w-0 text-base">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Search</span>
          <input
            className={inputClass}
            type="search"
            placeholder="Title or description"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        {filtering ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => {
                setFilters(initialFilters);
                setSearchInput('');
                setSearch('');
              }}
            >
              Clear filters
            </button>
            <p className="mt-1 text-sm text-muted">A budget range only matches paid gigs.</p>
          </div>
        ) : null}
      </form>

      <Alert>{error}</Alert>
      {gigs === null && !error ? <Loading>Loading gigs…</Loading> : null}
      {gigs && gigs.length === 0 && !error ? <Empty>No gigs match these filters.</Empty> : null}
      {gigs && gigs.length > 0 ? (
        <>
          <p className="text-sm text-muted">{gigs.length} {gigs.length === 1 ? 'gig' : 'gigs'}</p>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gigs.map((gig) => (
              <li key={gig.id} className="min-w-0">
                <Link to={`/gigs/${gig.id}`} className="flex h-full min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-primary">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
                    <Badge tone={gig.type === 'Offering' ? 'offering' : 'requesting'}>{gig.type}</Badge>
                    <Badge tone={paymentTone(gig.payment_type)}>{paymentLabel(gig.payment_type)}</Badge>
                  </div>
                  <h2 className="break-words font-display text-lg font-semibold leading-snug text-ink">{gig.title}</h2>
                  <p className="text-sm text-muted">{gig.category}</p>
                  <p className="text-sm font-semibold text-secondary">
                    {gig.payment_type === 'Paid' && gig.budget != null ? formatMoney(gig.budget) : 'No budget'}
                  </p>
                  <p className="mt-auto text-sm text-muted">Deadline {formatWhen(gig.deadline)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
