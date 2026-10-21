import { getLanguage, intlLocales } from "../i18n/language";
import { tr } from "../i18n/translate";

export const fmt = (n: number) => Math.round(n).toLocaleString(intlLocales[getLanguage()]);

export const pct = (ratio: number | null | undefined) =>
  ratio == null ? "—" : new Intl.NumberFormat(intlLocales[getLanguage()], { style: "percent", maximumFractionDigits: 0 }).format(ratio);

const MASS_UNITS = new Set(["kg", "g", "L", "l", "ml", "litre", "liter"]);

/** "150 vials", "1 vial", "300 kg". */
export const unitLabel = (n: number, unit: string) =>
  getLanguage() !== "en" ? tr(unit) : n === 1 || MASS_UNITS.has(unit) || unit.endsWith("s") ? unit : `${unit}s`;

export const qty = (n: number, unit?: string | null) =>
  unit ? `${fmt(n)} ${unitLabel(n, unit)}` : fmt(n);

export function stamp(ms: number) {
  const d = new Date(ms);
  const day = d.toLocaleDateString(intlLocales[getLanguage()], { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString(intlLocales[getLanguage()], { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
}

/** Red under the 40% critical line, amber under 70%, green above. */
export function levelColor(ratio: number | null | undefined) {
  if (ratio == null) return "var(--color-ghost)";
  if (ratio < 0.4) return "var(--color-alert)";
  if (ratio < 0.7) return "var(--color-warn)";
  return "var(--color-ok)";
}

export function levelText(ratio: number | null | undefined) {
  if (ratio == null) return "text-faint";
  if (ratio < 0.4) return "text-alert";
  if (ratio < 0.7) return "text-warn-ink";
  return "text-ok-ink";
}

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const CATEGORIES = ["Food", "Water", "Medical", "Shelter", "Hygiene"] as const;
export const SKILLS = ["Medical", "Logistics", "Cooking", "Driving", "Counselling"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Skill = (typeof SKILLS)[number];
export type Priority = (typeof PRIORITIES)[number];
