import { useEffect, useId, useRef, useState } from 'react';
import { Code2, GraduationCap, HandHelping, Megaphone, MessageCircle, Palette, PenLine, Search, Star, Wallet, X } from 'lucide-react';
import logoUrl from './assets/logo.svg';
import { CATEGORIES, PAYMENTS, paymentLabel } from './constants.js';
import { closesIn, formatMoney, formatWhen, initials } from './format.js';
import { SECTIONS, SORTS, STATUSES, emptyFilters } from './section.js';
import { Badge, Link, paymentTone, statusTone } from './components.jsx';

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p> : null}
        <h1 className="page-title text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p> : null}
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
      className="grid w-full grid-cols-2 gap-1 rounded-3xl border border-line bg-surface/90 p-1 shadow-card lg:w-max lg:rounded-full"
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-3 text-sm font-semibold transition duration-150 sm:px-4 sm:text-base lg:rounded-full lg:px-2.5 lg:text-sm xl:px-3 ${selected ? activeClass : 'text-muted hover:bg-canvas'}`}
      onClick={onSelect}
    >
      <Icon size={18} aria-hidden="true" className="lg:hidden xl:inline" />
      <span>{label}</span>
    </button>
  );
}

const CATEGORY_MARK = {
  Programming: { icon: Code2, bar: 'bg-offer' },
  Design: { icon: Palette, bar: 'bg-request' },
  Writing: { icon: PenLine, bar: 'bg-coral' },
  Tutoring: { icon: GraduationCap, bar: 'bg-progress' },
};

export function GigCard({ gig, posterName, section = 'offer' }) {
  const copy = SECTIONS[section] || SECTIONS.offer;
  const mark = CATEGORY_MARK[gig.category] || CATEGORY_MARK.Programming;
  const Icon = mark.icon;
  return (
    <Link
      to={`/gigs/${gig.id}`}
      className="card-lift flex h-full min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card"
    >
      <span className={`h-1.5 ${mark.bar}`} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-band px-2 text-xs font-semibold text-ink">
            <Icon size={14} aria-hidden="true" />
            {gig.category}
          </span>
          <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
          <Badge tone={paymentTone(gig.payment_type)}>{paymentLabel(gig.payment_type)}</Badge>
        </div>
        <h2 className="break-words font-display text-base font-semibold leading-snug text-ink">{gig.title}</h2>
        <p className="line-clamp-2 text-sm leading-5 text-muted">{gig.description}</p>
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
      </div>
    </Link>
  );
}

export function GigRow({ title, gigs, users, section, seeAllTo }) {
  if (!gigs.length) return null;
  return (
    <section className="space-y-2 rounded-2xl bg-band p-3 sm:p-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {seeAllTo ? (
          <Link to={seeAllTo} className={`inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline ${section === 'request' ? 'text-request' : 'text-offer'}`}>
            See all
          </Link>
        ) : null}
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gigs.map((gig) => (
          <li key={gig.id} className="min-w-0">
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
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        className="hidden h-11 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 text-left text-sm text-muted shadow-sm lg:inline-flex"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <Search size={16} aria-hidden="true" />
        <span className="truncate">{filters.q || `Search gigs in ${copy.short}...`}</span>
      </button>
      <button
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink lg:hidden"
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

const BANNER_POINTS = [
  { icon: Wallet, text: 'Paid, SkillSwap or Free gigs' },
  { icon: MessageCircle, text: 'Chat and video calls with your partner' },
  { icon: Star, text: 'Reviews that build trust' },
];

export function AuthBanner({ tone = 'offer', headline, subtitle }) {
  const hero = tone === 'request' ? 'hero-request' : 'hero-offer';
  return (
    <section className={`relative overflow-hidden ${hero}`} aria-label="Campus Gig">
      <div className="auth-banner-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-on-night/15 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 right-4 h-44 w-44 rounded-full bg-coral-bright/25 blur-2xl" aria-hidden="true" />
      <div className="relative flex min-h-44 flex-col justify-center px-5 py-4 sm:min-h-48 lg:min-h-[34rem] lg:justify-between lg:px-8 lg:py-8">
        <div className="max-w-md lg:max-w-[15rem]">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="" width="48" height="48" className="h-9 w-9 lg:h-12 lg:w-12" />
            <p className="font-display text-lg font-bold leading-tight text-on-night lg:text-xl">
              Campus Gig
              <span className="font-medium text-offer-soft"> & SkillSwap</span>
            </p>
          </div>
          <h2 className="mt-3 font-display text-xl font-bold leading-tight sm:text-2xl lg:mt-8 lg:text-4xl">{headline}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-on-night-muted lg:line-clamp-none lg:text-base">{subtitle}</p>
          <ul className="mt-6 hidden space-y-3 lg:block">
            {BANNER_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-center gap-3 text-sm font-semibold text-on-night">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-on-night/15">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  {item.text}
                </li>
              );
            })}
          </ul>
        </div>
        <dl className="mt-8 hidden max-w-[15rem] gap-4 lg:flex">
          <div>
            <dt className="font-display text-2xl font-bold text-on-night">12</dt>
            <dd className="text-sm text-on-night-muted">students</dd>
          </div>
          <div>
            <dt className="font-display text-2xl font-bold text-on-night">25+</dt>
            <dd className="text-sm text-on-night-muted">gigs</dd>
          </div>
          <div>
            <dt className="font-display text-2xl font-bold text-on-night">4.8</dt>
            <dd className="text-sm text-on-night-muted">average rating</dd>
          </div>
        </dl>
        <div className="pointer-events-none absolute bottom-16 right-3 hidden w-40 flex-col gap-3 lg:flex" aria-hidden="true">
          <div className="float-card rounded-2xl border border-line bg-surface p-3 text-ink shadow-pop">
            <p className="text-xs font-semibold uppercase tracking-wide text-offer">Tutoring</p>
            <p className="mt-1 text-sm font-bold">Calculus walkthrough</p>
            <p className="text-xs text-muted">Paid · Open</p>
          </div>
          <div className="float-card float-card-late rounded-2xl border border-line bg-surface p-3 text-ink shadow-pop">
            <p className="text-xs font-semibold uppercase tracking-wide text-request">Design</p>
            <p className="mt-1 text-sm font-bold">Fest poster</p>
            <p className="text-xs text-muted">SkillSwap</p>
          </div>
        </div>
      </div>
    </section>
  );
}
