import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
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

type CampData = NonNullable<FunctionReturnType<typeof api.camps.get>>;
type NeedRow = CampData["needs"][number];

export default function CampDetail() {
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
        <h1 className="display text-3xl">Camp not found</h1>
        <Link to="/camps" className="w-fit text-sm font-semibold text-muted hover:text-ink">
          Back to camps
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
              Camps
            </Link>
            <span>/</span>
            <span className="text-ink">{camp.district}</span>
            {data.criticalGaps > 0 && (
              <Badge tone="danger">
                {data.criticalGaps} critical gap{data.criticalGaps > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <h1 className="display text-[32px] leading-[38px]">{camp.name}</h1>
          <div className="flex items-center gap-3 text-[15px] text-ink-2">
            <CampStatusPill status={camp.status} />
            {fmt(camp.current_families)} of {fmt(camp.capacity)} families · {data.volunteers.length} volunteers on site
          </div>
        </div>
        {isCoordinator && !closed && (
          <Button onClick={() => setEditing("new")}>
            <PlusIcon /> Add need
          </Button>
        )}
      </header>

      <StatStrip cols={4}>
        <Stat label="Families" tone="info" value={fmt(camp.current_families)} unit={`/ ${fmt(camp.capacity)}`} sub={`${pct(camp.capacity ? camp.current_families / camp.capacity : 0)} of capacity`} />
        <Stat
          label="Needs met"
          value={pct(data.needsMet)}
          tone={data.needsMet == null ? undefined : data.needsMet < 0.4 ? "alert" : data.needsMet < 0.7 ? "warn" : "ok"}
          sub="average across this camp's needs"
        />
        <Stat label="Critical gaps" value={String(data.criticalGaps)} unit={`of ${needs.length} needs`} tone={data.criticalGaps ? "alert" : "ok"} sub="High priority under 40%" />
        <Stat label="Open dispatches" value={String(data.openDispatches)} sub={`${fmt(data.reservedUnits)} units reserved`} last />
      </StatStrip>

      {closed && <Notice tone="info">This camp is closed. It can't take new needs, dispatches or volunteers.</Notice>}

      <CampCharts data={data} />

      <div className="flex items-start gap-6">
        <Section
          className="flex-1"
          title="Needs"
          sub="Delivered ÷ required. Lighter bar = reserved by open dispatches."
          right={
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[{ value: "All", label: `All ${needs.length}` }, ...PRIORITIES.map((p) => ({ value: p, label: `${p} ${count(p)}` }))]}
            />
          }
        >
          <TableHead ruled={false}>
            <span className="w-[200px] shrink-0">Item · stock</span>
            <span className="w-20 shrink-0">Priority</span>
            <span className="flex-1">Delivered · +reserved</span>
            <span className="w-[60px] shrink-0 text-right">Met</span>
            <span className="w-[166px] shrink-0" />
          </TableHead>
          {shown.length === 0 ? (
            <Empty>{needs.length === 0 ? "No needs recorded for this camp yet." : "No needs at this priority."}</Empty>
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
            title="Volunteers on site"
            right={
              isCoordinator && !closed ? (
                <Link to="/volunteers" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
                  Assign
                </Link>
              ) : undefined
            }
          >
            {data.volunteers.length === 0 ? (
              <Empty>No volunteers assigned.</Empty>
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
          <Section size="md" title="Dispatch history" right={<span className="text-[13px] text-muted">{data.dispatches.length} total</span>}>
            {data.dispatches.length === 0 ? (
              <Empty>No dispatches yet.</Empty>
            ) : (
              data.dispatches.map((d) => (
                <div key={d._id} className="flex flex-col gap-1 border-b border-line px-5 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">
                      {d.itemName} × {qty(d.quantity, d.unit)}
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
    return { item: n.item?.name ?? "Item", delivered, reserved, short: Math.max(0, 100 - delivered - reserved) };
  });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
      <ChartCard title="Needs progress" sub="Share of each requirement delivered, en route and still short">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No needs recorded yet.</p>
        ) : (
          <div style={{ height: Math.max(160, rows.length * 44 + 50) }}>
          <EvilBarChart
            data={rows}
            config={{
              delivered: series("Delivered %", PALETTE.ok),
              reserved: series("En route %", PALETTE.infoSoft),
              short: series("Short %", PALETTE.alertSoft),
            }}
            layout="horizontal"
            stackType="stacked"
            barRadius={3}
            className="aspect-auto h-full"
          >
            <EvilBarChart.Grid horizontal={false} vertical />
            <EvilBarChart.XAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
            <EvilBarChart.YAxis dataKey="item" width={110} />
            <EvilBarChart.Tooltip roundness="md" />
            <EvilBarChart.Legend variant="rounded-square" align="left" />
            <EvilBarChart.Bar dataKey="delivered" />
            <EvilBarChart.Bar dataKey="reserved" />
            <EvilBarChart.Bar dataKey="short" />
          </EvilBarChart>
          </div>
        )}
      </ChartCard>
      <Card className="flex flex-col">
        <CardHeader title="Location" sub={`${data.camp.district} district`} />
        <ReliefMap camps={mapCamp} focusId={data.camp._id} selectedId={data.camp._id} height={Math.max(240, rows.length * 44 + 80)} />
      </Card>
    </div>
  );
}

function NeedLine({ need, closed, onEdit, onDispatch, active }: { need: NeedRow; closed: boolean; onEdit: () => void; onDispatch: () => void; active: boolean }) {
  const { isCoordinator } = useViewer();
  const remove = useMutation(api.needs.remove);
  const run = useRun();
  const unit = need.item?.unit ?? "";
  const urgent = need.pct < 0.4;
  const lowStock = need.item && need.item.stock <= need.item.reorder_level;

  return (
    <div className={cx("flex h-[68px] items-center border-b border-line px-5 last:border-b-0", active && "bg-tint")}>
      <div className="flex w-[200px] shrink-0 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold">{need.item?.name ?? "Deleted item"}</span>
        <span className={cx("truncate text-xs", lowStock ? "text-alert" : "text-muted")}>{need.item ? `${need.item.category} · ${qty(need.item.stock, unit)} in stock` : ""}</span>
      </div>
      <span className="flex w-20 shrink-0">
        <PriorityPill priority={need.priority} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-5">
        <Vessel fulfilled={need.fulfilled_quantity} reserved={need.reserved} required={need.required_quantity} />
        <span className="truncate whitespace-nowrap font-mono text-xs text-muted">
          {fmt(need.fulfilled_quantity)} / {qty(need.required_quantity, unit)}
          {need.reserved > 0 && ` · +${fmt(need.reserved)}`}
          <span className={cx(urgent && need.priority === "High" && "font-semibold text-alert")}> · {fmt(need.remaining)} left</span>
        </span>
      </div>
      <span className={cx("w-[60px] shrink-0 text-right text-xl font-bold tracking-[-0.02em]", levelText(need.pct))}>{pct(need.pct)}</span>
      <span className="flex w-[166px] shrink-0 justify-end gap-1.5">
        {isCoordinator && (
          <>
            <Button
              size="sm"
              variant={urgent && need.priority === "High" ? "primary" : "secondary"}
              disabled={closed || need.remaining === 0}
              onClick={onDispatch}
            >
              Dispatch
            </Button>
            <IconButton label="Edit need" onClick={onEdit} disabled={closed}>
              <EditIcon />
            </IconButton>
            <IconButton
              label="Remove need"
              tone="alert"
              onClick={() => {
                if (confirm(`Remove the ${need.item?.name ?? ""} need?`)) void run(remove({ id: need._id }), "Need removed");
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
    item: !itemId ? "Choose an inventory item" : null,
    required:
      !required || !Number.isInteger(reqNum) || reqNum < 1
        ? "Enter a whole number of at least 1"
        : reqNum < floor
          ? `Can't go below ${floor}: that much is delivered or on the way`
          : null,
  };
  const valid = !errors.item && !errors.required;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const ok = need
      ? await run(update({ id: need._id, required_quantity: reqNum, priority }), "Need updated")
      : await run(create({ camp_id: campId, inventory_item_id: itemId as Id<"inventory">, required_quantity: reqNum, priority }), `Need added to ${campName}`);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={need ? "Edit need" : `New need · ${campName}`} title={need ? (need.item?.name ?? "Need") : "Add a need"} onClose={onDone} />
        <Field label="Inventory item" error={touched ? errors.item : null} hint={item ? `${item.category} · ${qty(item.stock, item.unit)} in stock` : undefined}>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={!!need} invalid={touched && !!errors.item}>
            <option value="">Choose an item…</option>
            {items?.map((i) => (
              <option key={i._id} value={i._id} disabled={taken.has(i._id)}>
                {i.name} ({i.unit}){taken.has(i._id) ? " · already a need here" : i.lowStock ? " · low stock" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Required quantity${item ? ` (${item.unit})` : ""}`} error={touched ? errors.required : null}>
          <Input type="number" min={1} step={1} value={required} onChange={(e) => setRequired(e.target.value)} invalid={touched && !!errors.required} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">Priority</span>
          <Segmented value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
        </div>
        {item && !need && reqNum > item.stock && valid && (
          <Notice tone="warning">The warehouse holds only {qty(item.stock, item.unit)}. The need is saved, but dispatches will be capped by stock.</Notice>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {busy ? "Saving…" : "Save need"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
