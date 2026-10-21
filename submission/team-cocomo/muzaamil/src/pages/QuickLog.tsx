import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useRun } from "../components/toast";
import { Badge, Button, CampStatusPill, Input, PageHeader, Segmented, Select, SkillPill, cx } from "../components/ui";
import { fmt, pct, PRIORITIES, qty, stamp, unitLabel, type Priority } from "../lib/format";
import { useI18n } from "../i18n";
import {
  activeIntent,
  classifyOffline,
  decide,
  force,
  initialMemory,
  INTENTS,
  parse,
  type Classification,
  type Intent,
  type Memory,
  type Parsed,
  type World,
} from "../lib/quicklog";
import { useViewer } from "../lib/viewer";

/* ---------- Intent metadata ---------- */

const META: Record<Intent, { label: string; verb: string; edge: string; tile: string; icon: string; example: string }> = {
  dispatch: {
    label: "Dispatch",
    verb: "Reserve & dispatch",
    edge: "var(--color-info)",
    tile: "bg-info-wash text-info-ink",
    icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
    example: "send 20 tents to johi",
  },
  need: {
    label: "Need",
    verb: "Add need",
    edge: "var(--color-alert)",
    tile: "bg-alert-wash text-alert-ink",
    icon: "M12 3l9 16H3L12 3zM12 10v4M12 17h.01",
    example: "mehar needs 100 blankets urgently",
  },
  donation: {
    label: "Donation",
    verb: "Record donation",
    edge: "var(--color-ok)",
    tile: "bg-ok-wash text-ok-ink",
    icon: "M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z",
    example: "received 500 blankets from edhi foundation",
  },
  assign: {
    label: "Assign volunteer",
    verb: "Assign",
    edge: "var(--color-signal)",
    tile: "bg-signal-wash text-warn-ink",
    icon: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M19 8v6M16 11h6",
    example: "assign faraz to sukkur",
  },
  stock: {
    label: "Stock check",
    verb: "Open in warehouse",
    edge: "var(--color-ink)",
    tile: "bg-tint text-ink",
    icon: "M3 9l9-5 9 5v11H3V9zM8 20v-6h8v6",
    example: "how much insulin is left?",
  },
  camp: {
    label: "Camp status",
    verb: "Open camp",
    edge: "var(--color-ink-2)",
    tile: "bg-tint text-ink",
    icon: "M3 20h18M5 20l7-15 7 15M9.5 20l2.5-5 2.5 5",
    example: "how is ratodero doing",
  },
};

const EXAMPLES = INTENTS.map((i) => META[i].example);

function Glyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

/* ---------- Classification: Jev when the key is set, keyword classifier otherwise ---------- */

type Hud = { latency: number; questions: number; model: string; cached: boolean } | null;
const NONE: Classification = { intent: { value: "none", confidence: 1, probabilities: { none: 1 } }, readiness: 0, urgency: 0, isQuestion: 0, isCash: 0, latencyMs: 0, questionCount: 0, model: "none" };
const cache = new Map<string, Classification>();
// Once the backend says there's no key, stop asking for the rest of the session.
let offline = false;

function useIntent(text: string, world: World | null) {
  const classify = useAction(api.intent.classify);
  const [state, setState] = useState<{ result: Classification; resultText: string; thinking: boolean; hud: Hud }>({ result: NONE, resultText: "", thinking: false, hud: null });
  const req = useRef(0);
  const worldRef = useRef(world);
  worldRef.current = world;
  const hasWorld = !!world;

  useEffect(() => {
    const id = ++req.current;
    const key = text.trim().toLowerCase().replace(/\s+/g, " ");
    const settle = (result: Classification, hud: Hud) => id === req.current && setState({ result, resultText: text, thinking: false, hud });
    const local = () => {
      const r = classifyOffline(text, worldRef.current);
      settle(r, { latency: 0, questions: r.questionCount, model: r.model, cached: false });
    };

    if (key.length < 2) {
      const raf = requestAnimationFrame(() => settle(NONE, null));
      return () => cancelAnimationFrame(raf);
    }
    if (offline) {
      const raf = requestAnimationFrame(local);
      return () => cancelAnimationFrame(raf);
    }
    const hit = cache.get(key);
    if (hit) {
      const raf = requestAnimationFrame(() => settle(hit, { latency: 0, questions: hit.questionCount, model: hit.model, cached: true }));
      return () => cancelAnimationFrame(raf);
    }
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, thinking: true }));
      classify({ text })
        .then((res) => {
          if (id !== req.current) return;
          if (res.mode === "offline") {
            if (res.reason.includes("not set")) offline = true;
            return local();
          }
          const r: Classification = { ...res, intent: { ...res.intent, value: res.intent.value as Classification["intent"]["value"] } };
          cache.set(key, r);
          settle(r, { latency: r.latencyMs, questions: r.questionCount, model: r.model, cached: false });
        })
        .catch(local);
    }, 140);
    return () => clearTimeout(timer);
  }, [text, hasWorld, classify]);

  return state;
}

/* ---------- Saved log (this browser) ---------- */

type Logged = { id: number; intent: Intent; summary: string; href: string; at: number };
const LOG_KEY = "reliefhub.quicklog";
function loadLog(): Logged[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/* ---------- Cards ---------- */

type Commit = { run: () => Promise<boolean>; ready: number; summary: string; href: string; disabledReason?: string | null };
type CardProps = { parsed: Parsed; world: World; register: (c: Commit | null) => void; onSwitch: (i: Intent) => void };

/** A field that follows the parsed text until the user picks something else for it. */
function useField(parsed: string): [string, (v: string) => void] {
  const [o, setO] = useState<{ base: string; v: string } | null>(null);
  return [o && o.base === parsed ? o.v : parsed, (v) => setO({ base: parsed, v })];
}

function Slot({ label, children, grow }: { label: string; children: ReactNode; grow?: boolean }) {
  const { t } = useI18n();
  return (
    <label className={cx("flex min-w-0 flex-col gap-1", grow ? "flex-[1.4]" : "flex-1")}>
      <span className="label text-[10px]">{t(label)}</span>
      {children}
    </label>
  );
}

const mini = "h-9 rounded-md text-[13px]";

function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="label text-[10px]">{t(label)}</span>
      <span className={cx("truncate text-[15px] font-bold tabular-nums tracking-[-0.01em]", tone)}>{value}</span>
    </div>
  );
}

function Hint({ tone = "muted", children }: { tone?: "muted" | "alert" | "warn" | "ok"; children: ReactNode }) {
  const c = { muted: "text-muted", alert: "text-alert-ink", warn: "text-warn-ink", ok: "text-ok-ink" }[tone];
  return <p className={cx("text-[13px] leading-[19px]", c)}>{children}</p>;
}

function CampOptions({ world }: { world: World }) {
  const { t } = useI18n();
  return (
    <>
      <option value="">{t("Choose a camp…")}</option>
      {world.camps
        .filter((c) => c.status !== "Closed")
        .map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
    </>
  );
}

function ItemOptions({ world }: { world: World }) {
  const { t } = useI18n();
  return (
    <>
      <option value="">{t("Choose an item…")}</option>
      {world.items.map((i) => (
        <option key={i._id} value={i._id}>
          {i.name} ({unitLabel(1, i.unit)})
        </option>
      ))}
    </>
  );
}

function DispatchCard({ parsed, world, register }: CardProps) {
  const { t, dir } = useI18n();
  const create = useMutation(api.dispatches.create);
  const run = useRun();
  const [campId, setCampId] = useField(parsed.camp?._id ?? "");
  const campNeeds = world.needs.filter((n) => n.camp_id === campId);
  const guess = campNeeds.find((n) => n.inventory_item_id === parsed.item?._id)?._id ?? "";
  const [needId, setNeedId] = useField(`${campId}:${guess}`);
  const need = campNeeds.find((n) => n._id === needId.split(":")[1]);
  const [amount, setAmount] = useField(parsed.quantity ? String(parsed.quantity) : "");
  const limits = useQuery(api.dispatches.limits, need ? { need_id: need._id } : "skip");
  const q = Number(amount);
  const camp = world.camps.find((c) => c._id === campId);
  const noNeed = !!camp && !!parsed.item && !guess;

  let problem: string | null = null;
  if (limits && amount) {
    if (!Number.isInteger(q) || q < 1) problem = t("Enter a whole number");
    else if (q > limits.max) problem = limits.max === 0 ? t("Nothing can be sent for this need right now.") : t("At most {max} can go now (limited by {limit}).", { max: fmt(limits.max), limit: t(limits.limitedBy) });
  }
  const ok = !!camp && !!need && !!limits && !!amount && !problem;

  useEffect(() => {
    register({
      ready: [camp, need, amount].filter(Boolean).length / 3,
      summary: need && camp ? `${qty(q || 0, limits?.unit)} ${need.item?.name ?? t("Item")} ${dir === "rtl" ? "←" : "→"} ${camp.name}` : t("Dispatch"),
      href: "/dispatches",
      disabledReason: ok ? null : t("Pick a camp, a need and a quantity"),
      run: () => run(create({ camp_id: camp!._id, need_id: need!._id, quantity: q }), t("Dispatch created · {quantity} reserved", { quantity: qty(q, limits!.unit) })),
    });
  });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <Slot label="Camp" grow>
          <Select className={mini} value={campId} onChange={(e) => setCampId(e.target.value)}>
            <CampOptions world={world} />
          </Select>
        </Slot>
        <Slot label="Need" grow>
          <Select className={mini} value={needId} onChange={(e) => setNeedId(e.target.value)} disabled={!camp}>
            <option value={`${campId}:`}>{t(camp ? (campNeeds.length ? "Choose a need…" : "No needs at this camp") : "Camp first")}</option>
            {campNeeds.map((n) => (
              <option key={n._id} value={`${campId}:${n._id}`} disabled={n.remaining === 0}>
                {n.item?.name ?? t("Item")} · {t("{percent} met", { percent: pct(n.pct) })}
              </option>
            ))}
          </Select>
        </Slot>
        <Slot label={limits ? t("Quantity ({unit})", { unit: unitLabel(1, limits.unit) }) : t("Quantity")}>
          <Input className={mini} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={!!problem} />
        </Slot>
      </div>
      {limits && (
        <div className="flex items-center gap-6 rounded-lg bg-tint px-3.5 py-2.5">
          <Fact label="In stock" value={fmt(limits.stock)} tone={limits.stock < limits.remaining ? "text-alert-ink" : undefined} />
          <Fact label="Still needed" value={fmt(limits.remaining)} />
          <Fact label="Max now" value={fmt(limits.max)} tone={limits.max ? "text-ok-ink" : "text-alert-ink"} />
          {limits.max > 0 && q !== limits.max && (
            <Button size="sm" variant="secondary" className="ms-auto" onClick={() => setAmount(String(limits.max))}>
              {t("Use max")}
            </Button>
          )}
        </div>
      )}
      {problem && <Hint tone="alert">{problem}</Hint>}
      {noNeed && <Hint tone="warn">{t("{camp} has no need for {item}. Add the need first, then dispatch against it.", { camp: camp!.name, item: parsed.item!.name })}</Hint>}
    </div>
  );
}

function NeedCard({ parsed, world, register, onSwitch }: CardProps) {
  const { t } = useI18n();
  const create = useMutation(api.needs.create);
  const run = useRun();
  const [campId, setCampId] = useField(parsed.camp?._id ?? "");
  const [itemId, setItemId] = useField(parsed.item?._id ?? "");
  const [amount, setAmount] = useField(parsed.quantity ? String(parsed.quantity) : "");
  const [priority, setPriority] = useField(parsed.priority);
  const camp = world.camps.find((c) => c._id === campId);
  const item = world.items.find((i) => i._id === itemId);
  const existing = world.needs.find((n) => n.camp_id === campId && n.inventory_item_id === itemId);
  const q = Number(amount);
  const ok = !!camp && !!item && Number.isInteger(q) && q >= 1 && !existing;

  useEffect(() => {
    register({
      ready: [camp, item, amount].filter(Boolean).length / 3,
      summary: camp && item ? t("{camp} needs {quantity} {item}", { camp: camp.name, quantity: qty(q || 0, item.unit), item: item.name }) : t("Need"),
      href: camp ? `/camps/${camp._id}` : "/needs",
      disabledReason: existing ? t("That need already exists") : ok ? null : t("Pick a camp, an item and a quantity"),
      run: () =>
        run(create({ camp_id: camp!._id, inventory_item_id: item!._id, required_quantity: q, priority: priority as Priority }), t("Need added to {camp}", { camp: camp!.name })),
    });
  });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <Slot label="Camp" grow>
          <Select className={mini} value={campId} onChange={(e) => setCampId(e.target.value)}>
            <CampOptions world={world} />
          </Select>
        </Slot>
        <Slot label="Item" grow>
          <Select className={mini} value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <ItemOptions world={world} />
          </Select>
        </Slot>
        <Slot label={item ? t("Required ({unit})", { unit: unitLabel(1, item.unit) }) : t("Required")}>
          <Input className={mini} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Slot>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Segmented size="sm" value={priority as Priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: t(p) }))} />
        {item && <span className={cx("font-mono text-xs", item.lowStock ? "text-alert-ink" : "text-muted")}>{t("{quantity} in the warehouse", { quantity: qty(item.stock, item.unit) })}</span>}
      </div>
      {existing && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-warn-line bg-warn-wash px-3.5 py-2.5">
          <Hint tone="warn">
            {t("{camp} already needs {item}: {delivered} of {required} delivered.", { camp: camp!.name, item: item!.name, delivered: fmt(existing.fulfilled_quantity), required: qty(existing.required_quantity, item?.unit) })}
          </Hint>
          <Button size="sm" variant="secondary" onClick={() => onSwitch("dispatch")}>
            {t("Dispatch instead")}
          </Button>
        </div>
      )}
    </div>
  );
}

function DonationCard({ parsed, world, register }: CardProps) {
  const { t } = useI18n();
  const create = useMutation(api.donations.create);
  const run = useRun();
  const [type, setType] = useField(parsed.cash ? "Cash" : "In-Kind");
  const [itemId, setItemId] = useField(parsed.item?._id ?? "");
  const [amount, setAmount] = useField(parsed.quantity ? String(parsed.quantity) : "");
  const [donor, setDonor] = useField(parsed.donor ?? "");
  const cash = type === "Cash";
  const item = world.items.find((i) => i._id === itemId);
  const q = Number(amount);
  const ok = Number.isInteger(q) && q >= 1 && (cash || !!item);

  useEffect(() => {
    register({
      ready: [amount, cash || item, donor].filter(Boolean).length / 3,
      summary: cash
        ? donor ? t("Rs {amount} cash from {donor}", { amount: fmt(q || 0), donor }) : t("Rs {amount} cash", { amount: fmt(q || 0) })
        : donor ? t("{quantity} {item} from {donor}", { quantity: qty(q || 0, item?.unit), item: item?.name ?? t("goods"), donor }) : `${qty(q || 0, item?.unit)} ${item?.name ?? t("goods")}`,
      href: "/donations",
      disabledReason: ok ? null : t(cash ? "Enter the amount" : "Pick an item and a quantity"),
      run: () =>
        run(
          create({ type: cash ? "Cash" : "In-Kind", amount_or_quantity: q, item_id: cash ? undefined : item!._id, donor: donor || undefined }),
          cash ? t("Donation recorded · Rs {amount}", { amount: fmt(q) }) : t("Donation recorded · +{quantity} {item} in stock", { quantity: qty(q, item!.unit), item: item!.name }),
        ),
    });
  });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <Slot label="Type">
          <Segmented size="sm" value={type as "Cash" | "In-Kind"} onChange={setType} options={[{ value: "In-Kind", label: t("Goods") }, { value: "Cash", label: t("Cash") }]} />
        </Slot>
        {!cash && (
          <Slot label="Item" grow>
            <Select className={mini} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <ItemOptions world={world} />
            </Select>
          </Slot>
        )}
        <Slot label={cash ? t("Amount (Rs)") : item ? t("Quantity ({unit})", { unit: unitLabel(1, item.unit) }) : t("Quantity")}>
          <Input className={mini} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Slot>
      </div>
      <Slot label="Donor (optional)">
        <Input className={mini} value={donor} placeholder={t("Anonymous")} onChange={(e) => setDonor(e.target.value)} />
      </Slot>
      {!cash && item && ok && (
        <Hint tone="ok">
          {t("Warehouse goes from {before} to {after}.", { before: fmt(item.stock), after: qty(item.stock + q, item.unit) })}
        </Hint>
      )}
    </div>
  );
}

function AssignCard({ parsed, world, register }: CardProps) {
  const { t, dir } = useI18n();
  const assign = useMutation(api.volunteers.assign);
  const run = useRun();
  const [volId, setVolId] = useField(parsed.volunteer?._id ?? "");
  const [campId, setCampId] = useField(parsed.camp?._id ?? "");
  const vol = world.volunteers.find((v) => v._id === volId);
  const camp = world.camps.find((c) => c._id === campId);
  const busy = vol?.camp_id ? vol.campName : null;
  const ok = !!vol && !!camp && !busy;

  useEffect(() => {
    register({
      ready: [vol, camp].filter(Boolean).length / 2,
      summary: vol && camp ? `${vol.name} ${dir === "rtl" ? "←" : "→"} ${camp.name}` : t("Assign volunteer"),
      href: "/volunteers",
      disabledReason: busy ? t("{volunteer} is already at {camp}", { volunteer: vol!.name, camp: busy }) : ok ? null : t("Pick a volunteer and a camp"),
      run: () => run(assign({ id: vol!._id, camp_id: camp!._id }), t("{volunteer} assigned to {camp}", { volunteer: vol!.name, camp: camp!.name })),
    });
  });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5">
        <Slot label="Volunteer" grow>
          <Select className={mini} value={volId} onChange={(e) => setVolId(e.target.value)}>
            <option value="">{t("Choose a volunteer…")}</option>
            {world.volunteers.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name} · {t(v.skill)} · {v.campName ? t("at {camp}", { camp: v.campName }) : t("available")}
              </option>
            ))}
          </Select>
        </Slot>
        <Slot label="Camp" grow>
          <Select className={mini} value={campId} onChange={(e) => setCampId(e.target.value)}>
            <CampOptions world={world} />
          </Select>
        </Slot>
      </div>
      {vol && (
        <div className="flex items-center gap-2.5">
          <SkillPill skill={vol.skill} />
          {busy ? <Hint tone="warn">{t("Already at {camp}. Unassign them on the Volunteers page first.", { camp: busy })}</Hint> : <Hint>{t("Available now.")}</Hint>}
        </div>
      )}
    </div>
  );
}

function StockCard({ parsed, world, register }: CardProps) {
  const { t } = useI18n();
  const [itemId, setItemId] = useField(parsed.item?._id ?? "");
  const item = world.items.find((i) => i._id === itemId);
  const navigate = useNavigate();
  useEffect(() => {
    register({
      ready: item ? 1 : 0,
      summary: item ? t("{item}: {quantity} on hand", { item: item.name, quantity: qty(item.stock, item.unit) }) : t("Stock check"),
      href: item ? `/warehouse?q=${encodeURIComponent(item.name)}` : "/warehouse",
      disabledReason: item ? null : t("Pick an item"),
      run: async () => {
        navigate(`/warehouse?q=${encodeURIComponent(item!.name)}`);
        return false;
      },
    });
  });
  return (
    <div className="flex flex-col gap-3.5">
      <Slot label="Item">
        <Select className={mini} value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <ItemOptions world={world} />
        </Select>
      </Slot>
      {item && (
        <div className="flex items-end gap-6 rounded-lg bg-tint px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="label text-[10px]">{t("Available")}</span>
            <span className={cx("text-[30px] font-extrabold leading-9 tracking-[-0.03em] tabular-nums", item.lowStock ? "text-alert-ink" : "text-ink")}>
              {fmt(item.stock)} <span className="text-sm font-semibold text-muted">{unitLabel(item.stock, item.unit)}</span>
            </span>
          </div>
          <Fact label="Reserved" value={fmt(item.reserved)} />
          <Fact label="Reorder at" value={fmt(item.reorder_level)} />
          <Fact label="Camps asking" value={fmt(item.needCount)} />
          {item.lowStock && <Badge tone="danger" className="mb-1 ms-auto">{t("Low stock")}</Badge>}
        </div>
      )}
    </div>
  );
}

function CampCard({ parsed, world, register }: CardProps) {
  const { t } = useI18n();
  const [campId, setCampId] = useField(parsed.camp?._id ?? "");
  const camp = world.camps.find((c) => c._id === campId);
  const navigate = useNavigate();
  useEffect(() => {
    register({
      ready: camp ? 1 : 0,
      summary: camp ? t("{camp}: {percent} of needs met", { camp: camp.name, percent: pct(camp.needsMet) }) : t("Camp status"),
      href: camp ? `/camps/${camp._id}` : "/camps",
      disabledReason: camp ? null : t("Pick a camp"),
      run: async () => {
        navigate(`/camps/${camp!._id}`);
        return false;
      },
    });
  });
  return (
    <div className="flex flex-col gap-3.5">
      <Slot label="Camp">
        <Select className={mini} value={campId} onChange={(e) => setCampId(e.target.value)}>
          <option value="">{t("Choose a camp…")}</option>
          {world.camps.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} · {c.district}
            </option>
          ))}
        </Select>
      </Slot>
      {camp && (
        <div className="flex items-center gap-6 rounded-lg bg-tint px-3.5 py-3">
          <Fact label="Families" value={`${fmt(camp.current_families)} / ${fmt(camp.capacity)}`} />
          <Fact label="Needs met" value={pct(camp.needsMet)} tone={camp.needsMet == null ? undefined : camp.needsMet < 0.4 ? "text-alert-ink" : camp.needsMet < 0.7 ? "text-warn-ink" : "text-ok-ink"} />
          <Fact label="Critical" value={fmt(camp.criticalGaps)} tone={camp.criticalGaps ? "text-alert-ink" : undefined} />
          <Fact label="Volunteers" value={fmt(camp.volunteers)} />
          <span className="ms-auto">
            <CampStatusPill status={camp.status} />
          </span>
        </div>
      )}
    </div>
  );
}

const CARDS: Record<Intent, (p: CardProps) => ReactNode> = {
  dispatch: DispatchCard,
  need: NeedCard,
  donation: DonationCard,
  assign: AssignCard,
  stock: StockCard,
  camp: CampCard,
};
const WRITES: Intent[] = ["dispatch", "need", "donation", "assign"];

/* ---------- Page ---------- */

export default function QuickLog() {
  const { t, dir } = useI18n();
  const camps = useQuery(api.camps.list);
  const items = useQuery(api.inventory.list);
  const volunteers = useQuery(api.volunteers.list);
  const needs = useQuery(api.needs.list);
  const world = useMemo<World | null>(() => (camps && items && volunteers && needs ? { camps, items, volunteers, needs } : null), [camps, items, volunteers, needs]);
  const { isCoordinator } = useViewer();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const { result, resultText, thinking, hud } = useIntent(text, world);
  const [mem, setMem] = useState<Memory>(initialMemory);
  const [seen, setSeen] = useState(result);
  const [chip, setChip] = useState(0);
  const [log, setLog] = useState<Logged[]>(loadLog);
  const [draft, setDraft] = useState(1);
  const [busy, setBusy] = useState(false);
  const commit = useRef<Commit | null>(null);
  const [, bump] = useState(0);
  const current = useRef<string | null>(null);

  if (seen !== result) {
    setSeen(result);
    const next = decide(mem, result, resultText);
    if (next.ui.kind === "choose" && mem.ui.kind !== "choose") setChip(0);
    setMem(next);
  }

  const ui = mem.ui;
  const intent = activeIntent(ui);
  const ghost = ui.kind === "ghost";
  const parsed = useMemo(() => parse(text, world, result), [text, world, result]);
  const readOnly = !!intent && WRITES.includes(intent) && !isCoordinator;
  const cardKey = intent ? `${draft}-${intent}` : null;
  current.current = cardKey;

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 20)));
  }, [log]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // A card that is still animating out keeps rendering; only the live card may own the commit.
  const registerFor = useMemo(() => {
    const fns = new Map<string, (c: Commit | null) => void>();
    return (key: string) => {
      let fn = fns.get(key);
      if (!fn) {
        fn = (c) => {
          if (current.current !== key) return;
          const prev = commit.current;
          commit.current = c;
          if (prev?.ready !== c?.ready || prev?.disabledReason !== c?.disabledReason || prev?.summary !== c?.summary) bump((n) => n + 1);
        };
        fns.set(key, fn);
      }
      return fn;
    };
  }, []);

  const reset = () => {
    setText("");
    setMem(initialMemory);
    commit.current = null;
  };

  const pick = (i: Intent) => {
    const t = text.trim() ? text : META[i].example;
    setText(t);
    setMem(force(i, t));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  async function submit() {
    if (ui.kind === "choose") return pick(ui.options[chip]);
    const c = commit.current;
    if (!intent || !c || c.disabledReason || readOnly || busy) return;
    setBusy(true);
    const saved = await c.run();
    setBusy(false);
    if (!saved) return;
    setLog((l) => [{ id: Date.now(), intent, summary: c.summary, href: c.href, at: Date.now() }, ...l]);
    setDraft((d) => d + 1);
    reset();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    } else if (e.key === "Escape" && text) {
      e.preventDefault();
      e.stopPropagation();
      reset();
    } else if (e.key === "Tab" && ghost && intent) {
      e.preventDefault();
      setMem(force(intent, text));
    } else if (ui.kind === "choose" && (e.key === "ArrowLeft" || e.key === "ArrowRight") && e.currentTarget.selectionStart === text.length) {
      e.preventDefault();
      setChip(e.key === "ArrowLeft" ? 0 : 1);
    }
  };

  const c = commit.current;
  const Card = intent ? CARDS[intent] : null;
  const ready = intent && c ? c.ready : 0;

  return (
    <MotionConfig reducedMotion="user">
      <PageHeader
        kicker={t("Quick log · type what happened, it becomes the form")}
        title={t("Say it once. ReliefHub fills in the rest.")}
        deck={t("Write a dispatch, a need, a donation or an assignment the way you'd say it on the radio. Camps, items and quantities are matched against live data before anything is saved.")}
      />

      <div dir={dir} className="rise mx-auto flex w-full max-w-[720px] flex-col gap-3 pt-2">
        <p id="quicklog-language-note" className="text-center text-[13px] leading-5 text-muted">{t("Quick log currently accepts English entries. Use the English examples below.")}</p>
        <motion.div
          layout
          transition={reduce ? { duration: 0.15 } : { type: "spring", duration: 0.45, bounce: 0.12 }}
          style={{ borderRadius: 20 }}
          className={cx(
            "relative overflow-hidden bg-paper shadow-border outline-0 outline-signal/40 transition-[outline-width,box-shadow] duration-150 ease-out focus-within:outline-4",
            ready === 1 && !ghost && "shadow-pop",
          )}
        >
          <AnimatePresence initial={false}>
            {intent && !ghost && (
              <motion.span
                key={intent}
                aria-hidden
                className="absolute inset-y-0 start-0 z-10 w-[3px] origin-top"
                style={{ backgroundColor: META[intent].edge }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0, transition: { duration: 0.12 } }}
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              />
            )}
          </AnimatePresence>

          <motion.div layout="position" className="relative flex h-[68px] items-center gap-3 px-5">
            <span className={cx("grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200", intent ? META[intent].tile : "bg-tint text-faint")}>
              <Glyph d={intent ? META[intent].icon : "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"} />
            </span>
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (!e.target.value.trim()) setMem(initialMemory);
                }}
                onKeyDown={onKeyDown}
                aria-label={t("Describe what happened")}
                aria-describedby="quicklog-hint quicklog-language-note"
                dir="ltr"
                lang="en"
                autoComplete="off"
                spellCheck={false}
                className="relative z-[1] h-8 w-full bg-transparent text-[19px] font-medium tracking-[-0.01em] text-ink caret-ink outline-none focus-visible:outline-none"
              />
              {text === "" && <CyclingPlaceholder />}
            </div>
            <span aria-hidden className={cx("size-1.5 shrink-0 rounded-full bg-signal transition-opacity duration-300", thinking ? "opacity-100" : "opacity-0")} />
            {intent && !ghost && (
              <Badge tone="neutral" className="shrink-0">
                {t(META[intent].label)}
              </Badge>
            )}
          </motion.div>

          <AnimatePresence initial={false} mode="popLayout">
            {intent && Card && world && cardKey && (
              <motion.div
                key={cardKey}
                initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: ghost ? 0.45 : 1, filter: ghost ? "blur(1px) saturate(0.6)" : "blur(0px)" }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={reduce ? { duration: 0.15 } : { type: "spring", duration: 0.4, bounce: 0, delay: 0.03 }}
                className={cx("border-t border-line", ghost && "pointer-events-none")}
                inert={ghost || undefined}
              >
                <div className="px-5 pb-4 pt-4">
                  <Card parsed={parsed} world={world} register={registerFor(cardKey)} onSwitch={pick} />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line bg-tint/60 px-5 py-3">
                  <span className="min-w-0 truncate text-[13px] text-muted">
                    {readOnly ? t("Field volunteers can't log this. Ask a coordinator.") : c?.disabledReason ?? c?.summary}
                  </span>
                  <Button size="sm" onClick={() => void submit()} disabled={!c || !!c.disabledReason || readOnly || busy} className="gap-2">
                    {t(busy ? "Saving…" : META[intent].verb)}
                    <kbd className="font-mono text-[11px] font-medium opacity-60">↵</kbd>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-signal transition-transform duration-300 ease-out rtl:origin-right" style={{ transform: `scaleX(${ghost ? ready * 0.4 : ready})` }} />
        </motion.div>

        <div className="flex min-h-9 flex-wrap items-center justify-center gap-2" role="group" aria-label={t(ui.kind === "choose" ? "Did you mean" : "Try an example")}>
          <AnimatePresence mode="popLayout" initial={false}>
            {ui.kind === "choose"
              ? ui.options.map((o, i) => (
                  <motion.button
                    key={`choose-${o}`}
                    type="button"
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    className={cx(
                      "relative flex h-8 cursor-pointer items-center gap-1.5 overflow-hidden rounded-full bg-paper px-3 text-[13px] font-semibold shadow-border transition-[box-shadow,scale] duration-150 motion-safe:active:scale-[0.96]",
                      chip === i ? "text-ink outline-2 outline-ink" : "text-ink-2 hover:shadow-border-hover",
                    )}
                  >
                    <Glyph d={META[o].icon} className="size-3.5" />
                    {t("{intent}?", { intent: t(META[o].label) })}
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-signal rtl:origin-right" style={{ transform: `scaleX(${Math.min(1, (result.intent.probabilities[o] ?? 0) * 2)})` }} />
                  </motion.button>
                ))
              : !text &&
                EXAMPLES.map((ex, i) => (
                  <motion.button
                    key={ex}
                    type="button"
                    dir="ltr"
                    lang="en"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setText(ex)}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[13px] text-muted transition-[color,border-color,scale] duration-150 hover:border-ink hover:text-ink motion-safe:active:scale-[0.96]"
                  >
                    <Glyph d={META[INTENTS[i]].icon} className="size-3.5" />
                    {ex}
                  </motion.button>
                ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-3 font-mono text-[11px] text-faint">
          <p id="quicklog-hint">{t("↵ save · esc clear · tab keep preview · ← → pick a suggestion")}</p>
          {hud && (
            <span aria-hidden className="rounded-md bg-paper px-1.5 py-0.5 tabular-nums text-muted shadow-border">
              {hud.cached ? t("cached") : hud.model === "jev-offline" ? t("offline") : t("{count} ms", { count: fmt(hud.latency) })} · {t("{count} questions", { count: fmt(hud.questions) })} · <bdi>{hud.model}</bdi>
            </span>
          )}
        </div>

        {log.length > 0 && (
          <section className="mt-4 flex flex-col">
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="label">{t("Logged from this device")}</h2>
              <button type="button" onClick={() => setLog([])} className="cursor-pointer text-[12px] font-semibold text-muted hover:text-ink">
                {t("Clear")}
              </button>
            </div>
            <ul className="overflow-hidden rounded-xl bg-paper shadow-border">
              <AnimatePresence initial={false}>
                {log.slice(0, 8).map((l) => (
                  <motion.li
                    key={l.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                    className="border-b border-line last:border-b-0"
                  >
                    <Link to={l.href} className="flex h-12 items-center gap-3 px-4 transition-colors hover:bg-tint">
                      <span className={cx("grid size-7 shrink-0 place-items-center rounded-md", META[l.intent].tile)}>
                        <Glyph d={META[l.intent].icon} className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold"><span className="text-muted">{t(META[l.intent].label)} · </span><bdi>{l.summary}</bdi></span>
                      <span className="shrink-0 font-mono text-[11px] text-muted">{stamp(l.at)}</span>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {ui.kind === "committed" && intent ? t("Showing {intent} form", { intent: t(META[intent].label) }) : ""}
      </div>
    </MotionConfig>
  );
}

function CyclingPlaceholder() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 2800);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span aria-hidden dir="ltr" lang="en" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={i}
          className="absolute truncate text-[19px] font-medium tracking-[-0.01em] text-ghost"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          {EXAMPLES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
