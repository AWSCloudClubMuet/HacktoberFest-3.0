import { useEffect, useId, useRef, useState } from 'react';
import { HandHelping, Megaphone, Search, X } from 'lucide-react';
import { CATEGORIES, PAYMENTS, paymentLabel } from './constants.js';
import { closesIn, formatMoney, formatWhen, initials } from './format.js';
import { SECTIONS, SORTS, STATUSES, emptyFilters } from './section.js';
import { Badge, Link, paymentTone, statusTone } from './components.jsx';

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p> : null}
        <h1 className="page-title text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-base text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTabs({ value, onChange }) {
  const offerRef = useRef(null);
  const requestRef = useRef(null);

  function select(next) {
    onChange(next);
    (next === 'request' ? requestRef : offerRef).current?.focus();
  }

  function onKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    select(value === 'offer' ? 'request' : 'offer');
  }

  return (
    <div
      role="tablist"
      aria-label="Service sections"
      className="grid w-full grid-cols-2 gap-1 rounded-3xl border border-line bg-surface/80 p-1 shadow-card"
      onKeyDown={onKeyDown}
    >
      <SectionTab
        buttonRef={offerRef}
        id="tab-offer"
        controls="panel-offer"
        selected={value === 'offer'}
        onSelect={() => select('offer')}
        icon={HandHelping}
        label={SECTIONS.offer.label}
        activeClass="fill-offer text-white"
      />
      <SectionTab
        buttonRef={requestRef}
        id="tab-request"
        controls="panel-request"
        selected={value === 'request'}
        onSelect={() => select('request')}
        icon={Megaphone}
        label={SECTIONS.request.label}
        activeClass="fill-request text-white"
      />
    </div>
  );
}

function SectionTab({ buttonRef, id, controls, selected, onSelect, icon: Icon, label, activeClass }) {
  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-semibold transition duration-150 sm:min-h-14 sm:px-4 sm:text-base ${selected ? activeClass : 'text-muted hover:bg-canvas'}`}
      onClick={onSelect}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="text-balance">{label}</span>
    </button>
  );
}

export function GigCard({ gig, posterName, section = 'offer' }) {
  const copy = SECTIONS[section] || SECTIONS.offer;
  return (
    <Link
      to={`/gigs/${gig.id}`}
      className="card-lift flex h-full min-w-0 flex-col gap-3 rounded-3xl border border-line/80 bg-surface p-4 shadow-card"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
        <Badge tone="neutral">{gig.category}</Badge>
        <Badge tone={paymentTone(gig.payment_type)}>{paymentLabel(gig.payment_type)}</Badge>
      </div>
      <h2 className="break-words font-display text-lg font-semibold leading-snug text-ink">{gig.title}</h2>
      <p className="line-clamp-2 text-sm leading-6 text-muted">{gig.description}</p>
      <p className="text-sm font-semibold text-ink">
        {gig.payment_type === 'Paid' && gig.budget != null ? formatMoney(gig.budget) : 'No budget'}
      </p>
      <p className="text-sm text-muted">
        {formatWhen(gig.deadline)}
        {(gig.status === 'Open' || gig.status === 'In Progress') && closesIn(gig.deadline) ? <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wide text-coral">{closesIn(gig.deadline)}</span> : null}
      </p>
      <div className="mt-auto flex min-w-0 items-center gap-2 pt-1">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${section === 'request' ? 'bg-request' : 'bg-offer'}`} aria-hidden="true">
          {initials(posterName)}
        </span>
        <p className="min-w-0 truncate text-sm text-muted">
          <span className="font-medium text-ink">{copy.by}</span> {posterName || 'Student'}
        </p>
      </div>
    </Link>
  );
}

export function GigRow({ title, gigs, users, section, seeAllTo }) {
  if (!gigs.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {seeAllTo ? (
          <Link to={seeAllTo} className={`inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline ${section === 'request' ? 'text-request' : 'text-offer'}`}>
            See all
          </Link>
        ) : null}
      </div>
      <ul className="row-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {gigs.map((gig) => (
          <li key={gig.id} className="w-[17.5rem] shrink-0">
            <GigCard gig={gig} section={section} posterName={users.find((user) => user.id === gig.user_id)?.name} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CatalogueSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-28 animate-pulse rounded-3xl bg-line/80" />
      <div className="flex gap-3 overflow-hidden">
        <div className="h-64 w-[17.5rem] shrink-0 animate-pulse rounded-3xl bg-line/70" />
        <div className="h-64 w-[17.5rem] shrink-0 animate-pulse rounded-3xl bg-line/60" />
        <div className="hidden h-64 w-[17.5rem] shrink-0 animate-pulse rounded-3xl bg-line/50 sm:block" />
      </div>
      <p className="text-sm text-muted">Loading gigs…</p>
    </div>
  );
}

function trapFocus(root, event) {
  if (event.key !== 'Tab') return;
  const items = [...root.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.offsetParent !== null);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function SearchDock({ section, filters, open, onOpen, onClose, onApply, onClear }) {
  const panelId = useId();
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const rootRef = useRef(null);
  const copy = SECTIONS[section] || SECTIONS.offer;

  useEffect(() => {
    function onKey(event) {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        onOpen();
        inputRef.current?.focus();
      } else if (event.key === 'Escape' && open) {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpen, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) onClose();
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, onClose]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 md:flex-1">
      <button
        type="button"
        className="hidden h-11 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 text-left text-sm text-muted shadow-sm md:inline-flex"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <Search size={16} aria-hidden="true" />
        <span className="truncate">{filters.q || `Search gigs in ${copy.short}...`}</span>
      </button>
      <button
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink md:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Search gigs in ${copy.short}`}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <Search size={18} aria-hidden="true" />
      </button>
      {open ? (
        <SearchPanel
          id={panelId}
          panelRef={panelRef}
          inputRef={inputRef}
          section={section}
          initial={filters}
          onApply={onApply}
          onClear={onClear}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}

export function SearchPanel({ id, panelRef, inputRef, section, initial, onApply, onClear, onClose }) {
  const copy = SECTIONS[section] || SECTIONS.offer;
  const [draft, setDraft] = useState(() => ({
    ...emptyFilters(),
    ...initial,
    status: initial.status || 'Open',
    sort: initial.sort || 'newest',
  }));

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function onKeyDown(event) {
    if (window.matchMedia('(max-width: 767px)').matches) trapFocus(panelRef.current, event);
  }

  return (
    <form
      id={id}
      ref={panelRef}
      role="dialog"
      aria-label={`Search ${copy.short}`}
      className="fixed inset-0 z-50 flex flex-col bg-canvas p-4 md:absolute md:inset-auto md:left-0 md:right-0 md:top-[calc(100%+0.5rem)] md:max-h-[min(32rem,70vh)] md:overflow-y-auto md:rounded-3xl md:border md:border-line md:bg-surface md:p-5 md:shadow-pop"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="mb-3 flex items-center justify-between md:hidden">
        <h2 className="font-display text-lg font-semibold">Search {copy.short}</h2>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line" onClick={onClose} aria-label="Close search">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold sm:col-span-2">
          Keyword
          <input
            ref={inputRef}
            className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal"
            placeholder={`Search gigs in ${copy.short}...`}
            value={draft.q}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Category
          <select className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" value={draft.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Payment
          <select className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" value={draft.payment_type} onChange={(event) => update('payment_type', event.target.value)}>
            <option value="">Any payment</option>
            {PAYMENTS.map((payment) => <option key={payment.value} value={payment.value}>{payment.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Min budget
          <input className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" type="number" min="0" value={draft.min} onChange={(event) => update('min', event.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Max budget
          <input className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" type="number" min="0" value={draft.max} onChange={(event) => update('max', event.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Status
          <select className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" value={draft.status || 'Open'} onChange={(event) => update('status', event.target.value)}>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Sort
          <select className="mt-1.5 min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-base font-normal" value={draft.sort || 'newest'} onChange={(event) => update('sort', event.target.value)}>
            {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="submit" className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-base font-semibold text-white ${section === 'request' ? 'fill-request' : 'fill-offer'}`}>
          Apply filters
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 text-base font-semibold"
          onClick={() => {
            setDraft(emptyFilters());
            onClear();
          }}
        >
          Clear all
        </button>
      </div>
    </form>
  );
}
