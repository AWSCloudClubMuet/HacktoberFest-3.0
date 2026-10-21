import type { FunctionReturnType } from "convex/server";
import type { api } from "../../convex/_generated/api";
import type { Priority } from "./format";

export const INTENTS = ["dispatch", "need", "donation", "assign", "stock", "camp"] as const;
export type Intent = (typeof INTENTS)[number];
export type IntentKey = Intent | "none";

export type Classification = {
  intent: { value: IntentKey; confidence: number; probabilities: Partial<Record<IntentKey, number>> };
  readiness: number;
  urgency: number;
  isQuestion: number;
  isCash: number;
  latencyMs: number;
  questionCount: number;
  model: string;
};

export type World = {
  camps: FunctionReturnType<typeof api.camps.list>;
  items: FunctionReturnType<typeof api.inventory.list>;
  volunteers: FunctionReturnType<typeof api.volunteers.list>;
  needs: FunctionReturnType<typeof api.needs.list>;
};
export type CampRow = World["camps"][number];
export type ItemRow = World["items"][number];
export type VolunteerRow = World["volunteers"][number];

/* ---------- Deterministic parsing: Jev decides, code computes. ---------- */

const STOP = new Set(["camp", "relief", "school", "govt", "government", "hall", "community", "centre", "center", "the", "of", "a", "an", "and", "to", "for", "at", "in", "on", "from", "site", "dr", "mr", "ms", "mrs"]);

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
const stem = (w: string) => (w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith("es") && /(ch|sh|x|s)es$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
const words = (s: string) => norm(s).split(/\s+/).filter(Boolean).map(stem);

/** Best candidate whose distinctive name words appear in the text; ties go to the longer match. */
function best<T>(text: string, list: T[], name: (t: T) => string, extra?: (t: T) => string | undefined): { hit: T; score: number } | null {
  const said = new Set(words(text));
  let top: { hit: T; score: number } | null = null;
  for (const t of list) {
    const key = words(name(t)).filter((w) => !STOP.has(w));
    if (!key.length) continue;
    const matched = key.filter((w) => said.has(w)).length;
    let score = matched / key.length + matched * 0.01;
    const alt = extra?.(t);
    if (!matched && alt && words(alt).some((w) => said.has(w))) score = 0.35;
    if (score > 0 && (!top || score > top.score)) top = { hit: t, score };
  }
  return top;
}

export type Parsed = {
  quantity: number | null;
  camp: CampRow | null;
  item: ItemRow | null;
  volunteer: VolunteerRow | null;
  donor: string | null;
  priority: Priority;
  cash: boolean;
  question: boolean;
};

export function parse(text: string, world: World | null, signals?: { urgency: number; isCash: number; isQuestion: number }): Parsed {
  const t = text.toLowerCase();
  const num = t.match(/(?:rs\.?\s*|pkr\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lac)?\b/);
  let quantity: number | null = null;
  if (num) {
    quantity = parseFloat(num[1].replace(/,/g, ""));
    if (num[2] === "k") quantity *= 1_000;
    if (num[2] === "lakh" || num[2] === "lac") quantity *= 100_000;
    quantity = Math.round(quantity);
  }

  const camp = world ? best(text, world.camps.filter((c) => c.status !== "Closed"), (c) => c.name, (c) => c.district)?.hit ?? null : null;
  const item = world ? best(text, world.items, (i) => i.name, (i) => i.category)?.hit ?? null : null;
  const volMatch = world ? best(text, world.volunteers, (v) => v.name) : null;
  const volunteer = volMatch && volMatch.score >= 0.5 ? volMatch.hit : null;

  const donorMatch = text.match(/\b(?:from|by)\s+([\p{L}][\p{L}\s.&'-]*?)(?=\s+(?:today|yesterday|for|to|at|of)\b|[,.;!?]|$)/iu);
  const donor = donorMatch ? donorMatch[1].trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : null;

  const urgentWord = /\b(urgent\w*|asap|critical|immediately|emergency|right now|desperate\w*)\b/.test(t);
  const lowWord = /\b(low priority|whenever|not urgent|no rush)\b/.test(t);
  const priority: Priority = lowWord ? "Low" : urgentWord || (signals?.urgency ?? 0) >= 0.66 ? "High" : "Medium";

  const cashWord = /\b(rs\.?|pkr|rupees?|cash|money|funds?|cheque|transfer)\b/.test(t);
  const cash = cashWord || (!item && (signals?.isCash ?? 0) > 0.6);
  const question = /\?\s*$|^(how|what|is|are|do|does|any|where|which)\b/.test(t.trim()) || (signals?.isQuestion ?? 0) > 0.6;

  return { quantity, camp, item, volunteer, donor, priority, cash, question };
}

/* ---------- Offline classifier: same output shape as Jev, keyword based. ---------- */

const CUES: Record<Intent, RegExp[]> = {
  dispatch: [/\b(send|sending|sent|ship|dispatch\w*|deliver|truck|move|route|push)\b/, /\bto\b/],
  need: [/\b(needs?|needed|short|shortage|running (low|out)|ran out|out of|require[sd]?|requesting|asking for|lack\w*)\b/],
  donation: [/\b(receiv\w*|donat\w*|gift\w*|gave|pledg\w*|contribut\w*)\b/, /\bfrom\b/],
  assign: [/\b(assign\w*|post|station\w*|deploy\w*|put|move)\b/],
  stock: [/\b(how (much|many)|stock|left|in the warehouse|do we have|inventory|on hand|remaining)\b/],
  camp: [/\b(status|how is|how's|situation|update on|families (at|in)|overview of)\b/],
};

export function classifyOffline(text: string, world: World | null): Classification {
  const t = text.toLowerCase().trim();
  const p = parse(text, world);
  const s: Record<Intent, number> = { dispatch: 0, need: 0, donation: 0, assign: 0, stock: 0, camp: 0 };
  for (const intent of INTENTS) {
    const [primary, secondary] = CUES[intent];
    if (primary.test(t)) s[intent] += 2;
    if (secondary?.test(t)) s[intent] += 0.5;
  }
  if (p.quantity && p.item) {
    s.dispatch += 0.6;
    s.need += 0.6;
    s.donation += 0.4;
  }
  if (p.camp) {
    s.dispatch += 0.5;
    s.need += 0.5;
    s.camp += 0.6;
    s.assign += 0.3;
  }
  if (p.volunteer) s.assign += 2.2;
  if (p.cash) s.donation += 1.2;
  if (p.donor) s.donation += 0.8;
  if (p.question) {
    s.stock += p.item ? 1.2 : 0.3;
    s.camp += p.camp && !p.item ? 1.2 : 0.2;
    s.dispatch *= 0.5;
    s.donation *= 0.5;
  }
  if (p.item && !p.camp && !p.quantity && !p.volunteer) s.stock += 0.8;
  if (p.camp && !p.item && !p.quantity && !p.volunteer) s.camp += 0.8;

  const none = t.length < 4 ? 6 : t.split(/\s+/).length < 2 ? 2 : 0.9;
  const total = Object.values(s).reduce((a, b) => a + b, 0) + none;
  const probabilities: Partial<Record<IntentKey, number>> = { none: none / total };
  for (const k of INTENTS) probabilities[k] = s[k] / total;
  const [value, confidence] = (Object.entries(probabilities) as [IntentKey, number][]).sort((a, b) => b[1] - a[1])[0];

  const filled = [p.quantity, p.camp, p.item, p.volunteer].filter(Boolean).length;
  return {
    intent: { value, confidence, probabilities },
    readiness: Math.min(2, filled),
    urgency: p.priority === "High" ? 1 : 0,
    isQuestion: p.question ? 1 : 0,
    isCash: p.cash ? 1 : 0,
    latencyMs: 0,
    questionCount: 5,
    model: "jev-offline",
  };
}

/* ---------- Calm UI: turns flickery classifications into stable states. ---------- */

export type UiState =
  | { kind: "input" }
  | { kind: "ghost"; intent: Intent }
  | { kind: "choose"; options: [Intent, Intent] }
  | { kind: "committed"; intent: Intent; forced?: boolean };

export type Memory = { ui: UiState; challenger: { intent: Intent; wins: number } | null; forcedText: string | null };
export const initialMemory: Memory = { ui: { kind: "input" }, challenger: null, forcedText: null };

const T = { inputBelow: 0.3, commitAt: 0.45, chooseGap: 0.08, chooseFloor: 0.15, override: 0.7, wins: 2, dropBelow: 0.2 };

function ranked(r: Classification) {
  return (Object.entries(r.intent.probabilities) as [IntentKey, number][]).filter(([k]) => k !== "none").sort((a, b) => b[1] - a[1]) as [Intent, number][];
}

function raw(r: Classification): UiState {
  const [a, b] = ranked(r);
  if (a && b && a[1] > T.chooseFloor && b[1] > T.chooseFloor && a[1] - b[1] < T.chooseGap) return { kind: "choose", options: [a[0], b[0]] };
  if (r.intent.value === "none" || r.intent.confidence < T.inputBelow) return { kind: "input" };
  return r.intent.confidence < T.commitAt ? { kind: "ghost", intent: r.intent.value } : { kind: "committed", intent: r.intent.value };
}

function changed(a: string, b: string) {
  const x = a.trim(), y = b.trim();
  return Math.abs(x.length - y.length) > Math.max(6, 0.3 * x.length) || !(y.startsWith(x.slice(0, Math.floor(x.length * 0.6))));
}

export function decide(mem: Memory, r: Classification, text: string): Memory {
  if (!text.trim()) return initialMemory;
  const prev = mem.ui;
  if (prev.kind === "committed" && prev.forced && mem.forcedText !== null && !changed(mem.forcedText, text)) return mem;
  if (prev.kind === "committed" && !prev.forced) {
    const top = r.intent.value;
    const currentP = r.intent.probabilities[prev.intent] ?? 0;
    if (top === prev.intent) return { ui: prev, challenger: null, forcedText: null };
    if (top === "none") return currentP < T.dropBelow ? initialMemory : { ...mem, challenger: null };
    if (r.intent.confidence >= T.override) return { ui: { kind: "committed", intent: top }, challenger: null, forcedText: null };
    const wins = mem.challenger?.intent === top ? mem.challenger.wins + 1 : 1;
    if (wins >= T.wins && r.intent.confidence >= T.inputBelow) return { ui: raw(r), challenger: null, forcedText: null };
    return { ui: prev, challenger: { intent: top, wins }, forcedText: null };
  }
  return { ui: raw(r), challenger: null, forcedText: null };
}

export const force = (intent: Intent, text: string): Memory => ({ ui: { kind: "committed", intent, forced: true }, challenger: null, forcedText: text });
export const activeIntent = (ui: UiState): Intent | null => (ui.kind === "committed" || ui.kind === "ghost" ? ui.intent : null);
