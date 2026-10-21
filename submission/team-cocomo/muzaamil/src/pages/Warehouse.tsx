import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useRun } from "../components/toast";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { CATEGORY_COLORS, ChartCard, LegendDots, PALETTE, series } from "../components/charts";
import {
  Badge,
  Button,
  Card,
  EditIcon,
  Empty,
  Field,
  Flag,
  IconButton,
  Input,
  Loading,
  LowStockTag,
  Modal,
  PageHeader,
  Panel,
  PanelTitle,
  PlusIcon,
  ReadOnlyNote,
  Row,
  SearchBox,
  Segmented,
  Select,
  TableHead,
  Toggle,
  Toolbar,
  TrashIcon,
  cx,
} from "../components/ui";
import { CATEGORIES, fmt, qty, type Category } from "../lib/format";
import { useViewer } from "../lib/viewer";

type Item = FunctionReturnType<typeof api.inventory.list>[number];

export default function Warehouse() {
  const items = useQuery(api.inventory.list);
  const { isCoordinator } = useViewer();
  const remove = useMutation(api.inventory.remove);
  const run = useRun();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  useEffect(() => setSearch(params.get("q") ?? ""), [params]);
  const [category, setCategory] = useState<"All" | Category>("All");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [restocking, setRestocking] = useState<Item | null>(null);

  const low = (items ?? []).filter((i) => i.lowStock).length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((i) => (category === "All" || i.category === category) && (!lowOnly || i.lowStock) && (!q || i.name.toLowerCase().includes(q)));
  }, [items, search, category, lowOnly]);
  const total = items?.length ?? 0;

  return (
    <>
      <PageHeader
        kicker="Warehouse · stock on hand"
        title={
          <>
            {total} items in stock.{" "}
            {low > 0 ? (
              <span className="text-warn-ink">
                {low} {low === 1 ? "needs" : "need"} restocking.
              </span>
            ) : (
              "None need restocking."
            )}
          </>
        }
        deck="Items at or below their reorder level are flagged. Stock shown is free to dispatch; reserved stock is already held by open dispatches."
        actions={
          isCoordinator && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon /> Add item
            </Button>
          )
        }
      />
      {items && <StockCharts items={items} />}
      {!isCoordinator && <ReadOnlyNote />}
      <Card>
          <Toolbar>
            <SearchBox value={search} onChange={setSearch} placeholder="Search items" width="w-56" />
            <div className="flex items-center gap-2.5">
              <Segmented value={category} onChange={setCategory} options={[{ value: "All", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
              <Toggle on={lowOnly} onClick={() => setLowOnly((v) => !v)}>
                Low stock · {low}
              </Toggle>
            </div>
          </Toolbar>
          <TableHead>
            <span className="w-[230px] shrink-0 pl-[15px]">Item · category</span>
            <span className="flex-1">Stock vs reorder level</span>
            <span className="w-20 shrink-0">Reserved</span>
            <span className="w-[100px] shrink-0">Status</span>
            <span className="w-[176px] shrink-0" />
          </TableHead>
          {!items ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty>No items match.</Empty>
          ) : (
            rows.map((i) => {
              const scale = Math.max(1, i.reorder_level * 5);
              const active = (editing !== "new" && editing?._id === i._id) || restocking?._id === i._id;
              return (
                <Row key={i._id} className={cx("h-[60px]", active && "bg-tint")}>
                  <span className="flex w-[230px] shrink-0 items-center gap-3">
                    <Flag tone={active ? "ink" : i.lowStock ? "signal" : null} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-semibold">{i.name}</span>
                      <span className="truncate text-xs text-muted">
                        {i.category} · {i.unit} · {i.needCount} {i.needCount === 1 ? "need" : "needs"}
                      </span>
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-4 pr-8">
                    <span className="flex w-[120px] shrink-0 items-baseline gap-1 whitespace-nowrap">
                      <span className={cx("text-xl font-bold tracking-[-0.02em]", i.lowStock && "text-alert")}>{fmt(i.stock)}</span>
                      <span className="font-mono text-[11px] text-muted">/ {fmt(i.reorder_level)}</span>
                    </span>
                    <span className="relative flex h-2 flex-1 rounded-full bg-track">
                      <span className={cx("rounded-full", i.lowStock ? "bg-alert" : "bg-ok")} style={{ width: `${Math.min(1, i.stock / scale) * 100}%` }} />
                      <span className="absolute -bottom-1 -top-1 left-[20%] w-0.5 bg-ink" title="Reorder level" />
                    </span>
                  </span>
                  <span className={cx("w-20 shrink-0 font-mono text-xs", i.reserved ? "text-ink" : "text-faint")}>{fmt(i.reserved)}</span>
                  <span className="flex w-[100px] shrink-0">{i.lowStock ? <LowStockTag /> : <Badge tone="success" dot>In stock</Badge>}</span>
                  <span className="flex w-[176px] shrink-0 justify-end gap-1.5">
                    {isCoordinator && (
                      <>
                        <Button size="sm" variant={i.lowStock ? "brand" : "secondary"} onClick={() => setRestocking(i)}>
                          <PlusIcon /> Add stock
                        </Button>
                        <IconButton label={`Edit ${i.name}`} onClick={() => setEditing(i)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          label={`Delete ${i.name}`}
                          tone="alert"
                          onClick={() => {
                            if (confirm(`Delete ${i.name} from the warehouse?`)) void run(remove({ id: i._id }), `${i.name} deleted`);
                          }}
                        >
                          <TrashIcon />
                        </IconButton>
                      </>
                    )}
                  </span>
                </Row>
              );
            })
          )}
          <div className="flex items-center gap-2 border-t border-line bg-tint px-5 py-3 font-mono text-[11px] text-muted">
            <span className="h-3 w-0.5 bg-ink" /> Tick marks the reorder level. Bar scale is 5× reorder level.
          </div>
        </Card>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          {(close) => <ItemForm key={editing === "new" ? "new" : editing._id} item={editing === "new" ? null : editing} onDone={close} />}
        </Modal>
      )}
      {restocking && (
        <Modal onClose={() => setRestocking(null)} width={440}>
          {(close) => <RestockForm item={restocking} onDone={close} />}
        </Modal>
      )}
    </>
  );
}

function StockCharts({ items }: { items: Item[] }) {
  // Units differ per item, so stock is shown as cover: how many times the reorder level is on hand.
  const cover = items
    .map((i) => {
      const x = Math.round((i.stock / Math.max(1, i.reorder_level)) * 10) / 10;
      return { item: i.name.split(" ").slice(0, 2).join(" "), low: i.lowStock ? x : 0, ok: i.lowStock ? 0 : x, x };
    })
    .sort((a, b) => a.x - b.x);
  const cats = Object.keys(CATEGORY_COLORS).map((c) => ({
    category: c,
    count: items.filter((i) => i.category === c).length,
    low: items.filter((i) => i.category === c && i.lowStock).length,
  }));
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
      <ChartCard title="Stock cover" sub="Stock on hand ÷ reorder level. Under 1× needs restocking.">
        <EvilBarChart
          data={cover}
          config={{ low: series("Low stock", PALETTE.alert), ok: series("Healthy", PALETTE.ok) }}
          stackType="stacked"
          barRadius={4}
          className="aspect-auto h-[250px]"
        >
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="item" interval={0} angle={-25} textAnchor="end" height={60} />
          <EvilBarChart.YAxis width={44} tickFormatter={(v: number) => `${v}×`} />
          <EvilBarChart.Tooltip roundness="md" />
          <EvilBarChart.Legend variant="rounded-square" align="left" />
          <EvilBarChart.Bar dataKey="low" />
          <EvilBarChart.Bar dataKey="ok" />
        </EvilBarChart>
      </ChartCard>
      <ChartCard title="Items by category" sub={`${items.length} stock lines`}>
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[200px] w-[200px] flex-none">
            <EvilPieChart
              data={cats.filter((c) => c.count > 0)}
              dataKey="count"
              nameKey="category"
              config={Object.fromEntries(cats.map((c) => [c.category, series(c.category, CATEGORY_COLORS[c.category])]))}
              className="aspect-square h-[200px]"
            >
              <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
              <EvilPieChart.Tooltip roundness="md" />
            </EvilPieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] font-bold leading-8 tracking-[-0.03em]">{items.length}</span>
              <span className="text-xs text-muted">items</span>
            </div>
          </div>
          <div className="flex-1">
            <LegendDots items={cats.map((c) => ({ label: c.low ? `${c.category} · ${c.low} low` : c.category, color: CATEGORY_COLORS[c.category], value: c.count }))} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function ItemForm({ item, onDone }: { item: Item | null; onDone: () => void }) {
  const create = useMutation(api.inventory.create);
  const update = useMutation(api.inventory.update);
  const run = useRun();
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<Category>(item?.category ?? "Food");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [stock, setStock] = useState(item ? String(item.stock) : "0");
  const [reorder, setReorder] = useState(item ? String(item.reorder_level) : "");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const s = Number(stock);
  const r = Number(reorder);
  const whole = (v: string, n: number) => v !== "" && Number.isInteger(n) && n >= 0;
  const errors = {
    name: !name.trim() ? "Item name is required" : null,
    unit: !unit.trim() ? "Unit is required, e.g. kg, L, sachet" : null,
    stock: !whole(stock, s) ? "Enter a whole number, 0 or more" : null,
    reorder: !whole(reorder, r) ? "Enter a whole number, 0 or more" : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const isLow = valid && s <= r;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const fields = { name, category, unit, stock: s, reorder_level: r };
    const ok = item ? await run(update({ id: item._id, ...fields }), `${name.trim()} saved`) : await run(create(fields), `${name.trim()} added`);
    setBusy(false);
    if (ok) onDone();
  }
  const show = (k: keyof typeof errors) => (touched ? errors[k] : null);
  const line = (label: string, value: string, tone = "") => (
    <div className={cx("flex justify-between font-mono text-xs", tone)}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={item ? `Edit item${item.lowStock ? " · low stock" : ""}` : "New item"} title={item ? item.name : "Add item"} onClose={onDone} />
        <Field label="Item name" error={show("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!show("name")} placeholder="ORS sachets" />
        </Field>
        <div className="flex gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Unit" error={show("unit")}>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} invalid={!!show("unit")} placeholder="sachet" />
          </Field>
        </div>
        <div className="flex gap-3">
          <Field label="Stock on hand" error={show("stock")}>
            <Input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} invalid={!!show("stock")} />
          </Field>
          <Field label="Reorder level" error={show("reorder")}>
            <Input type="number" min={0} step={1} value={reorder} onChange={(e) => setReorder(e.target.value)} invalid={!!show("reorder")} />
          </Field>
        </div>
        {valid && (
          <div className={cx("flex flex-col gap-2 rounded-lg border p-3.5", isLow ? "border-warn-line bg-warn-wash" : "border-ok-line bg-ok-wash")}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">Preview</span>
              {isLow ? <LowStockTag /> : <Badge tone="success" dot>In stock</Badge>}
            </div>
            {line("Available to dispatch", fmt(s))}
            {item && item.reserved > 0 && line("Held by open dispatches", fmt(item.reserved))}
            {isLow && line("Short of reorder level by", fmt(Math.max(0, r - s)), "text-alert")}
          </div>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {busy ? "Saving…" : item ? "Save item" : "Add item"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function RestockForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const restock = useMutation(api.inventory.restock);
  const run = useRun();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const q = Number(amount);
  const error = amount !== "" && (!Number.isInteger(q) || q < 1) ? "Enter a whole number of at least 1" : null;
  const valid = amount !== "" && !error;
  const after = item.stock + (valid ? q : 0);
  const lowAfter = after <= item.reorder_level;
  // Quick picks: just clear the reorder level, or bring stock to 2× and 5× it.
  const picks = [...new Set([item.reorder_level - item.stock + 1, item.reorder_level * 2 - item.stock, item.reorder_level * 5 - item.stock])].filter((n) => n > 0).slice(0, 3);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    const ok = await run(restock({ id: item._id, quantity: q }), `+${qty(q, item.unit)} ${item.name} · ${fmt(after)} on hand`);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={`Add stock · ${item.category}`} title={item.name} onClose={onDone} />
        <Field label={`Quantity received (${item.unit})`} error={error}>
          <Input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={!!error} autoFocus placeholder="0" />
        </Field>
        {picks.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-1.5">
            {picks.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(String(n))}
                className="h-7 cursor-pointer rounded-md border border-line-strong bg-paper px-2.5 font-mono text-xs text-ink-2 transition-[background-color,scale] duration-150 ease-out hover:bg-tint motion-safe:active:scale-[0.96]"
              >
                +{fmt(n)}
              </button>
            ))}
          </div>
        )}
        <div className={cx("flex items-center justify-between rounded-lg border p-3.5", lowAfter ? "border-warn-line bg-warn-wash" : "border-ok-line bg-ok-wash")}>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="font-mono text-xs text-muted">{fmt(item.stock)} →</span>
            <span className="text-2xl font-bold tracking-[-0.02em]">{fmt(after)}</span>
            <span className="font-mono text-[11px] text-muted">{item.unit} · reorder at {fmt(item.reorder_level)}</span>
          </span>
          {lowAfter ? <LowStockTag /> : <Badge tone="success" dot>In stock</Badge>}
        </div>
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || !valid}>
            {busy ? "Adding…" : valid ? `Add ${qty(q, item.unit)}` : "Add stock"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
