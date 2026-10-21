import { useEffect, useId, useRef, useState } from 'react';
import { api } from './api.js';
import { paymentLabel } from './constants.js';
import { formatMoney, formatWhen, initials } from './format.js';
import { Alert, Badge, Link, Stars, buttonClass, dangerButtonClass, paymentTone, secondaryButtonClass, statusTone, textLinkClass } from './components.jsx';

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialog(open, onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const root = ref.current;
    if (!root) return undefined;
    const previous = document.activeElement;
    function items() {
      return [...root.querySelectorAll(focusableSelector)].filter((node) => node.offsetParent !== null || node === document.activeElement);
    }
    const first = items()[0];
    first?.focus();
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return;
      const firstItem = list[0];
      const lastItem = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);
  return ref;
}

export function Dialog({ open, title, onClose, children, wide = false }) {
  const titleId = useId();
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex bg-ink/40 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex h-full w-full flex-col overflow-y-auto bg-surface p-5 shadow-pop sm:h-auto sm:max-h-[min(92vh,46rem)] sm:rounded-3xl ${wide ? 'sm:max-w-xl' : 'sm:max-w-lg'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button type="button" className={`${secondaryButtonClass} shrink-0 px-3`} onClick={onClose} disabled={!onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stepper({ step, total = 3 }) {
  return (
    <ol className="mb-4 flex items-center gap-2" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const number = index + 1;
        const state = number < step ? 'done' : number === step ? 'current' : 'upcoming';
        return (
          <li key={number} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${state === 'upcoming' ? 'bg-canvas text-muted' : 'fill-offer text-white'}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {number}
            </span>
            {number < total ? <span className={`h-0.5 flex-1 rounded-full ${number < step ? 'bg-offer' : 'bg-line'}`} aria-hidden="true" /> : null}
          </li>
        );
      })}
      <span className="sr-only">Step {step} of {total}</span>
    </ol>
  );
}

export function StatusTracker({ status }) {
  const decision = status === 'Accepted' ? 'Accepted' : status === 'Rejected' ? 'Rejected' : 'Decision';
  const steps = [
    { label: 'Submitted', done: true },
    { label: 'Under review', done: status === 'Accepted' || status === 'Rejected', current: status === 'Pending' },
    { label: decision, done: status === 'Accepted' || status === 'Rejected', current: false },
  ];
  if (status === 'Accepted' || status === 'Rejected') steps[2].current = true;
  return (
    <ol className="flex items-start gap-2" aria-label="Application status">
      {steps.map((item, index) => (
        <li key={item.label} className="min-w-0 flex-1">
          <div className={`mb-2 h-1.5 rounded-full ${item.done || item.current ? (status === 'Rejected' && index === 2 ? 'bg-danger' : status === 'Accepted' && index === 2 ? 'bg-success' : 'bg-offer') : 'bg-line'}`} />
          <p className={`text-xs font-semibold sm:text-sm ${item.current || item.done ? 'text-ink' : 'text-muted'}`} aria-current={item.current ? 'step' : undefined}>
            {item.label}
          </p>
        </li>
      ))}
    </ol>
  );
}

function validateProposal(draft, gig) {
  const next = {};
  const message = draft.message.trim();
  if (message.length < 20) next.message = 'Write at least 20 characters so the poster knows how you can help.';
  else if (message.length > 500) next.message = 'Message must be 500 characters or fewer.';
  if (draft.availability.trim().length > 200) next.availability = 'Availability must be 200 characters or fewer.';
  const link = draft.portfolio.trim();
  if (link) {
    try {
      const url = new URL(link);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') next.portfolio = 'Use an http or https link.';
    } catch {
      next.portfolio = 'Enter a valid link, including https://.';
    }
    if (link.length > 500) next.portfolio = 'Link must be 500 characters or fewer.';
  }
  if (gig.payment_type === 'SkillSwap' && draft.swap.trim().length > 300) {
    next.swap = 'Exchange offer must be 300 characters or fewer.';
  }
  return next;
}

const emptyDraft = { message: '', availability: '', portfolio: '', swap: '', read: false };

export function ApplyWizard({ gig, poster, open, onClose, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const tone = gig?.type === 'Offering' ? 'request' : 'offer';
  const fill = tone === 'request' ? 'fill-request' : 'fill-offer';
  const browse = gig?.type === 'Requesting' ? '/offer' : '/request';

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDraft(emptyDraft);
    setErrors({});
    setApiError('');
    setBusy(false);
    setSent(null);
  }, [open, gig?.id]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function next() {
    if (step === 1) {
      if (!draft.read) {
        setErrors({ read: 'Confirm that you have read the requirements.' });
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }
    if (step === 2) {
      const nextErrors = validateProposal(draft, gig);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(3);
    }
  }

  async function submit() {
    setBusy(true);
    setApiError('');
    const body = {
      gig_id: gig.id,
      message: draft.message.trim(),
    };
    if (draft.availability.trim()) body.availability = draft.availability.trim();
    if (draft.portfolio.trim()) body.portfolio_link = draft.portfolio.trim();
    if (gig.payment_type === 'SkillSwap' && draft.swap.trim()) body.swap_offer = draft.swap.trim();
    try {
      const created = await api('/applications', { method: 'POST', body });
      setSent(created);
      onSubmitted?.(created);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const budget = gig?.payment_type === 'Paid' && gig.budget != null ? formatMoney(gig.budget) : 'No budget';

  return (
    <Dialog open={open} title={sent ? 'Application sent' : 'Apply'} onClose={busy ? undefined : onClose} wide>
      {sent ? (
        <div className="space-y-4">
          <p className="text-base text-ink">The poster has your proposal. You can follow it from My applications.</p>
          <StatusTracker status={sent.status} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/applications" className={`${buttonClass} ${fill}`}>My applications</Link>
            <Link to={browse} className={secondaryButtonClass}>Keep browsing</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Stepper step={step} />
          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-ink">Review the gig</h3>
              <div className="space-y-3 rounded-2xl bg-canvas p-4">
                <p className="font-display text-lg font-semibold text-ink">{gig.title}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={gig.type === 'Offering' ? 'offering' : 'requesting'}>{gig.type}</Badge>
                  <Badge tone="neutral">{gig.category}</Badge>
                  <Badge tone={paymentTone(gig.payment_type)}>{paymentLabel(gig.payment_type)}</Badge>
                </div>
                <p className="text-sm text-muted">{paymentLabel(gig.payment_type)} · {budget}</p>
                <p className="text-sm text-muted">Deadline {formatWhen(gig.deadline)}</p>
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ${tone === 'request' ? 'bg-request' : 'bg-offer'}`} aria-hidden="true">{initials(poster?.name)}</span>
                  <div>
                    <p className="font-semibold text-ink">{poster?.name || 'Student'}</p>
                    <p className="text-sm text-muted">{poster?.major}{poster?.semester ? ` · Semester ${poster.semester}` : ''}</p>
                    <p className="text-sm text-muted">{poster?.average_rating == null ? 'No reviews yet' : `${poster.average_rating} average`}</p>
                  </div>
                </div>
              </div>
              <label className="flex min-h-11 items-start gap-3 text-base text-ink">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  checked={draft.read}
                  onChange={(event) => update('read', event.target.checked)}
                />
                <span>I have read the requirements</span>
              </label>
              {errors.read ? <Alert>{errors.read}</Alert> : null}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-ink">Your proposal</h3>
              <label className="block text-sm font-semibold text-ink">
                Message
                <textarea
                  className="mt-1.5 min-h-28 w-full rounded-2xl border border-line px-3 py-2.5 text-base"
                  maxLength={500}
                  value={draft.message}
                  aria-describedby="proposal-count"
                  onChange={(event) => update('message', event.target.value)}
                />
              </label>
              <p id="proposal-count" className="text-sm text-muted">{draft.message.trim().length}/500 · at least 20</p>
              {errors.message ? <Alert>{errors.message}</Alert> : null}
              <label className="block text-sm font-semibold text-ink">
                Availability or timeline <span className="font-normal text-muted">(optional)</span>
                <input className="mt-1.5 min-h-11 w-full rounded-2xl border border-line px-3 text-base" maxLength={200} value={draft.availability} onChange={(event) => update('availability', event.target.value)} />
              </label>
              {errors.availability ? <Alert>{errors.availability}</Alert> : null}
              <label className="block text-sm font-semibold text-ink">
                Portfolio or previous work <span className="font-normal text-muted">(optional)</span>
                <input className="mt-1.5 min-h-11 w-full rounded-2xl border border-line px-3 text-base" type="url" inputMode="url" maxLength={500} placeholder="https://" value={draft.portfolio} onChange={(event) => update('portfolio', event.target.value)} />
              </label>
              {errors.portfolio ? <Alert>{errors.portfolio}</Alert> : null}
              {gig.payment_type === 'SkillSwap' ? (
                <label className="block text-sm font-semibold text-ink">
                  What can you offer in exchange? <span className="font-normal text-muted">(optional)</span>
                  <textarea className="mt-1.5 min-h-24 w-full rounded-2xl border border-line px-3 py-2.5 text-base" maxLength={300} value={draft.swap} onChange={(event) => update('swap', event.target.value)} />
                </label>
              ) : null}
              {errors.swap ? <Alert>{errors.swap}</Alert> : null}
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-ink">Review and submit</h3>
              <Summary title="Gig" onEdit={() => setStep(1)}>
                <p>{gig.title}</p>
                <p className="text-sm text-muted">{draft.read ? 'Requirements read' : 'Requirements not confirmed'}</p>
              </Summary>
              <Summary title="Proposal" onEdit={() => setStep(2)}>
                <p className="whitespace-pre-wrap break-words">{draft.message.trim()}</p>
                {draft.availability.trim() ? <p className="text-sm text-muted">Availability: {draft.availability.trim()}</p> : null}
                {draft.portfolio.trim() ? <p className="break-all text-sm text-muted">{draft.portfolio.trim()}</p> : null}
                {gig.payment_type === 'SkillSwap' && draft.swap.trim() ? <p className="text-sm text-muted">In exchange: {draft.swap.trim()}</p> : null}
              </Summary>
              <Alert>{apiError}</Alert>
            </div>
          ) : null}
          <div className="flex gap-2">
            {step > 1 ? (
              <button type="button" className={`${secondaryButtonClass} flex-1`} disabled={busy} onClick={() => setStep((current) => current - 1)}>Back</button>
            ) : null}
            {step < 3 ? (
              <button type="button" className={`${buttonClass} ${fill} flex-1`} onClick={next}>Next</button>
            ) : (
              <button type="button" className={`${buttonClass} ${fill} flex-1`} disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'Submit'}</button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Summary({ title, onEdit, children }) {
  return (
    <section className="rounded-2xl border border-line p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary" onClick={onEdit}>Edit</button>
      </div>
      <div className="space-y-1 text-base text-ink">{children}</div>
    </section>
  );
}

export function Tabs({ label, tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-surface p-1 shadow-card" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold ${selected ? 'fill-offer text-white' : 'text-muted'}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.count != null ? <span className="ml-1">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function applicationLabel(status) {
  if (status === 'Pending') return 'Under review';
  if (status === 'Accepted') return 'Accepted';
  if (status === 'Rejected') return 'Rejected';
  return status;
}

export function ConfirmDialog({ open, title, confirmLabel, busy, tone = 'primary', onClose, onConfirm, children }) {
  const fill = tone === 'danger' ? '' : tone === 'request' ? 'fill-request' : '';
  const confirmClass = tone === 'danger' ? dangerButtonClass : `${buttonClass} ${fill}`;
  return (
    <Dialog open={open} title={title} onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        {children}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className={`${secondaryButtonClass} flex-1`} disabled={busy} onClick={onClose}>Back</button>
          <button type="button" className={`${confirmClass} flex-1`} disabled={busy} onClick={onConfirm}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function ApplicantCard({ application, person, gig, gigOpen, busy, onAccept, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const message = application.message || '';
  const long = message.length > 160;
  const shown = long && !expanded ? `${message.slice(0, 160)}…` : message;
  const auto = wasAutoRejected(application, gig);
  return (
    <article className={`min-w-0 space-y-3 rounded-3xl border p-4 ${application.status === 'Accepted' ? 'border-success-line bg-success-soft' : 'border-line bg-surface'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-offer text-sm font-semibold text-white" aria-hidden="true">{initials(person?.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="break-words font-semibold text-ink">{person?.name || 'Student'}</p>
            <Badge tone={statusTone(application.status)}>{applicationLabel(application.status)}</Badge>
          </div>
          <p className="text-sm text-muted">{person?.major || 'Major not listed'}{person?.semester ? ` · Semester ${person.semester}` : ''}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Stars value={person?.average_rating || 0} />
            <span>{person?.average_rating == null ? 'No reviews yet' : `${person.average_rating} average`}</span>
            <span>· {person?.gigs_completed ?? 0} completed</span>
          </div>
        </div>
      </div>
      {person?.skills?.length ? (
        <div className="flex flex-wrap gap-1">
          {person.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}
        </div>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-base text-ink">{shown}</p>
      {long ? (
        <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
      {application.availability ? <p className="text-sm text-muted">Availability: {application.availability}</p> : null}
      {application.portfolio_link ? <a className="inline-flex min-h-11 items-center break-all text-sm font-semibold text-primary" href={application.portfolio_link} target="_blank" rel="noreferrer">{application.portfolio_link}</a> : null}
      {application.swap_offer ? <p className="text-sm text-muted">In exchange: {application.swap_offer}</p> : null}
      {application.rejection_note ? <p className="text-sm text-ink">Note: {application.rejection_note}</p> : null}
      {auto ? <p className="text-sm font-semibold text-muted">Auto-rejected</p> : null}
      <p className="text-sm text-muted">Applied {formatWhen(application.created_at)}</p>
      <Link to={`/users/${application.applicant_id}`} className={`${textLinkClass} inline-flex min-h-11 items-center`}>View profile</Link>
      {application.status === 'Pending' && gigOpen ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className={`${buttonClass} flex-1`} disabled={busy} onClick={onAccept}>Accept</button>
          <button type="button" className={`${dangerButtonClass} flex-1`} disabled={busy} onClick={onReject}>Reject</button>
        </div>
      ) : null}
    </article>
  );
}

export function GigStepper({ status }) {
  if (status === 'Cancelled' || status === 'Expired') {
    return (
      <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${status === 'Cancelled' ? 'bg-canvas text-muted' : 'bg-danger-soft text-danger'}`}>
        This gig is {status}.
      </p>
    );
  }
  const steps = ['Open', 'In Progress', 'Completed'];
  const current = Math.max(0, steps.indexOf(status));
  return (
    <ol className="flex items-start gap-2" aria-label="Gig progress">
      {steps.map((label, index) => {
        const done = index < current || status === 'Completed';
        const here = index === current;
        return (
          <li key={label} className="min-w-0 flex-1">
            <div className={`mb-2 h-1.5 rounded-full ${done || here ? 'bg-offer' : 'bg-line'}`} />
            <p className={`text-xs font-semibold sm:text-sm ${here || done ? 'text-ink' : 'text-muted'}`} aria-current={here ? 'step' : undefined}>{label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function wasAutoRejected(application, gig) {
  if (!application || application.status !== 'Rejected' || application.rejection_note) return false;
  return Boolean(gig?.accepted_applicant_id && gig.accepted_applicant_id !== application.applicant_id);
}
