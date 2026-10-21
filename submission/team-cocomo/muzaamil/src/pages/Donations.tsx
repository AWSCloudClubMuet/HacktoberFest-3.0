import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useRun } from "../components/toast";
import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { byDay, CATEGORY_COLORS, ChartCard, compact, keyOf, lastDays, LegendDots, PALETTE, series } from "../components/charts";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Panel,
  PanelTitle,
  PlusIcon,
  ReadOnlyNote,
  Row,
  Segmented,
  Select,
  Stat,
  StatStrip,
  TableHead,
  Toolbar,
  cx,
} from "../components/ui";
import { fmt, qty, stamp, unitLabel } from "../lib/format";
import { useViewer } from "../lib/viewer";
import { useI18n } from "../i18n";

const numberWords = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default function Donations() {
  const { t, language, locale } = useI18n();
  const data = useQuery(api.donations.list);
  const { isCoordinator } = useViewer();
  const [filter, setFilter] = useState<"All" | "Cash" | "In-Kind">("All");
  const [recording, setRecording] = useState(false);

  if (!data) return <Loading />;
  const { totals } = data;
  const rows = data.rows.filter((d) => filter === "All" || d.type === filter);
  const millions = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.cash / 1_000_000);
  const giftCount = language === "en" ? numberWords[totals.inKindCount] ?? fmt(totals.inKindCount) : fmt(totals.inKindCount);
  const cashRows = data.rows.filter((d) => d.type === "Cash");
  const largest = cashRows.reduce<(typeof cashRows)[number] | undefined>((m, d) => (!m || d.amount_or_quantity > m.amount_or_quantity ? d : m), undefined);
  const inKindUnits = data.rows.filter((d) => d.type === "In-Kind").reduce((s, d) => s + d.amount_or_quantity, 0);
  const donorCount = new Set(data.rows.map((d) => d.donor).filter(Boolean)).size;

  return (
    <>
      <PageHeader
        kicker={t("Donations · {count} records", { count: fmt(data.rows.length) })}
        title={t(totals.inKindCount === 1 ? "PKR {amount} million in cash. {count} gift in kind." : "PKR {amount} million in cash. {count} gifts in kind.", { amount: millions, count: giftCount })}
        deck={t("In-kind donations go straight into warehouse stock.")}
        actions={
          isCoordinator && (
            <Button onClick={() => setRecording(true)}>
              <PlusIcon /> {t("Record donation")}
            </Button>
          )
        }
      />

      <StatStrip cols={4}>
        <Stat label={t("Cash received")} value={compact(totals.cash)} unit={t("PKR")} tone="ok" sub={t("{count} cash donations · PKR {amount}", { count: fmt(totals.cashCount), amount: fmt(totals.cash) })} />
        <Stat label={t("In-kind gifts")} value={fmt(totals.inKindCount)} tone="info" sub={t("{count} units added to stock", { count: fmt(inKindUnits) })} />
        <Stat label={t("Largest cash gift")} value={compact(largest?.amount_or_quantity ?? 0)} unit={t("PKR")} sub={largest ? largest.donor ?? t("Anonymous") : t("none yet")} />
        <Stat label={t("Donors")} value={fmt(donorCount)} sub={t("Named donors on record")} />
      </StatStrip>

      <DonationCharts rows={data.rows} byCategory={totals.byCategory} />

      {!isCoordinator && <ReadOnlyNote />}
      <Card>          <Toolbar>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "All", label: t("All {count}", { count: fmt(data.rows.length) }) },
                { value: "Cash", label: t("Cash {count}", { count: fmt(totals.cashCount) }) },
                { value: "In-Kind", label: t("In-kind {count}", { count: fmt(totals.inKindCount) }) },
              ]}
            />
            <span className="font-mono text-[11px] text-muted">{t("Newest first")}</span>
          </Toolbar>
          <TableHead>
            <span className="w-[84px] shrink-0">{t("Type")}</span>
            <span className="flex-1">{t("Donor")}</span>
            <span className="w-[180px] shrink-0">{t("Item")}</span>
            <span className="w-[90px] shrink-0">{t("Category")}</span>
            <span className="w-[90px] shrink-0">{t("Date")}</span>
            <span className="w-[130px] shrink-0 text-end">{t("Amount / qty")}</span>
          </TableHead>
          {rows.length === 0 ? (
            <Empty>{t("No donations yet.")}</Empty>
          ) : (
            rows.map((d) => (
              <Row key={d._id} className="h-[52px]">
                <span className="w-[84px] shrink-0">
                  {d.type === "Cash" ? (
                    <Badge tone="success" dot>{t(d.type)}</Badge>
                  ) : (
                    <Badge tone="info" dot>{t(d.type)}</Badge>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate pe-3 text-[15px] font-semibold">{d.donor ?? t("Anonymous")}</span>
                <span className={cx("w-[180px] shrink-0 truncate text-sm", !d.itemName && "text-faint")}>{d.itemName ? t(d.itemName) : "—"}</span>
                <span className="w-[90px] shrink-0 text-[13px] text-ink-2">{t(d.category)}</span>
                <span className="w-[90px] shrink-0 font-mono text-[11px] text-muted">{stamp(d.created_at).split(" ").slice(0, 2).join(" ")}</span>
                <span className="w-[130px] shrink-0 text-end">
                  {d.type === "Cash" ? (
                    <span className="text-base font-bold tracking-[-0.02em] text-ok-ink">{t("PKR {amount}", { amount: fmt(d.amount_or_quantity) })}</span>
                  ) : (
                    <span className="font-mono text-[13px]">
                      {t("+{quantity}", { quantity: qty(d.amount_or_quantity, d.unit) })}
                    </span>
                  )}
                </span>
              </Row>
            ))
          )}
        </Card>

      {recording && (
        <Modal onClose={() => setRecording(false)} width={480}>
          {(close) => <DonationForm onDone={close} />}
        </Modal>
      )}
    </>
  );
}

type DonationRow = { type: "Cash" | "In-Kind"; amount_or_quantity: number; created_at: number; donor?: string | null; category: string; itemName?: string | null; unit?: string | null };

function DonationCharts({ rows, byCategory }: { rows: DonationRow[]; byCategory: { category: string; count: number; lines: string[] }[] }) {
  const { t, language, dir } = useI18n();
  const days = useMemo(() => lastDays(14, undefined, language), [language]);
  const daily = useMemo(() => {
    const cash = byDay(rows.filter((r) => r.type === "Cash"), days, (r) => r.amount_or_quantity);
    const gifts = byDay(rows.filter((r) => r.type === "In-Kind"), days);
    return days.map((d, i) => ({ day: d.label, cash: cash[i], gifts: gifts[i] }));
  }, [rows, days]);
  const cats = byCategory.map((c) => ({
    ...c,
    lines: rows.filter((r) => r.type === "In-Kind" && r.category === c.category).map((r) => t("{quantity} {item}", { quantity: qty(r.amount_or_quantity, r.unit), item: r.itemName ? t(r.itemName) : "" }).trim()),
    key: keyOf(c.category),
    color: CATEGORY_COLORS[c.category] ?? PALETTE.grey,
  }));
  const totalGifts = cats.reduce((s, c) => s + c.count, 0);
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
      <ChartCard title={t("Cash received")} sub={t("PKR per day, last 14 days")}>
        <EvilAreaChart data={daily} config={{ cash: series(<span dir={dir}>{t("Cash (PKR)")}</span>, PALETTE.ok) }} curveType="monotone" className="aspect-auto h-[240px]">
          <EvilAreaChart.Grid />
          <EvilAreaChart.XAxis dataKey="day" tick={{ style: { direction: dir, unicodeBidi: "plaintext" } }} />
          <EvilAreaChart.YAxis width={40} tickFormatter={(v: number) => compact(v)} />
          <EvilAreaChart.Tooltip roundness="md" />
          <EvilAreaChart.Area dataKey="cash" strokeWidth={2} />
        </EvilAreaChart>
      </ChartCard>
      <ChartCard title={t("In-kind gifts by category")} sub={t("Goods donated straight into stock")}>
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[190px] w-[190px] flex-none">
            {totalGifts > 0 ? (
              <EvilPieChart
                data={cats.filter((c) => c.count > 0)}
                dataKey="count"
                nameKey="key"
                config={Object.fromEntries(cats.map((c) => [c.key, series(<span dir={dir}>{t(c.category)}</span>, c.color)]))}
                className="aspect-square h-[190px]"
              >
                <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
                <EvilPieChart.Tooltip roundness="md" />
              </EvilPieChart>
            ) : (
              <div className="size-full rounded-full border-[14px] border-track" />
            )}
            <div dir={dir} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{fmt(totalGifts)}</span>
              <span className="text-xs text-muted">{t("gifts")}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <LegendDots items={cats.map((c) => ({ label: c.lines.length ? t("{category} · {items}", { category: t(c.category), items: c.lines.join(t(", ")) }) : t(c.category), color: c.color, value: fmt(c.count) }))} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function DonationForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const items = useQuery(api.inventory.list);
  const create = useMutation(api.donations.create);
  const run = useRun();
  const [type, setType] = useState<"Cash" | "In-Kind">("In-Kind");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [donor, setDonor] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const item = items?.find((i) => i._id === itemId);
  const n = Number(amount);
  const errors = {
    item: type === "In-Kind" && !itemId ? t("Choose the donated item") : null,
    amount: !amount || !Number.isInteger(n) || n < 1 ? (type === "Cash" ? t("Enter an amount in whole rupees") : t("Enter a whole quantity of at least 1")) : null,
  };
  const valid = !errors.item && !errors.amount;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const ok = await run(
      create({
        type,
        amount_or_quantity: n,
        item_id: type === "In-Kind" ? (itemId as Id<"inventory">) : undefined,
        donor: donor || undefined,
      }),
      type === "Cash" ? t("PKR {amount} recorded", { amount: fmt(n) }) : t("{quantity} of {item} added to the warehouse", { quantity: qty(n, item?.unit), item: item ? t(item.name) : t("stock") }),
    );
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={t("New record")} title={t("Record a donation")} onClose={onDone} />
        <div className="flex gap-1 rounded-[10px] bg-[#ecede8] p-1">
          {(["Cash", "In-Kind"] as const).map((donationType) => (
            <button
              key={donationType}
              type="button"
              onClick={() => setType(donationType)}
              className={cx(
                "flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-md py-2 transition-colors",
                type === donationType ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink",
              )}
            >
              <span className="text-sm font-bold">{t(donationType)}</span>
              <span className="font-mono text-[10px] text-muted">{t(donationType === "Cash" ? "amount in PKR" : "adds to stock")}</span>
            </button>
          ))}
        </div>        {type === "In-Kind" && (
          <Field label={t("Item")} error={touched ? errors.item : null} hint={item ? t("Category: {category} (set automatically)", { category: t(item.category) }) : undefined}>
            <Select value={itemId} onChange={(e) => setItemId(e.target.value)} invalid={touched && !!errors.item}>
              <option value="">{t("Choose an item…")}</option>
              {items?.map((i) => (
                <option key={i._id} value={i._id}>
                  {t(i.lowStock ? "{item} ({unit}) · low stock" : "{item} ({unit})", { item: t(i.name), unit: unitLabel(1, i.unit) })}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={type === "Cash" ? t("Amount (PKR)") : item ? t("Quantity ({unit})", { unit: unitLabel(1, item.unit) }) : t("Quantity")} error={touched ? errors.amount : null}>
          <Input dir="ltr" type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={touched && !!errors.amount} />
        </Field>
        <Field label={t("Donor (optional)")}>
          <Input value={donor} onChange={(e) => setDonor(e.target.value)} maxLength={80} placeholder={t("Donor or organization name")} />
        </Field>
        {type === "In-Kind" && item && valid && (
          <div className={cx("flex items-center gap-3 rounded-lg border p-3.5", item.lowStock ? "border-warn-line bg-warn-wash" : "border-info-line bg-info-wash")}>
            <div className="flex flex-1 flex-col gap-1">
              <span className="label">{t("Warehouse after saving")}</span>
              <span className="flex items-baseline gap-2">
                <span className={cx("text-xl font-bold tracking-[-0.02em]", item.lowStock && "text-alert")}>{fmt(item.stock)}</span>
                <span className="text-muted rtl:rotate-180">→</span>
                <span className="text-xl font-bold tracking-[-0.02em]">{fmt(item.stock + n)}</span>
                <span className="font-mono text-[11px] text-muted">{unitLabel(item.stock + n, item.unit)}</span>
              </span>
            </div>
            {item.lowStock && item.stock + n > item.reorder_level && (
              <Badge tone="success">{t("Clears low stock")}</Badge>
            )}
          </div>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {t(busy ? "Saving…" : "Record donation")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
