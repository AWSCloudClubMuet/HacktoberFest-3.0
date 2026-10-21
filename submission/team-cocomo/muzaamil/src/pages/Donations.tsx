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
import { fmt, stamp } from "../lib/format";
import { useViewer } from "../lib/viewer";

const numberWords = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default function Donations() {
  const data = useQuery(api.donations.list);
  const { isCoordinator } = useViewer();
  const [filter, setFilter] = useState<"All" | "Cash" | "In-Kind">("All");
  const [recording, setRecording] = useState(false);

  if (!data) return <Loading />;
  const { totals } = data;
  const rows = data.rows.filter((d) => filter === "All" || d.type === filter);
  const millions = (totals.cash / 1_000_000).toFixed(2);
  const cashRows = data.rows.filter((d) => d.type === "Cash");
  const largest = cashRows.reduce<(typeof cashRows)[number] | undefined>((m, d) => (!m || d.amount_or_quantity > m.amount_or_quantity ? d : m), undefined);
  const inKindUnits = data.rows.filter((d) => d.type === "In-Kind").reduce((s, d) => s + d.amount_or_quantity, 0);
  const donorCount = new Set(data.rows.map((d) => d.donor).filter(Boolean)).size;

  return (
    <>
      <PageHeader
        kicker={`Donations · ${data.rows.length} records`}
        title={
          <>
            PKR {millions} million in cash. {numberWords[totals.inKindCount] ?? totals.inKindCount} {totals.inKindCount === 1 ? "gift" : "gifts"} in kind.
          </>
        }
        deck="In-kind donations go straight into warehouse stock."
        actions={
          isCoordinator && (
            <Button onClick={() => setRecording(true)}>
              <PlusIcon /> Record donation
            </Button>
          )
        }
      />

      <StatStrip cols={4}>
        <Stat label="Cash received" value={compact(totals.cash)} unit="PKR" tone="ok" sub={`${totals.cashCount} cash donations · PKR ${fmt(totals.cash)}`} />
        <Stat label="In-kind gifts" value={totals.inKindCount} tone="info" sub={`${fmt(inKindUnits)} units added to stock`} />
        <Stat label="Largest cash gift" value={compact(largest?.amount_or_quantity ?? 0)} unit="PKR" sub={largest ? largest.donor ?? "Anonymous" : "none yet"} />
        <Stat label="Donors" value={donorCount} sub="Named donors on record" />
      </StatStrip>

      <DonationCharts rows={data.rows} byCategory={totals.byCategory} />

      {!isCoordinator && <ReadOnlyNote />}
      <Card>          <Toolbar>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "All", label: `All ${data.rows.length}` },
                { value: "Cash", label: `Cash ${totals.cashCount}` },
                { value: "In-Kind", label: `In-kind ${totals.inKindCount}` },
              ]}
            />
            <span className="font-mono text-[11px] text-muted">Newest first</span>
          </Toolbar>
          <TableHead>
            <span className="w-[84px] shrink-0">Type</span>
            <span className="flex-1">Donor</span>
            <span className="w-[180px] shrink-0">Item</span>
            <span className="w-[90px] shrink-0">Category</span>
            <span className="w-[90px] shrink-0">Date</span>
            <span className="w-[130px] shrink-0 text-right">Amount / qty</span>
          </TableHead>
          {rows.length === 0 ? (
            <Empty>No donations yet.</Empty>
          ) : (
            rows.map((d) => (
              <Row key={d._id} className="h-[52px]">
                <span className="w-[84px] shrink-0">
                  {d.type === "Cash" ? (
                    <Badge tone="success" dot>Cash</Badge>
                  ) : (
                    <Badge tone="info" dot>In-kind</Badge>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate pr-3 text-[15px] font-semibold">{d.donor ?? "Anonymous"}</span>
                <span className={cx("w-[180px] shrink-0 truncate text-sm", !d.itemName && "text-faint")}>{d.itemName ?? "—"}</span>
                <span className="w-[90px] shrink-0 text-[13px] text-ink-2">{d.category}</span>
                <span className="w-[90px] shrink-0 font-mono text-[11px] text-muted">{stamp(d.created_at).split(" ").slice(0, 2).join(" ")}</span>
                <span className="w-[130px] shrink-0 text-right">
                  {d.type === "Cash" ? (
                    <span className="text-base font-bold tracking-[-0.02em] text-ok-ink">PKR {fmt(d.amount_or_quantity)}</span>
                  ) : (
                    <span className="font-mono text-[13px]">
                      +{fmt(d.amount_or_quantity)} {d.unit}
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

type DonationRow = { type: "Cash" | "In-Kind"; amount_or_quantity: number; created_at: number; donor?: string | null };

function DonationCharts({ rows, byCategory }: { rows: DonationRow[]; byCategory: { category: string; count: number; lines: string[] }[] }) {
  const days = useMemo(() => lastDays(14), []);
  const daily = useMemo(() => {
    const cash = byDay(rows.filter((r) => r.type === "Cash"), days, (r) => r.amount_or_quantity);
    const gifts = byDay(rows.filter((r) => r.type === "In-Kind"), days);
    return days.map((d, i) => ({ day: d.label, cash: cash[i], gifts: gifts[i] }));
  }, [rows, days]);
  const cats = byCategory.map((c) => ({ ...c, key: keyOf(c.category), color: CATEGORY_COLORS[c.category] ?? PALETTE.grey }));
  const totalGifts = cats.reduce((s, c) => s + c.count, 0);
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
      <ChartCard title="Cash received" sub="PKR per day, last 14 days">
        <EvilAreaChart data={daily} config={{ cash: series("Cash (PKR)", PALETTE.ok) }} curveType="monotone" className="aspect-auto h-[240px]">
          <EvilAreaChart.Grid />
          <EvilAreaChart.XAxis dataKey="day" />
          <EvilAreaChart.YAxis width={40} tickFormatter={(v: number) => compact(v)} />
          <EvilAreaChart.Tooltip roundness="md" />
          <EvilAreaChart.Area dataKey="cash" strokeWidth={2} />
        </EvilAreaChart>
      </ChartCard>
      <ChartCard title="In-kind gifts by category" sub="Goods donated straight into stock">
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[190px] w-[190px] flex-none">
            {totalGifts > 0 ? (
              <EvilPieChart
                data={cats.filter((c) => c.count > 0)}
                dataKey="count"
                nameKey="key"
                config={Object.fromEntries(cats.map((c) => [c.key, series(c.category, c.color)]))}
                className="aspect-square h-[190px]"
              >
                <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
                <EvilPieChart.Tooltip roundness="md" />
              </EvilPieChart>
            ) : (
              <div className="size-full rounded-full border-[14px] border-track" />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{totalGifts}</span>
              <span className="text-xs text-muted">gifts</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <LegendDots items={cats.map((c) => ({ label: c.lines.length ? `${c.category} · ${c.lines.join(", ")}` : c.category, color: c.color, value: c.count }))} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function DonationForm({ onDone }: { onDone: () => void }) {
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
    item: type === "In-Kind" && !itemId ? "Choose the donated item" : null,
    amount: !amount || !Number.isInteger(n) || n < 1 ? (type === "Cash" ? "Enter an amount in whole rupees" : "Enter a whole quantity of at least 1") : null,
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
      type === "Cash" ? `PKR ${fmt(n)} recorded` : `${fmt(n)} ${item?.unit ?? ""} of ${item?.name ?? "stock"} added to the warehouse`,
    );
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker="New record" title="Record a donation" onClose={onDone} />
        <div className="flex gap-1 rounded-[10px] bg-[#ecede8] p-1">
          {(["Cash", "In-Kind"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cx(
                "flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-md py-2 transition-colors",
                type === t ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink",
              )}
            >
              <span className="text-sm font-bold">{t === "Cash" ? "Cash" : "In-kind"}</span>
              <span className="font-mono text-[10px] text-muted">{t === "Cash" ? "amount in PKR" : "adds to stock"}</span>
            </button>
          ))}
        </div>        {type === "In-Kind" && (
          <Field label="Item" error={touched ? errors.item : null} hint={item ? `Category: ${item.category} (set automatically)` : undefined}>
            <Select value={itemId} onChange={(e) => setItemId(e.target.value)} invalid={touched && !!errors.item}>
              <option value="">Choose an item…</option>
              {items?.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.unit}){i.lowStock ? " · low stock" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={type === "Cash" ? "Amount (PKR)" : `Quantity${item ? ` (${item.unit})` : ""}`} error={touched ? errors.amount : null}>
          <Input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={touched && !!errors.amount} />
        </Field>
        <Field label="Donor (optional)">
          <Input value={donor} onChange={(e) => setDonor(e.target.value)} maxLength={80} placeholder="Al-Khidmat Foundation" />
        </Field>
        {type === "In-Kind" && item && valid && (
          <div className={cx("flex items-center gap-3 rounded-lg border p-3.5", item.lowStock ? "border-warn-line bg-warn-wash" : "border-info-line bg-info-wash")}>
            <div className="flex flex-1 flex-col gap-1">
              <span className="label">Warehouse after saving</span>
              <span className="flex items-baseline gap-2">
                <span className={cx("text-xl font-bold tracking-[-0.02em]", item.lowStock && "text-alert")}>{fmt(item.stock)}</span>
                <span className="text-muted">→</span>
                <span className="text-xl font-bold tracking-[-0.02em]">{fmt(item.stock + n)}</span>
                <span className="font-mono text-[11px] text-muted">{item.unit}</span>
              </span>
            </div>
            {item.lowStock && item.stock + n > item.reorder_level && (
              <Badge tone="success">Clears low stock</Badge>
            )}
          </div>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {busy ? "Saving…" : "Record donation"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
