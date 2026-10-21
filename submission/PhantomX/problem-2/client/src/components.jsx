import { useApp } from './context.js';

const tones = {
  open: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  expired: 'bg-rose-50 text-rose-800 ring-rose-200',
  progress: 'bg-sky-50 text-sky-800 ring-sky-200',
  completed: 'bg-stone-100 text-stone-700 ring-stone-200',
  cancelled: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  offering: 'bg-teal-50 text-teal-800 ring-teal-200',
  requesting: 'bg-amber-50 text-amber-900 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  swap: 'bg-violet-50 text-violet-800 ring-violet-200',
  free: 'bg-stone-100 text-stone-700 ring-stone-200',
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  neutral: 'bg-white text-stone-600 ring-stone-200',
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

export function Badge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}

export const inputClass = 'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20';

export const buttonClass = 'rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60';

export const secondaryButtonClass = 'rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60';

export const dangerButtonClass = 'rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60';

export function Stars({ value }) {
  const filled = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="text-amber-500" aria-label={`${filled} out of 5`}>
      {'★'.repeat(filled)}
      <span className="text-stone-300">{'★'.repeat(5 - filled)}</span>
    </span>
  );
}

export function Field({ label, children, error }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-stone-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-rose-700">{error}</span> : null}
    </label>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
      {children}
    </p>
  );
}

export function Notice({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
      {children}
    </p>
  );
}

export function Loading({ children = 'Loading…' }) {
  return <p className="text-sm text-stone-500">{children}</p>;
}

export function Empty({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-600">
      {children}
    </p>
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
