import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export type Tone = "danger" | "warning" | "success" | "info" | "neutral" | "dark" | "brand";

/* ---------- Brand ---------- */

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-lg bg-signal text-ink" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M1 11 Q4 8 8 11 T15 11" />
        <path d="M8 2 L8 7M5 4.5 L11 4.5" />
      </svg>
    </span>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "danger" | "ghost" | "brand";

const PRESS = "motion-safe:enabled:active:scale-[0.96]";
const MODAL_EXIT_MS = 150;

export function Button({
  variant = "primary",
  size = "md",
  static: isStatic,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; static?: boolean }) {
  const sizes = { sm: "h-8 rounded-md px-3 text-[13px]", md: "h-10 rounded-lg px-4 text-sm", lg: "h-12 rounded-lg px-5 text-[15px]" };
  const variants: Record<Variant, string> = {
    primary: "bg-ink text-white shadow-card hover:bg-ink-2",
    brand: "bg-signal text-ink shadow-card hover:brightness-95",
    secondary: "border border-line-strong bg-paper text-ink shadow-card hover:bg-tint",
    danger: "border border-alert-line bg-paper text-alert-ink shadow-card hover:bg-alert-wash",
    ghost: "text-ink-2 hover:bg-tint",
  };
  return (
    <button
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,filter,scale] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40",
        !isStatic && PRESS,
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  tone = "ink",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "ink" | "alert" }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-line bg-paper transition-[background-color,border-color,color,scale] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40",
        PRESS,
        tone === "alert" ? "text-alert hover:border-alert-line hover:bg-alert-wash" : "text-ink-2 hover:bg-tint",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
} as const;

export const PlusIcon = () => (
  <svg width="13" height="13" strokeWidth="2.5" {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const EditIcon = () => (
  <svg width="14" height="14" strokeWidth="2" {...iconProps}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
  </svg>
);
export const TrashIcon = () => (
  <svg width="14" height="14" strokeWidth="2" {...iconProps}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
export const SearchIcon = () => (
  <svg width="15" height="15" strokeWidth="2" {...iconProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const LockIcon = () => (
  <svg width="14" height="14" strokeWidth="2" {...iconProps}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </svg>
);
export const CloseIcon = () => (
  <svg width="14" height="14" strokeWidth="2" {...iconProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
/* ---------- Layout ---------- */

export function PageHeader({ kicker, title, deck, actions }: { kicker: ReactNode; title: ReactNode; deck?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="rise flex items-end justify-between gap-10">
      <div className="flex max-w-[960px] flex-col gap-2">
        <div className="label">{kicker}</div>
        <h1 className="display text-[32px] leading-[38px]">{title}</h1>
        {deck && <p className="max-w-[680px] text-[15px] leading-[23px] text-muted">{deck}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rise min-w-0 overflow-hidden rounded-xl border border-transparent bg-paper shadow-border", className)}>{children}</div>;
}

export function CardHeader({ title, sub, right, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-center justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="flex items-center gap-2.5 text-base font-bold tracking-[-0.01em]">{title}</h2>
        {sub && <div className="text-[13px] text-muted">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

/** A titled card. Children sit flush so tables can run edge to edge; use `pad` for free content. */
export function Section({
  title,
  sub,
  right,
  pad,
  className,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  size?: "lg" | "md";
  pad?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cx("flex flex-col", className)}>
      <CardHeader title={title} sub={sub} right={right} />
      <div className={cx("flex min-h-0 flex-1 flex-col", pad && "p-5")}>{children}</div>
    </Card>
  );
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-t border-line bg-tint px-5 py-3 text-[13px]">{children}</div>;
}

/** Filters and search that sit at the top of a table card. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">{children}</div>;
}

export function TableHead({ children }: { children: ReactNode; ruled?: boolean }) {
  return <div className="label flex h-10 items-center border-b border-line bg-tint px-5 text-[10.5px]">{children}</div>;
}

export function Row({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("flex items-center border-b border-line px-5 transition-colors last:border-b-0 hover:bg-tint/70", className)}>{children}</div>;
}

/** Thin left marker for rows that need attention. */
export function Flag({ tone }: { tone?: "alert" | "signal" | "warn" | "ink" | null }) {
  return (
    <span
      className={cx(
        "h-8 w-[3px] shrink-0 rounded-full",
        tone === "alert" && "bg-alert",
        (tone === "signal" || tone === "warn") && "bg-warn",
        tone === "ink" && "bg-ink",
      )}
    />
  );
}

/** Editor panel shown beside a table. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <Card className={cx("flex flex-col gap-[18px] p-5", className)}>{children}</Card>;
}

export function PanelTitle({ kicker, title, onClose }: { kicker: string; title: string; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="label">{kicker}</div>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.02em]">{title}</h2>
      </div>
      {onClose && (
        <button onClick={onClose} type="button" aria-label="Close" className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-tint hover:text-ink">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/** Centered dialog over a dimmed backdrop. Closes on Escape or a backdrop click, with a short exit. */
export function Modal({
  onClose,
  width = 520,
  children,
}: {
  onClose: () => void;
  width?: number;
  /** Pass a function to get a `close` that plays the exit before `onClose` runs. */
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => onCloseRef.current(), MODAL_EXIT_MS);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);
  return createPortal(
    <div
      data-closing={closing || undefined}
      className="modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[rgb(17_19_17/0.45)] px-6 py-[8vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div role="dialog" aria-modal="true" className="modal-panel w-full [&>*]:shadow-pop" style={{ maxWidth: width }}>
        {typeof children === "function" ? children(close) : children}
      </div>
    </div>,
    document.body,
  );
}
/** Placeholder for the side column when nothing is being edited. */
export function PanelHint({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Panel>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold tracking-[-0.02em]">{title}</h2>
        <p className="text-sm leading-[22px] text-muted">{children}</p>
      </div>
      {action}
    </Panel>
  );
}

const statTone = {
  alert: { value: "text-alert", chip: "bg-alert-wash text-alert-ink" },
  warn: { value: "text-warn-ink", chip: "bg-warn-wash text-warn-ink" },
  ok: { value: "text-ok-ink", chip: "bg-ok-wash text-ok-ink" },
  info: { value: "text-info-ink", chip: "bg-info-wash text-info-ink" },
};

export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
  badge,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  tone?: keyof typeof statTone;
  badge?: ReactNode;
  icon?: ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <Card className={cx("flex flex-col gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
          {icon && <span className={cx("grid size-7 place-items-center rounded-lg", tone ? statTone[tone].chip : "bg-tint text-ink-2")}>{icon}</span>}
          {label}
        </span>
        {badge}
      </div>
      <span className="flex items-baseline gap-1.5">
        <span className={cx("text-[34px] font-bold leading-9 tracking-[-0.03em]", tone && statTone[tone].value)}>{value}</span>
        {unit && <span className="text-[15px] font-medium text-muted">{unit}</span>}
      </span>
      {sub && <span className="truncate text-[13px] text-muted">{sub}</span>}
    </Card>
  );
}

export function StatStrip({ children, cols = 5 }: { children: ReactNode; cols?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm text-muted">{children}</div>;
}

export function Loading() {
  return <div className="label px-6 py-16 text-center">Loading…</div>;
}

/* ---------- Forms ---------- */

export function Field({ label, error, hint, children }: { label: ReactNode; error?: string | null; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className={cx("text-[13px] font-semibold", error ? "text-alert-ink" : "text-ink-2")}>{label}</span>
      {children}
      {error ? <span className="text-[12.5px] leading-[18px] text-alert-ink">{error}</span> : hint && <span className="text-xs leading-4 text-muted">{hint}</span>}
    </label>
  );
}

const inputBase =
  "h-[42px] w-full rounded-lg border bg-paper px-3 text-[15px] text-ink shadow-card outline-none transition-[border-color,box-shadow] placeholder:text-ghost focus:border-ink focus:shadow-[0_0_0_3px_#11131114] disabled:bg-tint disabled:text-faint";

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      className={cx(inputBase, invalid ? "border-alert bg-alert-wash" : "border-line-strong", props.type === "number" && "font-mono text-sm", className)}
      {...props}
    />
  );
}

const caret = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%235F635D' stroke-width='2' fill='none'/%3E%3C/svg%3E\")";

export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cx(inputBase, "cursor-pointer appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat pr-9", invalid ? "border-alert" : "border-line-strong", className)}
      style={{ backgroundImage: caret }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className={cx("flex gap-0.5 rounded-[9px] bg-[#ecede8] p-[3px]", size === "sm" ? "h-8" : "h-[38px]")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:text-ghost",
            size === "sm" ? "px-2.5 text-xs" : "px-3 text-[13px]",
            value === o.value ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        "flex h-[38px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[13px] font-semibold shadow-card transition-colors",
        on ? "border-alert-line bg-alert-wash text-alert-ink" : "border-line-strong bg-paper hover:bg-tint",
      )}
    >
      <span className={cx("flex h-4 w-7 items-center rounded-full p-0.5 transition-colors", on ? "justify-end bg-alert" : "bg-line-strong")}>
        <span className="size-3 rounded-full bg-white" />
      </span>
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder, width = "w-72" }: { value: string; onChange: (v: string) => void; placeholder: string; width?: string }) {
  return (
    <label className={cx("flex h-[38px] items-center gap-2.5 rounded-lg border border-line-strong bg-paper px-3 text-muted shadow-card focus-within:border-ink", width)}>
      <SearchIcon />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint" />
    </label>
  );
}

export function Notice({ tone, children }: { tone: "error" | "warning" | "info" | "lock" | "success"; children: ReactNode }) {
  const styles = {
    error: "border-alert-line bg-alert-wash text-alert-ink",
    warning: "border-warn-line bg-warn-wash text-warn-ink",
    info: "border-info-line bg-info-wash text-info-ink",
    success: "border-ok-line bg-ok-wash text-ok-ink",
    lock: "border-dashed border-line-strong bg-paper text-ink-2",
  }[tone];
  return (
    <div className={cx("flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-[19px]", styles)}>
      {tone === "lock" && (
        <span className="mt-0.5 shrink-0">
          <LockIcon />
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

export function ReadOnlyNote() {
  return <Notice tone="lock">You're signed in as a Field Volunteer, so this is view-only. Coordinators can make changes here.</Notice>;
}

/* ---------- Badges ---------- */

const badgeTone: Record<Tone, string> = {
  danger: "border-alert-line bg-alert-wash text-alert-ink",
  warning: "border-warn-line bg-warn-wash text-warn-ink",
  success: "border-ok-line bg-ok-wash text-ok-ink",
  info: "border-info-line bg-info-wash text-info-ink",
  neutral: "border-line bg-tint text-muted",
  dark: "border-ink bg-ink text-white",
  brand: "border-signal bg-signal text-ink",
};
const dotTone: Record<Tone, string> = {
  danger: "bg-alert",
  warning: "bg-warn",
  success: "bg-ok",
  info: "bg-info",
  neutral: "bg-faint",
  dark: "bg-white",
  brand: "bg-ink",
};

export function Badge({ tone = "neutral", dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold", badgeTone[tone], className)}>
      {dot && <span className={cx("size-1.5 rounded-full", dotTone[tone])} />}
      {children}
    </span>
  );
}

export function CampStatusPill({ status }: { status: "Open" | "Full" | "Closed" }) {
  const tone: Tone = status === "Open" ? "success" : status === "Full" ? "warning" : "neutral";
  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  );
}

export function PriorityPill({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const tone: Tone = priority === "High" ? "danger" : priority === "Medium" ? "warning" : "neutral";
  return <Badge tone={tone}>{priority}</Badge>;
}

export function LowStockTag() {
  return (
    <Badge tone="warning" dot>
      Low stock
    </Badge>
  );
}

export function DispatchPill({ status }: { status: "Pending" | "In Transit" | "Delivered" | "Cancelled" }) {
  const tone: Tone = { Pending: "neutral", "In Transit": "info", Delivered: "success", Cancelled: "neutral" }[status] as Tone;
  return (
    <Badge tone={tone} dot className={status === "Cancelled" ? "text-faint line-through" : undefined}>
      {status}
    </Badge>
  );
}

const skillTone: Record<string, string> = {
  Medical: "bg-alert-wash text-alert-ink",
  Logistics: "bg-info-wash text-info-ink",
  Cooking: "bg-warn-wash text-warn-ink",
  Driving: "bg-[#f4f3ff] text-[#5925dc]",
  Counselling: "bg-ok-wash text-ok-ink",
};

export function SkillPill({ skill }: { skill: string }) {
  return <span className={cx("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", skillTone[skill] ?? "bg-tint text-ink-2")}>{skill}</span>;
}

export function Avatar({ name, tone = "soft" }: { name: string; tone?: "soft" | "solid" | "dashed" }) {
  return (
    <span
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
        tone === "soft" && "bg-[#ecede8] text-ink-2",
        tone === "solid" && "bg-ink text-white",
        tone === "dashed" && "border-[1.5px] border-dashed border-warn bg-warn-wash text-warn-ink",
      )}
    >
      {name}
    </span>
  );
}

/* ---------- Progress ---------- */

/** Fill colour for a fulfilment ratio: red under the 40% critical line, amber under 70%, green above. */
export function ratioColor(ratio: number | null | undefined) {
  if (ratio == null) return "var(--color-ghost)";
  if (ratio < 0.4) return "var(--color-alert)";
  if (ratio < 0.7) return "var(--color-warn)";
  return "var(--color-ok)";
}

/** Delivered (solid) + reserved (light) against required, with the 40% critical tick. */
export function Vessel({
  fulfilled,
  reserved = 0,
  required,
  height = 8,
  showLine = true,
}: {
  fulfilled: number;
  reserved?: number;
  required: number;
  height?: number;
  showLine?: boolean;
}) {
  const ratio = required > 0 ? Math.min(1, fulfilled / required) : 1;
  const res = required > 0 ? Math.min(1 - ratio, reserved / required) : 0;
  const color = ratioColor(ratio);
  return (
    <div className="relative flex overflow-hidden rounded-full bg-track" style={{ height }}>
      <div style={{ width: `${ratio * 100}%`, background: color }} />
      <div style={{ width: `${res * 100}%`, background: color, opacity: 0.3 }} />
      {showLine && <div className="absolute inset-y-0 left-[40%] w-px bg-ink/40" />}
    </div>
  );
}

export function Meter({ ratio, color = "var(--color-ink)", height = 6 }: { ratio: number; color?: string; height?: number }) {
  return (
    <div className="flex overflow-hidden rounded-full bg-track" style={{ height }}>
      <div className="rounded-full" style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: color }} />
    </div>
  );
}

export { cx };
