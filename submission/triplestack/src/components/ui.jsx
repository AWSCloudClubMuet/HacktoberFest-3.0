import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export const fmt = (n) => Number(n || 0).toLocaleString('en-US');
export const fmtPct = (n) => `${Number(n || 0).toFixed(Number.isInteger(n) ? 0 : 1)}%`;
export const fmtPKR = (n) => `PKR ${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
export const fmtTime = (date) => new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// --- buttons ------------------------------------------------------------------

const BUTTON_VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};
const BUTTON_SIZES = { sm: 'px-2.5 py-1.5 text-xs gap-1.5', md: 'px-3.5 py-2 text-sm gap-2' };

export function Button({ variant = 'primary', size = 'md', icon, busy, children, className = '', disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {busy ? <Spinner className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} /> : icon && <Icon name={icon} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />;
}

// --- badges -------------------------------------------------------------------

const TONES = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  red: 'bg-red-50 text-red-800 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-800 ring-violet-600/20',
};

export function Badge({ tone = 'slate', icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {icon && <Icon name={icon} className="h-3 w-3" />}
      {children}
    </span>
  );
}

const CAMP_TONE = { Active: 'green', Full: 'amber', Closed: 'slate' };
export const CampStatusBadge = ({ status }) => <Badge tone={CAMP_TONE[status]}>{status}</Badge>;

const DISPATCH_TONE = { Pending: 'amber', 'In Transit': 'blue', Delivered: 'green', Cancelled: 'slate' };
export const DispatchStatusBadge = ({ status }) => <Badge tone={DISPATCH_TONE[status]}>{status}</Badge>;

const PRIORITY_TONE = { High: 'red', Medium: 'amber', Low: 'slate' };
export const PriorityBadge = ({ priority }) => <Badge tone={PRIORITY_TONE[priority]}>{priority}</Badge>;

// Amber: low stock is a warning; red is reserved for critical gaps.
export const LowStockBadge = () => (
  <Badge tone="amber" icon="alert">
    Low Stock
  </Badge>
);

const SKILL_TONE = { Medical: 'red', Logistics: 'blue', Cooking: 'amber', Driving: 'slate', Counselling: 'violet' };
export const SkillBadge = ({ skill }) => <Badge tone={SKILL_TONE[skill] || 'slate'}>{skill}</Badge>;

// --- layout pieces --------------------------------------------------------------

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '', bodyClassName = 'p-5', id }) {
  return (
    <section id={id} className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const STAT_TONES = {
  brand: { icon: 'text-brand-500', meter: 'bg-brand-500' },
  red: { icon: 'text-red-600', meter: 'bg-red-500' },
  amber: { icon: 'text-amber-600', meter: 'bg-amber-500' },
  green: { icon: 'text-teal-600', meter: 'bg-teal-500' },
};

// KPI tile. `meter` (0–100) draws a thin proportion bar under the value.
export function StatCard({ label, value, sub, icon, tone = 'brand', to, meter }) {
  const t = STAT_TONES[tone];
  const body = (
    <>
      <p className="flex items-start gap-2 text-sm font-medium leading-snug text-slate-600">
        {icon && <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${t.icon}`} />}
        <span>{label}</span>
      </p>
      <p className="mt-2.5 text-[28px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
      {meter !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={`h-full rounded-full ${t.meter}`} style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
        </div>
      )}
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </>
  );
  const cls = 'block min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-xs';
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:border-brand-300`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// variant "fulfilment": green when complete, amber when low.
// variant "occupancy": amber once the camp is at capacity.
export function ProgressBar({ value, label, critical, variant = 'fulfilment' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color =
    variant === 'occupancy'
      ? pct >= 100
        ? 'bg-amber-500'
        : 'bg-brand-500'
      : critical
        ? 'bg-red-500'
        : pct >= 100
          ? 'bg-emerald-500'
          : pct < 40
            ? 'bg-amber-500'
            : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={label}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-medium tabular-nums text-slate-700">{fmtPct(Math.round(pct * 10) / 10)}</span>
    </div>
  );
}

export function EmptyState({ icon = 'info', title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="rounded-full bg-slate-100 p-3 text-slate-500">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium text-slate-900">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', title, children, className = '' }) {
  const cls = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }[tone];
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${cls} ${className}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={tone === 'info' ? 'info' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// --- tables -------------------------------------------------------------------

// head: [{ label, className, sr, sortKey }]. Columns with a sortKey become
// sortable when `sort` / `onSort` come from useSort().
export function Table({ head, children, caption, sort, onSort }) {
  // `relative` keeps sr-only (absolutely positioned) labels inside the scroll
  // container; otherwise they widen the page on phones.
  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50/80">
          <tr>
            {head.map((h) => {
              const sortable = h.sortKey && onSort;
              const active = sortable && sort?.key === h.sortKey;
              const right = h.className?.includes('text-right');
              return (
                <th
                  key={h.label}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${h.className || ''}`}
                >
                  {h.sr ? (
                    <span className="sr-only">{h.label}</span>
                  ) : sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(h.sortKey)}
                      className={`inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-slate-900 ${active ? 'text-slate-900' : ''} ${right ? 'flex-row-reverse' : ''}`}
                    >
                      {h.label}
                      <Icon name={active ? (sort.dir === 'asc' ? 'chevronUp' : 'chevronDown') : 'chevronsUpDown'} className={`h-3 w-3 ${active ? '' : 'opacity-40'}`} />
                    </button>
                  ) : (
                    h.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className = '' }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;

// --- form controls ----------------------------------------------------------------

const controlCls = (error) =>
  `block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
  }`;

function FieldShell({ id, label, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextField({ label, error, hint, required, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        className={controlCls(error)}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

// options: [{ value, label, disabled }] or strings
export function SelectField({ label, error, hint, required, options, placeholder, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        className={controlCls(error)}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        required={required}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </FieldShell>
  );
}

export function SearchInput({ value, onChange, placeholder, label = 'Search' }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${controlCls()} pl-9`}
      />
    </div>
  );
}

// Compact single-choice filter (status tabs, skills...).
export function FilterChips({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
              active ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && <span className={`ml-1.5 tabular-nums ${active ? 'text-brand-100' : 'text-slate-400'}`}>{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-center">{children}</div>;
}

// Compact select for toolbars: same height as the search box, label kept for
// screen readers.
export function ToolbarSelect({ label, value, onChange, options, allLabel }) {
  const id = useId();
  return (
    <div className="w-full sm:w-auto">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${controlCls()} sm:w-48`}>
        <option value="">{allLabel}</option>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function ToolbarCheckbox({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
      {children}
    </label>
  );
}

// "Showing X of Y" footer shared by every list, with a reset when filtered.
export function ListFooter({ shown, total, noun, onClear, children }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
      <span aria-live="polite">
        Showing {shown} of {total} {noun}
      </span>
      {onClear && (
        <button type="button" onClick={onClear} className="font-medium text-brand-700 hover:underline">
          Clear filters
        </button>
      )}
      {children && <span className="sm:ml-auto">{children}</span>}
    </div>
  );
}
