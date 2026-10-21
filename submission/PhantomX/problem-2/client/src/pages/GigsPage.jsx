import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES, GIG_TYPES, PAYMENTS, paymentLabel } from '../constants.js';
import { formatMoney, formatWhen } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, inputClass, statusTone } from '../components.jsx';

const initialFilters = {
  category: '',
  type: '',
  payment_type: '',
  min: '',
  max: '',
};

export function GigsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
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
  }, [filters, search]);

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  const filtering = Boolean(filters.category || filters.type || filters.payment_type || filters.min || filters.max || searchInput);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Gigs</h1>
        <p className="mt-1 text-sm text-stone-600">Find short campus help, or offer a skill of your own.</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Category</span>
          <select className={inputClass} value={filters.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Type</span>
          <select className={inputClass} value={filters.type} onChange={(event) => update('type', event.target.value)}>
            <option value="">Offering and requesting</option>
            {GIG_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Payment</span>
          <select className={inputClass} value={filters.payment_type} onChange={(event) => update('payment_type', event.target.value)}>
            <option value="">Any payment</option>
            {PAYMENTS.map((payment) => <option key={payment.value} value={payment.value}>{payment.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Min budget</span>
          <input className={inputClass} type="number" min="0" step="1" value={filters.min} onChange={(event) => update('min', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Max budget</span>
          <input className={inputClass} type="number" min="0" step="1" value={filters.max} onChange={(event) => update('max', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Search</span>
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
              className="text-sm font-medium text-teal-800 hover:underline"
              onClick={() => {
                setFilters(initialFilters);
                setSearchInput('');
                setSearch('');
              }}
            >
              Clear filters
            </button>
            <p className="mt-1 text-xs text-stone-500">A budget range only matches paid gigs.</p>
          </div>
        ) : null}
      </form>

      <Alert>{error}</Alert>
      {gigs === null && !error ? <Loading>Loading gigs…</Loading> : null}
      {gigs && gigs.length === 0 && !error ? <Empty>No gigs match these filters.</Empty> : null}
      {gigs && gigs.length > 0 ? (
        <>
          <p className="text-sm text-stone-500">{gigs.length} {gigs.length === 1 ? 'gig' : 'gigs'}</p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gigs.map((gig) => (
              <li key={gig.id}>
                <Link to={`/gigs/${gig.id}`} className="flex h-full flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:border-teal-700">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
                    <Badge tone={gig.type === 'Offering' ? 'offering' : 'requesting'}>{gig.type}</Badge>
                  </div>
                  <h2 className="text-base font-semibold text-stone-900">{gig.title}</h2>
                  <p className="text-sm text-stone-500">{gig.category}</p>
                  <p className="text-sm text-stone-700">
                    {paymentLabel(gig.payment_type)}
                    {gig.payment_type === 'Paid' && gig.budget != null ? ` · ${formatMoney(gig.budget)}` : ''}
                  </p>
                  <p className="mt-auto text-sm text-stone-500">Deadline {formatWhen(gig.deadline)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
