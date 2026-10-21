import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useRun } from "../components/toast";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/evilcharts/ui/recharts-tooltip";
import { CATEGORY_COLORS, ChartCard, LegendDots, PALETTE, series } from "../components/charts";
import { useI18n } from "../i18n";
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
  const { t } = useI18n();
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
    return (items ?? []).filter((i) => (category === "All" || i.category === category) && (!lowOnly || i.lowStock) && (!q || i.name.toLowerCase().includes(q) || t(i.name).toLowerCase().includes(q)));
  }, [items, search, category, lowOnly, t]);
  const total = items?.length ?? 0;

  return (
    <>
      <PageHeader
        kicker={t("Warehouse · stock on hand")}
        title={
          <>
            {t(total === 1 ? "{count} item in stock." : "{count} items in stock.", { count: fmt(total) })}{" "}
            {low > 0 ? (
              <span className="text-warn-ink">
                {t(low === 1 ? "{count} needs restocking." : "{count} need restocking.", { count: fmt(low) })}
              </span>
            ) : (
              t("None need restocking.")
            )}
          </>
        }
        deck={t("Items at or below their reorder level are flagged. Stock shown is free to dispatch; reserved stock is already held by open dispatches.")}
        actions={
          isCoordinator && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon /> {t("Add item")}
            </Button>
          )
        }
      />
      {items && <StockCharts items={items} />}
      {!isCoordinator && <ReadOnlyNote />}
      <Card>
          <Toolbar>
            <SearchBox value={search} onChange={setSearch} placeholder={t("Search items")} width="w-56" />
            <div className="flex items-center gap-2.5">
              <Segmented value={category} onChange={setCategory} options={[{ value: "All", label: t("All") }, ...CATEGORIES.map((c) => ({ value: c, label: t(c) }))]} />
              <Toggle on={lowOnly} onClick={() => setLowOnly((v) => !v)}>
                {t("Low stock · {count}", { count: fmt(low) })}
              </Toggle>
            </div>
          </Toolbar>
          <TableHead>
            <span className="w-[230px] shrink-0 ps-[15px]">{t("Item · category")}</span>
            <span className="flex-1">{t("Stock vs reorder level")}</span>
            <span className="w-20 shrink-0">{t("Reserved")}</span>
            <span className="w-[100px] shrink-0">{t("Status")}</span>
            <span className="w-[176px] shrink-0" />
          </TableHead>
          {!items ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty>{t("No items match.")}</Empty>
          ) : (
            rows.map((i) => {
              const scale = Math.max(1, i.reorder_level * 5);
              const active = (editing !== "new" && editing?._id === i._id) || restocking?._id === i._id;
              return (
                <Row key={i._id} className={cx("h-[60px]", active && "bg-tint")}>
                  <span className="flex w-[230px] shrink-0 items-center gap-3">
                    <Flag tone={active ? "ink" : i.lowStock ? "signal" : null} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-semibold">{t(i.name)}</span>
                      <span className="truncate text-xs text-muted">
                        {t(i.category)} · {t(i.unit)} · {t(i.needCount === 1 ? "{count} need" : "{count} needs", { count: fmt(i.needCount) })}
                      </span>
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-4 pe-8">
                    <span className="flex w-[120px] shrink-0 items-baseline gap-1 whitespace-nowrap">
                      <span className={cx("text-xl font-bold tracking-[-0.02em]", i.lowStock && "text-alert")}>{fmt(i.stock)}</span>
                      <span className="font-mono text-[11px] text-muted">/ {fmt(i.reorder_level)}</span>
                    </span>
                    <span className="relative flex h-2 flex-1 rounded-full bg-track">
                      <span className={cx("rounded-full", i.lowStock ? "bg-alert" : "bg-ok")} style={{ width: `${Math.min(1, i.stock / scale) * 100}%` }} />
                      <span className="absolute -bottom-1 -top-1 start-[20%] w-0.5 bg-ink" title={t("Reorder level")} />
                    </span>
                  </span>
                  <span className={cx("w-20 shrink-0 font-mono text-xs", i.reserved ? "text-ink" : "text-faint")}>{fmt(i.reserved)}</span>
                  <span className="flex w-[100px] shrink-0">{i.lowStock ? <LowStockTag /> : <Badge tone="success" dot>{t("In stock")}</Badge>}</span>
                  <span className="flex w-[176px] shrink-0 justify-end gap-1.5">
                    {isCoordinator && (
                      <>
                        <Button size="sm" variant={i.lowStock ? "brand" : "secondary"} onClick={() => setRestocking(i)}>
                          <PlusIcon /> {t("Add stock")}
                        </Button>
                        <IconButton label={t("Edit {name}", { name: t(i.name) })} onClick={() => setEditing(i)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          label={t("Delete {name}", { name: t(i.name) })}
                          tone="alert"
                          onClick={() => {
                            if (confirm(t("Delete {name} from the warehouse?", { name: t(i.name) }))) void run(remove({ id: i._id }), t("{name} deleted", { name: t(i.name) }));
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
            <span className="h-3 w-0.5 bg-ink" /> {t("Tick marks the reorder level. Bar scale is 5× reorder level.")}
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
  const { t, locale, dir } = useI18n();
  const coverNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  // Units differ per item, so stock is shown as cover: how many times the reorder level is on hand.
  const cover = items
    .map((i) => {
      const x = Math.round((i.stock / Math.max(1, i.reorder_level)) * 10) / 10;
      return { item: t(i.name).split(" ").slice(0, 2).join(" "), low: i.lowStock ? x : 0, ok: i.lowStock ? 0 : x, x };
    })
    .sort((a, b) => a.x - b.x);
  const cats = Object.keys(CATEGORY_COLORS).map((c) => ({
    category: c,
    count: items.filter((i) => i.category === c).length,
    low: items.filter((i) => i.category === c && i.lowStock).length,
  }));
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
      <ChartCard title={t("Stock cover")} sub={t("Stock on hand ÷ reorder level. Under 1× needs restocking.")}>
        <EvilBarChart
          data={cover}
          config={{ low: series(t("Low stock"), PALETTE.alert), ok: series(t("Healthy"), PALETTE.ok) }}
          stackType="stacked"
          barRadius={4}
          className="aspect-auto h-[250px]"
        >
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="item" interval={0} angle={dir === "rtl" ? 25 : -25} textAnchor={dir === "rtl" ? "start" : "end"} height={60} reversed={dir === "rtl"} />
          <EvilBarChart.YAxis width={44} orientation={dir === "rtl" ? "right" : "left"} tickFormatter={(v: number) => t("{count}×", { count: coverNumber.format(v) })} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent roundness="md" formatter={(value, name) => (
            <div className="flex w-full items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: name === "low" ? PALETTE.alert : PALETTE.ok }} />
              <span className="flex-1 text-muted-foreground">{t(name === "low" ? "Low stock" : "Healthy")}</span>
              <span className="font-mono font-medium tabular-nums">{coverNumber.format(Number(value))}</span>
            </div>
          )} />} />
          <EvilBarChart.Legend variant="rounded-square" align={dir === "rtl" ? "right" : "left"} />
          <EvilBarChart.Bar dataKey="low" />
          <EvilBarChart.Bar dataKey="ok" />
        </EvilBarChart>
      </ChartCard>
      <ChartCard title={t("Items by category")} sub={t(items.length === 1 ? "{count} stock line" : "{count} stock lines", { count: fmt(items.length) })}>
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[200px] w-[200px] flex-none">
            <EvilPieChart
              data={cats.filter((c) => c.count > 0)}
              dataKey="count"
              nameKey="category"
              config={Object.fromEntries(cats.map((c) => [c.category, series(t(c.category), CATEGORY_COLORS[c.category])]))}
              className="aspect-square h-[200px]"
            >
              <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
              <ChartTooltip content={<ChartTooltipContent nameKey="category" hideLabel roundness="md" formatter={(value, name) => (
                <div className="flex w-full items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: CATEGORY_COLORS[String(name)] }} />
                  <span className="flex-1 text-muted-foreground">{t(String(name))}</span>
                  <span className="font-mono font-medium tabular-nums">{fmt(Number(value))}</span>
                </div>
              )} />} />
            </EvilPieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] font-bold leading-8 tracking-[-0.03em]">{fmt(items.length)}</span>
              <span className="text-xs text-muted">{t(items.length === 1 ? "item" : "items")}</span>
            </div>
          </div>
          <div className="flex-1">
            <LegendDots items={cats.map((c) => ({ label: c.low ? t("{category} · {count} low", { category: t(c.category), count: fmt(c.low) }) : t(c.category), color: CATEGORY_COLORS[c.category], value: fmt(c.count) }))} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function ItemForm({ item, onDone }: { item: Item | null; onDone: () => void }) {
  const { t } = useI18n();
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
    name: !name.trim() ? t("Item name is required") : null,
    unit: !unit.trim() ? t("Unit is required, e.g. kg, L, sachet") : null,
    stock: !whole(stock, s) ? t("Enter a whole number, 0 or more") : null,
    reorder: !whole(reorder, r) ? t("Enter a whole number, 0 or more") : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const isLow = valid && s <= r;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const fields = { name, category, unit, stock: s, reorder_level: r };
    const ok = item ? await run(update({ id: item._id, ...fields }), t("{name} saved", { name: t(name.trim()) })) : await run(create(fields), t("{name} added", { name: t(name.trim()) }));
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
        <PanelTitle kicker={item ? t(item.lowStock ? "Edit item · low stock" : "Edit item") : t("New item")} title={item ? t(item.name) : t("Add item")} onClose={onDone} />
        <Field label={t("Item name")} error={show("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!show("name")} placeholder={t("ORS sachets")} />
        </Field>
        <div className="flex gap-3">
          <Field label={t("Category")}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(c)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("Unit")} error={show("unit")}>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} invalid={!!show("unit")} placeholder={t("sachet")} />
          </Field>
        </div>
        <div className="flex gap-3">
          <Field label={t("Stock on hand")} error={show("stock")}>
            <Input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} invalid={!!show("stock")} />
          </Field>
          <Field label={t("Reorder level")} error={show("reorder")}>
            <Input type="number" min={0} step={1} value={reorder} onChange={(e) => setReorder(e.target.value)} invalid={!!show("reorder")} />
          </Field>
        </div>
        {valid && (
          <div className={cx("flex flex-col gap-2 rounded-lg border p-3.5", isLow ? "border-warn-line bg-warn-wash" : "border-ok-line bg-ok-wash")}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">{t("Preview")}</span>
              {isLow ? <LowStockTag /> : <Badge tone="success" dot>{t("In stock")}</Badge>}
            </div>
            {line(t("Available to dispatch"), fmt(s))}
            {item && item.reserved > 0 && line(t("Held by open dispatches"), fmt(item.reserved))}
            {isLow && line(t("Short of reorder level by"), fmt(Math.max(0, r - s)), "text-alert")}
          </div>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {busy ? t("Saving…") : item ? t("Save item") : t("Add item")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function RestockForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const { t, dir } = useI18n();
  const restock = useMutation(api.inventory.restock);
  const run = useRun();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const q = Number(amount);
  const error = amount !== "" && (!Number.isInteger(q) || q < 1) ? t("Enter a whole number of at least 1") : null;
  const valid = amount !== "" && !error;
  const after = item.stock + (valid ? q : 0);
  const lowAfter = after <= item.reorder_level;
  // Quick picks: just clear the reorder level, or bring stock to 2× and 5× it.
  const picks = [...new Set([item.reorder_level - item.stock + 1, item.reorder_level * 2 - item.stock, item.reorder_level * 5 - item.stock])].filter((n) => n > 0).slice(0, 3);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    const ok = await run(restock({ id: item._id, quantity: q }), t("+{quantity} {name} · {count} on hand", { quantity: qty(q, item.unit), name: t(item.name), count: fmt(after) }));
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={t("Add stock · {category}", { category: t(item.category) })} title={t(item.name)} onClose={onDone} />
        <Field label={t("Quantity received ({unit})", { unit: t(item.unit) })} error={error}>
          <Input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={!!error} autoFocus placeholder={fmt(0)} />
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
            <span className="font-mono text-xs text-muted">{fmt(item.stock)} {dir === "rtl" ? "←" : "→"}</span>
            <span className="text-2xl font-bold tracking-[-0.02em]">{fmt(after)}</span>
            <span className="font-mono text-[11px] text-muted">{t("{unit} · reorder at {count}", { unit: t(item.unit), count: fmt(item.reorder_level) })}</span>
          </span>
          {lowAfter ? <LowStockTag /> : <Badge tone="success" dot>{t("In stock")}</Badge>}
        </div>
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || !valid}>
            {busy ? t("Adding…") : valid ? t("Add {quantity}", { quantity: qty(q, item.unit) }) : t("Add stock")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
