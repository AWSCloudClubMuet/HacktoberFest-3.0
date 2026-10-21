import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/evilcharts/ui/recharts-tooltip";
import { ChartCard, PALETTE, series } from "../components/charts";
import ReliefMap from "../components/ReliefMap";
import { Link, useParams } from "react-router-dom";
import { DispatchModal } from "../components/DispatchModal";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useRun } from "../components/toast";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CampStatusPill,
  CloseIcon,
  DispatchPill,
  EditIcon,
  Empty,
  Field,
  IconButton,
  Input,
  Loading,
  Modal,
  Notice,
  Panel,
  PanelTitle,
  PlusIcon,
  PriorityPill,
  ReadOnlyNote,
  Section,
  Segmented,
  SkillPill,
  Select,
  Stat,
  StatStrip,
  TableHead,
  Vessel,
  cx,
} from "../components/ui";
import { fmt, initials, levelText, pct, PRIORITIES, qty, stamp, type Priority } from "../lib/format";
import { useViewer } from "../lib/viewer";
import { useI18n } from "../i18n";

type CampData = NonNullable<FunctionReturnType<typeof api.camps.get>>;
type NeedRow = CampData["needs"][number];

export default function CampDetail() {
  const { t } = useI18n();
  const { id } = useParams();
  const data = useQuery(api.camps.get, id ? { id: id as Id<"camps"> } : "skip");
  const { isCoordinator } = useViewer();
  const [filter, setFilter] = useState<"All" | Priority>("All");
  const [editing, setEditing] = useState<NeedRow | "new" | null>(null);
  const [dispatching, setDispatching] = useState<NeedRow | null>(null);

  if (data === undefined) return <Loading />;
  if (data === null) {
    return (
      <Card className="flex flex-col gap-4 p-8">
        <h1 className="display text-3xl">{t("Camp not found")}</h1>
        <Link to="/camps" className="w-fit text-sm font-semibold text-muted hover:text-ink">
          {t("Back to camps")}
        </Link>
      </Card>
    );
  }

  const { camp, needs } = data;
  const closed = camp.status === "Closed";
  const shown = needs.filter((n) => filter === "All" || n.priority === filter);
  const count = (p: Priority) => needs.filter((n) => n.priority === p).length;

  return (
    <>
      <header className="rise flex items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="label flex items-center gap-2">
            <Link to="/camps" className="hover:text-ink">
              {t("Camps")}
            </Link>
            <span>/</span>
            <span className="text-ink">{camp.district}</span>
            {data.criticalGaps > 0 && (
              <Badge tone="danger">
                {t(data.criticalGaps === 1 ? "{count} critical gap" : "{count} critical gaps", { count: fmt(data.criticalGaps) })}
              </Badge>
            )}
          </div>
          <h1 className="display text-[32px] leading-[38px]">{camp.name}</h1>
          <div className="flex items-center gap-3 text-[15px] text-ink-2">
            <CampStatusPill status={camp.status} />
            {t("{families} of {capacity} families · {volunteers} volunteers on site", { families: fmt(camp.current_families), capacity: fmt(camp.capacity), volunteers: fmt(data.volunteers.length) })}
          </div>
        </div>
        {isCoordinator && !closed && (
          <Button onClick={() => setEditing("new")}>
            <PlusIcon /> {t("Add need")}
          </Button>
        )}
      </header>

      <StatStrip cols={4}>
        <Stat label={t("Families")} tone="info" value={fmt(camp.current_families)} unit={`/ ${fmt(camp.capacity)}`} sub={t("{percent} of capacity", { percent: pct(camp.capacity ? camp.current_families / camp.capacity : 0) })} />
        <Stat
          label={t("Needs met")}
          value={pct(data.needsMet)}
          tone={data.needsMet == null ? undefined : data.needsMet < 0.4 ? "alert" : data.needsMet < 0.7 ? "warn" : "ok"}
          sub={t("average across this camp's needs")}
        />
        <Stat label={t("Critical gaps")} value={fmt(data.criticalGaps)} unit={t("of {count} needs", { count: fmt(needs.length) })} tone={data.criticalGaps ? "alert" : "ok"} sub={t("High priority under 40%")} />
        <Stat label={t("Open dispatches")} value={fmt(data.openDispatches)} sub={t("{count} units reserved", { count: fmt(data.reservedUnits) })} last />
      </StatStrip>

      {closed && <Notice tone="info">{t("This camp is closed. It can't take new needs, dispatches or volunteers.")}</Notice>}

      <CampCharts data={data} />

      <div className="flex items-start gap-6">
        <Section
          className="flex-1"
          title={t("Needs")}
          sub={t("Delivered ÷ required. Lighter bar = reserved by open dispatches.")}
          right={
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[{ value: "All", label: `${t("All")} ${fmt(needs.length)}` }, ...PRIORITIES.map((p) => ({ value: p, label: `${t(p)} ${fmt(count(p))}` }))]}
            />
          }
        >
          <TableHead ruled={false}>
            <span className="w-[200px] shrink-0">{t("Item · stock")}</span>
            <span className="w-20 shrink-0">{t("Priority")}</span>
            <span className="flex-1">{t("Delivered · +reserved")}</span>
            <span className="w-[60px] shrink-0 text-end">{t("Met")}</span>
            <span className="w-[166px] shrink-0" />
          </TableHead>
          {shown.length === 0 ? (
            <Empty>{t(needs.length === 0 ? "No needs recorded for this camp yet." : "No needs at this priority.")}</Empty>
          ) : (
            shown.map((n) => (
              <NeedLine
                key={n._id}
                need={n}
                closed={closed}
                onEdit={() => setEditing(n)}
                onDispatch={() => setDispatching(n)}
                active={(editing !== "new" && editing?._id === n._id) || dispatching?._id === n._id}
              />
            ))
          )}
        </Section>

        <div className="flex w-[340px] shrink-0 flex-col gap-6">
          {!isCoordinator && <ReadOnlyNote />}
          <Section
            size="md"
            title={t("Volunteers on site")}
            right={
              isCoordinator && !closed ? (
                <Link to="/volunteers" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
                  {t("Assign")}
                </Link>
              ) : undefined
            }
          >
            {data.volunteers.length === 0 ? (
              <Empty>{t("No volunteers assigned.")}</Empty>
            ) : (
              data.volunteers.map((v) => (
                <div key={v._id} className="flex h-14 items-center gap-3 border-b border-line px-5 last:border-b-0">
                  <Avatar name={initials(v.name)} />
                  <span className="flex-1 truncate text-sm font-semibold">{v.name}</span>
                  <SkillPill skill={v.skill} />
                </div>
              ))
            )}
          </Section>
          <Section size="md" title={t("Dispatch history")} right={<span className="text-[13px] text-muted">{t("{count} total", { count: fmt(data.dispatches.length) })}</span>}>
            {data.dispatches.length === 0 ? (
              <Empty>{t("No dispatches yet.")}</Empty>
            ) : (
              data.dispatches.map((d) => (
                <div key={d._id} className="flex flex-col gap-1 border-b border-line px-5 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">
                      {t("{name} × {quantity}", { name: t(d.itemName), quantity: qty(d.quantity, d.unit) })}
                    </span>
                    <DispatchPill status={d.status} />
                  </div>
                  <span className="font-mono text-[11px] text-muted">{stamp(d.created_at)}</span>
                </div>
              ))
            )}
          </Section>
        </div>
      </div>

      {isCoordinator && editing && !closed && (
        <Modal onClose={() => setEditing(null)} width={480}>
          {(close) => (
            <NeedForm key={editing === "new" ? "new" : editing._id} campId={camp._id} campName={camp.name} need={editing === "new" ? null : editing} existing={needs} onDone={close} />
          )}
        </Modal>
      )}
      {isCoordinator && dispatching && !closed && <DispatchModal campId={camp._id} needId={dispatching._id} onClose={() => setDispatching(null)} />}
    </>
  );
}

function CampCharts({ data }: { data: CampData }) {
  const { t, dir } = useI18n();
  const mapCamp = useMemo(
    () => [
      {
        ...data.camp,
        lat: data.camp.lat ?? null,
        lng: data.camp.lng ?? null,
        families: data.camp.current_families,
        needsMet: data.needsMet,
        criticalGaps: data.criticalGaps,
      },
    ],
    [data],
  );
  // Units differ per item, so the chart compares shares of each requirement.
  const rows = data.needs.map((n) => {
    const req = Math.max(1, n.required_quantity);
    const delivered = Math.round((n.fulfilled_quantity / req) * 100);
    const reserved = Math.round((Math.min(n.reserved, req - n.fulfilled_quantity) / req) * 100);
    return { item: t(n.item?.name ?? "Item"), delivered, reserved, short: Math.max(0, 100 - delivered - reserved) };
  });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
      <ChartCard title={t("Needs progress")} sub={t("Share of each requirement delivered, en route and still short")}>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t("No needs recorded yet.")}</p>
        ) : (
          <div style={{ height: Math.max(160, rows.length * 44 + 50) }}>
          <EvilBarChart
            data={rows}
            config={{
              delivered: series(t("Delivered %"), PALETTE.ok),
              reserved: series(t("En route %"), PALETTE.infoSoft),
              short: series(t("Short %"), PALETTE.alertSoft),
            }}
            layout="horizontal"
            stackType="stacked"
            barRadius={3}
            className="aspect-auto h-full"
          >
            <EvilBarChart.Grid horizontal={false} vertical />
            <EvilBarChart.XAxis domain={[0, 100]} tickFormatter={(v: number) => pct(v / 100)} reversed={dir === "rtl"} />
            <EvilBarChart.YAxis dataKey="item" width={110} orientation={dir === "rtl" ? "right" : "left"} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent roundness="md" formatter={(value, name, item) => (
              <div className="flex w-full items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.color }} />
                <span className="flex-1 text-muted-foreground">{t(name === "delivered" ? "Delivered %" : name === "reserved" ? "En route %" : "Short %")}</span>
                <span className="font-mono font-medium tabular-nums">{pct(Number(value) / 100)}</span>
              </div>
            )} />} />
            <EvilBarChart.Legend variant="rounded-square" align={dir === "rtl" ? "right" : "left"} />
            <EvilBarChart.Bar dataKey="delivered" />
            <EvilBarChart.Bar dataKey="reserved" />
            <EvilBarChart.Bar dataKey="short" />
          </EvilBarChart>
          </div>
        )}
      </ChartCard>
      <Card className="flex flex-col">
        <CardHeader title={t("Location")} sub={t("{district} district", { district: data.camp.district })} />
        <ReliefMap camps={mapCamp} focusId={data.camp._id} selectedId={data.camp._id} height={Math.max(240, rows.length * 44 + 80)} />
      </Card>
    </div>
  );
}

function NeedLine({ need, closed, onEdit, onDispatch, active }: { need: NeedRow; closed: boolean; onEdit: () => void; onDispatch: () => void; active: boolean }) {
  const { t } = useI18n();
  const { isCoordinator } = useViewer();
  const remove = useMutation(api.needs.remove);
  const run = useRun();
  const unit = need.item?.unit ?? "";
  const urgent = need.pct < 0.4;
  const lowStock = need.item && need.item.stock <= need.item.reorder_level;

  return (
    <div className={cx("flex h-[68px] items-center border-b border-line px-5 last:border-b-0", active && "bg-tint")}>
      <div className="flex w-[200px] shrink-0 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold">{t(need.item?.name ?? "Deleted item")}</span>
        <span className={cx("truncate text-xs", lowStock ? "text-alert" : "text-muted")}>{need.item ? t("{category} · {quantity} in stock", { category: t(need.item.category), quantity: qty(need.item.stock, unit) }) : ""}</span>
      </div>
      <span className="flex w-20 shrink-0">
        <PriorityPill priority={need.priority} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pe-5">
        <Vessel fulfilled={need.fulfilled_quantity} reserved={need.reserved} required={need.required_quantity} />
        <span className="truncate whitespace-nowrap font-mono text-xs text-muted">
          {fmt(need.fulfilled_quantity)} / {qty(need.required_quantity, unit)}
          {need.reserved > 0 && ` · +${fmt(need.reserved)}`}
          <span className={cx(urgent && need.priority === "High" && "font-semibold text-alert")}> · {t("{count} left", { count: fmt(need.remaining) })}</span>
        </span>
      </div>
      <span className={cx("w-[60px] shrink-0 text-end text-xl font-bold tracking-[-0.02em]", levelText(need.pct))}>{pct(need.pct)}</span>
      <span className="flex w-[166px] shrink-0 justify-end gap-1.5">
        {isCoordinator && (
          <>
            <Button
              size="sm"
              variant={urgent && need.priority === "High" ? "primary" : "secondary"}
              disabled={closed || need.remaining === 0}
              onClick={onDispatch}
            >
              {t("Dispatch")}
            </Button>
            <IconButton label={t("Edit need")} onClick={onEdit} disabled={closed}>
              <EditIcon />
            </IconButton>
            <IconButton
              label={t("Remove need")}
              tone="alert"
              onClick={() => {
                if (confirm(t("Remove the {name} need?", { name: t(need.item?.name ?? "Deleted item") }))) void run(remove({ id: need._id }), t("Need removed"));
              }}
            >
              <CloseIcon />
            </IconButton>
          </>
        )}
      </span>
    </div>
  );
}

function NeedForm({ campId, campName, need, existing, onDone }: { campId: Id<"camps">; campName: string; need: NeedRow | null; existing: NeedRow[]; onDone: () => void }) {
  const { t } = useI18n();
  const items = useQuery(api.inventory.list);
  const create = useMutation(api.needs.create);
  const update = useMutation(api.needs.update);
  const run = useRun();
  const [itemId, setItemId] = useState<string>(need?.inventory_item_id ?? "");
  const [required, setRequired] = useState(need ? String(need.required_quantity) : "");
  const [priority, setPriority] = useState<Priority>(need?.priority ?? "High");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const taken = new Set(existing.filter((n) => n._id !== need?._id).map((n) => n.inventory_item_id as string));
  const item = items?.find((i) => i._id === itemId);
  const reqNum = Number(required);
  const floor = need ? need.fulfilled_quantity + need.reserved : 0;
  const errors = {
    item: !itemId ? t("Choose an inventory item") : null,
    required:
      !required || !Number.isInteger(reqNum) || reqNum < 1
        ? t("Enter a whole number of at least 1")
        : reqNum < floor
          ? t("Can't go below {count}: that much is delivered or on the way", { count: fmt(floor) })
          : null,
  };
  const valid = !errors.item && !errors.required;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const ok = need
      ? await run(update({ id: need._id, required_quantity: reqNum, priority }), t("Need updated"))
      : await run(create({ camp_id: campId, inventory_item_id: itemId as Id<"inventory">, required_quantity: reqNum, priority }), t("Need added to {name}", { name: campName }));
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={need ? t("Edit need") : t("New need · {name}", { name: campName })} title={t(need ? (need.item?.name ?? "Need") : "Add a need")} onClose={onDone} />
        <Field label={t("Inventory item")} error={touched ? errors.item : null} hint={item ? t("{category} · {quantity} in stock", { category: t(item.category), quantity: qty(item.stock, item.unit) }) : undefined}>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={!!need} invalid={touched && !!errors.item}>
            <option value="">{t("Choose an item…")}</option>
            {items?.map((i) => (
              <option key={i._id} value={i._id} disabled={taken.has(i._id)}>
                {t("{name} ({unit})", { name: t(i.name), unit: t(i.unit) })}{taken.has(i._id) ? ` · ${t("already a need here")}` : i.lowStock ? ` · ${t("low stock")}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={item ? t("Required quantity ({unit})", { unit: t(item.unit) }) : t("Required quantity")} error={touched ? errors.required : null}>
          <Input type="number" min={1} step={1} value={required} onChange={(e) => setRequired(e.target.value)} invalid={touched && !!errors.required} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">{t("Priority")}</span>
          <Segmented value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: t(p) }))} />
        </div>
        {item && !need && reqNum > item.stock && valid && (
          <Notice tone="warning">{t("The warehouse holds only {quantity}. The need is saved, but dispatches will be capped by stock.", { quantity: qty(item.stock, item.unit) })}</Notice>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {t(busy ? "Saving…" : "Save need")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
