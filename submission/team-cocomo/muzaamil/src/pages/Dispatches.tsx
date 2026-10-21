import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useRun } from "../components/toast";
import { DispatchModal } from "../components/DispatchModal";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { byDay, ChartCard, compact, lastDays, series, STATUS_COLORS } from "../components/charts";
import { Badge, Button, Card, DispatchPill, Empty, Loading, PageHeader, Row, Segmented, Select, Stat, StatStrip, TableHead, Toolbar, cx } from "../components/ui";
import { fmt, qty, stamp } from "../lib/format";
import { useViewer } from "../lib/viewer";

type Status = "Pending" | "In Transit" | "Delivered" | "Cancelled";
const STATUSES: Status[] = ["Pending", "In Transit", "Delivered", "Cancelled"];

export default function Dispatches() {
  const dispatches = useQuery(api.dispatches.list);
  const camps = useQuery(api.camps.list);
  const { isCoordinator } = useViewer();
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [campFilter, setCampFilter] = useState("All");
  // The dialog is URL-driven so "Dispatch" links elsewhere (?camp=&need=) and the header button (?new) open it here.
  const [params, setParams] = useSearchParams();
  const creating = isCoordinator && (params.has("new") || params.has("camp"));

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: 0, Pending: 0, "In Transit": 0, Delivered: 0, Cancelled: 0 };
    for (const d of dispatches ?? []) {
      c.All++;
      c[d.status]++;
    }
    return c;
  }, [dispatches]);

  const deliveredUnits = (dispatches ?? []).filter((d) => d.status === "Delivered").reduce((s, d) => s + d.quantity, 0);
  const rows = (dispatches ?? []).filter((d) => (filter === "All" || d.status === filter) && (campFilter === "All" || d.camp_id === campFilter));

  return (
    <>
      <PageHeader
        kicker="Dispatches · stock is reserved when a dispatch is created"
        title={
          <>
            {counts.All} dispatches. {counts["In Transit"] > 0 ? <span className="text-info-ink">{counts["In Transit"]} on the road.</span> : "None on the road."}
          </>
        }
      />

      <StatStrip cols={4}>
        <Stat label="Pending" value={counts.Pending} sub="Stock reserved, awaiting pickup" badge={<Badge tone="neutral" dot>Queued</Badge>} />
        <Stat label="In transit" value={counts["In Transit"]} tone="info" sub="Trucks on the road now" badge={<Badge tone="info" dot>Live</Badge>} />
        <Stat label="Delivered" value={counts.Delivered} tone="ok" sub={`${fmt(deliveredUnits)} units received at camps`} badge={<Badge tone="success" dot>Done</Badge>} />
        <Stat label="Cancelled" value={counts.Cancelled} tone={counts.Cancelled ? "alert" : undefined} sub="Stock returned to warehouse" badge={<Badge tone="danger" dot>Void</Badge>} />
      </StatStrip>

      {dispatches && <DispatchCharts dispatches={dispatches} />}

      <Card>
        <Toolbar>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[{ value: "All" as const, label: `All ${counts.All}` }, ...STATUSES.map((s) => ({ value: s, label: `${s} ${counts[s]}` }))]}
          />
          <div className="w-52">
            <Select value={campFilter} onChange={(e) => setCampFilter(e.target.value)} className="h-[38px] text-[13px] font-semibold">
              <option value="All">All camps</option>
              {camps?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </Toolbar>
        <TableHead>
          <span className="flex-1">Item · camp</span>
          <span className="w-[100px] shrink-0">Created</span>
          <span className="w-[100px] shrink-0">Status</span>
          <span className="w-[230px] shrink-0 text-right">Next step</span>
        </TableHead>
        {!dispatches ? <Loading /> : rows.length === 0 ? <Empty>No dispatches here.</Empty> : rows.map((d) => <DispatchRow key={d._id} d={d} />)}
      </Card>

      {creating && <DispatchModal campId={params.get("camp") ?? undefined} needId={params.get("need") ?? undefined} onClose={() => setParams({}, { replace: true })} />}
    </>
  );
}

function DispatchRow({
  d,
}: {
  d: { _id: Id<"dispatches">; status: Status; quantity: number; unit: string; itemName: string; campName: string; district: string; created_at: number };
}) {
  const { isCoordinator } = useViewer();
  const run = useRun();
  const toTransit = useMutation(api.dispatches.markInTransit);
  const toDelivered = useMutation(api.dispatches.markDelivered);
  const cancel = useMutation(api.dispatches.cancel);
  const [busy, setBusy] = useState(false);
  const act = async (work: Promise<unknown>, msg: string) => {
    setBusy(true);
    await run(work, msg);
    setBusy(false);
  };
  const done = d.status === "Delivered" || d.status === "Cancelled";

  return (
    <Row className="h-[60px]">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cx("truncate text-[15px]", done ? "font-medium" : "font-semibold", d.status === "Cancelled" && "text-faint")}>
          {d.itemName} × {qty(d.quantity, d.unit)}
        </span>
        <span className="truncate text-xs text-muted">
          {d.campName} · {d.district}
        </span>
      </span>
      <span className="w-[100px] shrink-0 font-mono text-[11px] text-muted">{stamp(d.created_at)}</span>
      <span className="flex w-[100px] shrink-0">
        <DispatchPill status={d.status} />
      </span>
      <span className="flex w-[230px] shrink-0 items-center justify-end gap-1.5">
        {d.status === "Pending" && isCoordinator && (
          <Button size="sm" disabled={busy} onClick={() => act(toTransit({ id: d._id }), "Marked in transit")}>
            Mark in transit
          </Button>
        )}
        {d.status === "In Transit" && (
          <Button size="sm" disabled={busy} onClick={() => act(toDelivered({ id: d._id }), `Delivered · fulfilment +${fmt(d.quantity)} ${d.unit}`)}>
            Mark delivered
          </Button>
        )}
        {!done && isCoordinator && (
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (confirm(`Cancel this dispatch? ${qty(d.quantity, d.unit)} of ${d.itemName} goes back to the warehouse.`)) {
                void act(cancel({ id: d._id }), `Cancelled · ${qty(d.quantity, d.unit)} returned to stock`);
              }
            }}
          >
            Cancel
          </Button>
        )}
        {d.status === "Pending" && !isCoordinator && <span className="font-mono text-[11px] text-muted">awaiting pickup</span>}
        {d.status === "Delivered" && <span className="font-mono text-[11px] text-ok">fulfilment +{qty(d.quantity, d.unit)}</span>}
        {d.status === "Cancelled" && <span className="font-mono text-[11px] text-faint">returned to stock</span>}
      </span>
    </Row>
  );
}

type DispatchLite = { status: Status; quantity: number; campName: string; created_at: number };

function DispatchCharts({ dispatches }: { dispatches: DispatchLite[] }) {
  const days = useMemo(() => lastDays(14), []);
  const daily = useMemo(() => {
    const of = (s: Status) => byDay(dispatches.filter((d) => d.status === s), days);
    const [p, t, dl, c] = STATUSES.map(of);
    return days.map((d, i) => ({ day: d.label, pending: p[i], transit: t[i], delivered: dl[i], cancelled: c[i] }));
  }, [dispatches, days]);
  const byCamp = useMemo(() => {
    const m = new Map<string, { camp: string; delivered: number; open: number; total: number }>();
    for (const d of dispatches) {
      if (d.status === "Cancelled") continue;
      const camp = d.campName.split(" ")[0];
      const e = m.get(camp) ?? { camp, delivered: 0, open: 0, total: 0 };
      if (d.status === "Delivered") e.delivered += d.quantity;
      else e.open += d.quantity;
      e.total += d.quantity;
      m.set(camp, e);
    }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 8);
  }, [dispatches]);
  const config = {
    delivered: series("Delivered", STATUS_COLORS.Delivered),
    transit: series("In transit", STATUS_COLORS["In Transit"]),
    pending: series("Pending", STATUS_COLORS.Pending),
    cancelled: series("Cancelled", STATUS_COLORS.Cancelled),
  };
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
      <ChartCard title="Dispatches per day" sub="Created in the last 14 days, by current status">
        <EvilBarChart data={daily} config={config} stackType="stacked" barRadius={3} className="aspect-auto h-[240px]">
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="day" />
          <EvilBarChart.YAxis allowDecimals={false} width={24} />
          <EvilBarChart.Tooltip roundness="md" />
          <EvilBarChart.Legend variant="rounded-square" align="left" />
          <EvilBarChart.Bar dataKey="delivered" />
          <EvilBarChart.Bar dataKey="transit" />
          <EvilBarChart.Bar dataKey="pending" />
          <EvilBarChart.Bar dataKey="cancelled" />
        </EvilBarChart>
      </ChartCard>
      <ChartCard title="Units sent by camp" sub="Delivered vs still on the way, cancelled excluded">
        {byCamp.length === 0 ? (
          <Empty>No dispatches yet.</Empty>
        ) : (
          <EvilBarChart
            data={byCamp}
            config={{ delivered: series("Delivered", STATUS_COLORS.Delivered), open: series("Open", STATUS_COLORS["In Transit"]) }}
            layout="horizontal"
            stackType="stacked"
            barRadius={4}
            className="aspect-auto h-[240px]"
          >
            <EvilBarChart.Grid horizontal={false} vertical />
            <EvilBarChart.XAxis tickFormatter={(v: number) => compact(v)} />
            <EvilBarChart.YAxis dataKey="camp" width={80} />
            <EvilBarChart.Tooltip roundness="md" />
            <EvilBarChart.Legend variant="rounded-square" align="left" />
            <EvilBarChart.Bar dataKey="delivered" />
            <EvilBarChart.Bar dataKey="open" />
          </EvilBarChart>
        )}
      </ChartCard>
    </div>
  );
}
