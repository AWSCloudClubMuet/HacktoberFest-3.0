import { useEffect } from 'react';
import { useApp } from './context.js';

const tones = {
  open: 'bg-offer-soft text-offer ring-offer/20',
  expired: 'bg-danger-soft text-danger ring-danger-line',
  progress: 'bg-progress-soft text-progress ring-progress-line',
  completed: 'bg-success-soft text-success ring-success-line',
  cancelled: 'bg-canvas text-muted ring-line-strong',
  offering: 'bg-offer-soft text-offer ring-offer/25',
  requesting: 'bg-request-soft text-request ring-request/20',
  paid: 'bg-warning-soft text-warning ring-warning-line',
  swap: 'bg-request-soft text-request ring-request/20',
  free: 'bg-offer-soft text-offer ring-offer/20',
  pending: 'bg-warning-soft text-warning ring-warning-line',
  accepted: 'bg-success-soft text-success ring-success-line',
  rejected: 'bg-danger-soft text-danger ring-danger-line',
  neutral: 'bg-canvas text-ink ring-line',
};

export function statusTone(status) {
  if (status === 'Open') return 'open';
  if (status === 'Expired') return 'expired';
  if (status === 'In Progress') return 'progress';
  if (status === 'Completed') return 'completed';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Pending') return 'pending';
  if (status === 'Accepted') return 'accepted';
  if (status === 'Rejected') return 'rejected';
  return 'neutral';
}

export function paymentTone(payment) {
  if (payment === 'Paid') return 'paid';
  if (payment === 'SkillSwap') return 'swap';
  if (payment === 'Free') return 'free';
  return 'neutral';
}

export function Badge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}

const control = 'min-h-11 w-full min-w-0 rounded-2xl border border-line bg-surface px-3 py-2.5 text-base text-ink shadow-sm transition duration-150 focus:border-offer focus:ring-2 focus:ring-offer/25 disabled:cursor-not-allowed disabled:opacity-60';

export const inputClass = control;

export const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-full fill-offer px-4 py-2.5 text-base font-semibold text-white shadow-card transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60';

export const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2.5 text-base font-semibold text-ink transition duration-150 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60';

export const dangerButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-danger-line bg-danger-soft px-4 py-2.5 text-base font-semibold text-danger transition duration-150 hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

export const cardClass = 'min-w-0 rounded-3xl border border-line/80 bg-surface shadow-card';

export const textLinkClass = 'font-semibold text-primary underline-offset-2 hover:underline';

export function Card({ className = '', children }) {
  return <div className={`${cardClass} p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function Stars({ value }) {
  const filled = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="text-lg tracking-tight text-star" aria-label={`${filled} out of 5`}>
      {'★'.repeat(filled)}
      <span className="text-line-strong">{'★'.repeat(5 - filled)}</span>
    </span>
  );
}

export function Field({ label, children, error }) {
  return (
    <label className={`block min-w-0 text-base ${error ? '[&_input]:border-danger [&_select]:border-danger [&_textarea]:border-danger [&_input]:ring-danger/20 [&_select]:ring-danger/20 [&_textarea]:ring-danger/20' : ''}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-sm font-medium text-danger" role="alert">{error}</span> : null}
    </label>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger" role="alert">
      {children}
    </p>
  );
}

export function Notice({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border border-success-line bg-success-soft px-3 py-2.5 text-sm font-medium text-success" role="status">
      {children}
    </p>
  );
}

export function Loading({ children = 'Loading…' }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="h-5 w-36 animate-pulse rounded-full bg-line" />
      <div className="h-28 animate-pulse rounded-2xl bg-line/80" />
      <div className="h-28 animate-pulse rounded-2xl bg-line/60" />
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-10 text-center text-base leading-6 text-muted">
      {children}
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Link({ to, className, children }) {
  const { navigate, path } = useApp();
  const current = path === to;
  return (
    <a
      href={to}
      className={className}
      aria-current={current ? 'page' : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
