import type { ReactNode } from "react";
import type { ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import { Section } from "./ui";
import { getLanguage, intlLocales, useI18n } from "../i18n";
import type { Language } from "../i18n";
import { fmt } from "../lib/format";

export const PALETTE = {
  ink: "#111311",
  ok: "#079455",
  okSoft: "#75e0a7",
  warn: "#f79009",
  warnSoft: "#fec84b",
  alert: "#d92d20",
  alertSoft: "#fda29b",
  info: "#1570ef",
  infoSoft: "#84caff",
  violet: "#7a5af8",
  pink: "#dd2590",
  grey: "#b9bcb5",
  brand: "#ffc700",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: PALETTE.warn,
  Water: PALETTE.info,
  Medical: PALETTE.pink,
  Shelter: PALETTE.violet,
  Hygiene: PALETTE.ok,
};

export const SKILL_COLORS: Record<string, string> = {
  Medical: PALETTE.alert,
  Logistics: PALETTE.info,
  Cooking: PALETTE.warn,
  Driving: PALETTE.violet,
  Counselling: PALETTE.ok,
};

export const STATUS_COLORS: Record<string, string> = {
  Pending: PALETTE.grey,
  "In Transit": PALETTE.info,
  Delivered: PALETTE.ok,
  Cancelled: PALETTE.alertSoft,
};

/** One series entry for an EvilCharts config. Two colours draw a gradient. */
export const series = (label: ReactNode, ...colors: string[]): ChartConfig[string] => ({ label, colors: { light: colors } });

/** Chart keys become CSS variable names, so they must be plain identifiers. */
export const keyOf = (name: string) => name.replace(/[^a-zA-Z0-9]/g, "");

export function ChartCard({
  title,
  sub,
  right,
  className,
  children,
  footer,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t, dir } = useI18n();
  return (
    <Section title={typeof title === "string" ? t(title) : title} sub={typeof sub === "string" ? t(sub) : sub} right={right} className={className}>
      <div dir={dir} className="flex flex-1 flex-col px-4 pb-4 pt-3 [&>[data-chart]]:flex-none [&_.recharts-surface]:[direction:ltr] [&_.recharts-surface_text]:[unicode-bidi:plaintext]">{children}</div>
      {footer}
    </Section>
  );
}

export type Day = { key: string; label: string; start: number; end: number };

/** The last `n` calendar days ending today, oldest first. */
export function lastDays(n: number, now = Date.now(), language: Language = getLanguage()): Day[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    const start = d.getTime();
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(intlLocales[language], { day: "2-digit", month: "short" }),
      start,
      end: start + 86_400_000,
    };
  });
}

/** Buckets timestamped rows into days, summing `value` per row (default 1). */
export function byDay<T extends { created_at: number }>(rows: T[], days: Day[], value: (row: T) => number = () => 1) {
  return days.map((d) => rows.filter((r) => r.created_at >= d.start && r.created_at < d.end).reduce((s, r) => s + value(r), 0));
}

export const compact = (n: number, language: Language = getLanguage()) =>
  language === "en"
    ? n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n))
    : new Intl.NumberFormat(intlLocales[language], { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function LegendDots({ items }: { items: { label: string; color: string; value?: ReactNode }[] }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2.5 text-[13px]">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: i.color }} />
          <span className="flex-1 truncate text-ink-2">{t(i.label)}</span>
          {i.value != null && <bdi className="font-mono text-xs font-semibold">{typeof i.value === "number" ? fmt(i.value) : i.value}</bdi>}
        </div>
      ))}
    </div>
  );
}
