import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { ReferenceLine } from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { EvilRadialChart } from "@/components/evilcharts/charts/recharts-radial-chart";
import { byDay, ChartCard, LegendDots, lastDays, PALETTE, series, STATUS_COLORS } from "../components/charts";
import ReliefMap, { MapKey } from "../components/ReliefMap";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  DispatchPill,
  Loading,
  Meter,
  Notice,
  ratioColor,
  Section,
  Stat,
  StatStrip,
  TableHead,
  Vessel,
  cx,
} from "../components/ui";
import { fmt, levelText, pct, qty } from "../lib/format";
import { useViewer } from "../lib/viewer";

type Overview = FunctionReturnType<typeof api.dashboard.overview>;

const numberWords = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const spell = (n: number) => numberWords[n] ?? fmt(n);

const Icon = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Overview() {
  const data = useQuery(api.dashboard.overview);
  if (!data) return <Loading />;
  if (data.counts.camps === 0) {
    return (
      <Card className="flex flex-col gap-4 p-8">
        <h1 className="display text-3xl">No data yet</h1>
        <p className="text-ink-2">
          Seed the demo dataset with <code className="font-mono text-sm">npx convex run seed:run</code>, or start by adding a camp.
        </p>
        <Link to="/camps" className="w-fit text-sm font-semibold underline underline-offset-4">
          Go to camps
        </Link>
      </Card>
    );
  }
  return (
    <>
      <Hero data={data} />
      <Metrics data={data} />
      <MapRow data={data} />
      <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-6">
        <GapsSection data={data} />
        <CategorySection data={data} />
      </div>
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-6">
        <ActivitySection />
        <PipelineSection data={data} />
        <ReorderSection data={data} />
      </div>
    </>
  );
}

function Hero({ data }: { data: Overview }) {
  const { kpis } = data;
  const worst = [...data.byCategory].filter((c) => c.pct != null).sort((a, b) => a.pct! - b.pct!)[0];
  const top = data.criticalGaps[0];
  const updated = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="rise flex flex-col gap-5">
      <div className="flex items-end justify-between gap-10">
        <div className="flex flex-col gap-2">
          <div className="label">Situation report · updated {updated}</div>
          <h1 className="display text-[34px] leading-10">
            {fmt(kpis.families)} families sheltered in {spell(kpis.activeCamps)} camps.
          </h1>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link to="/warehouse">
            <Button variant="secondary">Check stock</Button>
          </Link>
          <Link to="/needs">
            <Button>Review critical needs</Button>
          </Link>
        </div>
      </div>
      {top ? (
        <Notice tone="error">
          <span className="font-semibold">
            {data.criticalGaps.length} high-priority {data.criticalGaps.length === 1 ? "need is" : "needs are"} under the 40% line.
          </span>{" "}
          The worst is {top.itemName.toLowerCase()} at {top.campName}, {top.district}: {fmt(top.fulfilled)} of {qty(top.required, top.unit)} delivered.
          {worst && worst.pct! < 0.4 && ` ${worst.category} supply overall is ${pct(worst.pct)} met.`}
        </Notice>
      ) : (
        <Notice tone="success">No high-priority need is below the 40% line right now.</Notice>
      )}
    </section>
  );
}

function Metrics({ data }: { data: Overview }) {
  const { kpis } = data;
  const lowNames = data.lowStock
    .slice(0, 3)
    .map((i) => i.name.split(" ")[0])
    .join(", ");
  const occupancy = kpis.openCapacity ? kpis.families / kpis.openCapacity : 0;
  return (
    <StatStrip>
      <Stat
        label="Active camps"
        icon={<Icon d="M3 20h18M5 20l7-15 7 15" />}
        value={kpis.activeCamps}
        unit={`/ ${kpis.totalCamps}`}
        sub={`${kpis.fullCamps} full · ${kpis.closedCamps} closed`}
      />
      <Stat
        label="Families sheltered"
        icon={<Icon d="M3 12l9-8 9 8M5 10v10h14V10" />}
        tone="info"
        value={fmt(kpis.families)}
        badge={<Badge tone={occupancy > 0.9 ? "warning" : "info"}>{pct(occupancy)} full</Badge>}
        sub={`of ${fmt(kpis.openCapacity)} open capacity`}
      />
      <Stat
        label="Needs fulfilled"
        icon={<Icon d="M20 6L9 17l-5-5" />}
        tone={kpis.fulfilment < 0.4 ? "alert" : kpis.fulfilment < 0.7 ? "warn" : "ok"}
        value={Math.round(kpis.fulfilment * 100)}
        unit="%"
        badge={<Badge tone="danger">{data.criticalGaps.length} critical</Badge>}
        sub="delivered ÷ required, all needs"
      />
      <Stat
        label="Low-stock items"
        icon={<Icon d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" />}
        tone={kpis.lowStockCount ? "warn" : "ok"}
        value={kpis.lowStockCount}
        unit={`/ ${kpis.itemCount}`}
        sub={lowNames || "all above reorder level"}
      />
      <Stat
        label="Volunteers deployed"
        icon={<Icon d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0" />}
        tone="ok"
        value={kpis.volunteersDeployed}
        unit={`/ ${kpis.volunteersTotal}`}
        sub={`${kpis.volunteersTotal - kpis.volunteersDeployed} awaiting a camp`}
      />
    </StatStrip>
  );
}

function MapRow({ data }: { data: Overview }) {
  const navigate = useNavigate();
  const { isCoordinator } = useViewer();
  const defaultId = useMemo(() => {
    const ranked = [...data.camps].filter((c) => c.status !== "Closed" && c.needsMet != null).sort((a, b) => a.needsMet! - b.needsMet!);
    return ranked[0]?._id ?? null;
  }, [data.camps]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.camps.find((c) => c._id === (selectedId ?? defaultId));
  const met = Math.round((selected?.needsMet ?? 0) * 100);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
      <Card className="flex flex-col">
        <CardHeader
          title="Camps across Sindh"
          sub="Pin size shows families sheltered. Dashed lines are open dispatches from the nearest depot."
          right={<Badge tone="info">{data.routes.length} open routes</Badge>}
        />
        <ReliefMap camps={data.camps} routes={data.routes} selectedId={selected?._id ?? null} onSelect={setSelectedId} height={440} />
        <CardFooter>
          <MapKey />
        </CardFooter>
      </Card>

      {selected && (
        <Card className="flex flex-col">
          <CardHeader
            title={selected.name}
            sub={`${selected.district} · ${selected.volunteers} volunteers`}
            right={selected.criticalGaps > 0 ? <Badge tone="danger">{selected.criticalGaps} critical</Badge> : <Badge tone="success">Stable</Badge>}
          />
          <div className="flex flex-1 flex-col gap-5 p-5">
            <div className="relative h-[150px]">
              <EvilRadialChart
                data={[{ name: "met", value: met }]}
                nameKey="name"
                config={{ met: series("Needs met", ratioColor(selected.needsMet)) }}
                variant="semi"
                max={100}
                innerRadius={82}
                outerRadius={98}
                className="aspect-auto h-[150px]"
              >
                <EvilRadialChart.RadialBar dataKey="value" barSize={16} cornerRadius={8} />
              </EvilRadialChart>
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
                <span className={cx("text-[34px] font-bold leading-9 tracking-[-0.03em]", levelText(selected.needsMet))}>{pct(selected.needsMet)}</span>
                <span className="text-xs text-muted">needs met</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-tint p-3">
                <div className="text-xs text-muted">Families</div>
                <div className="text-lg font-bold">
                  {fmt(selected.families)} <span className="text-sm font-medium text-muted">/ {fmt(selected.capacity)}</span>
                </div>
                <div className="mt-2">
                  <Meter ratio={selected.capacity ? selected.families / selected.capacity : 0} color={PALETTE.info} />
                </div>
              </div>
              <div className="rounded-lg bg-tint p-3">
                <div className="text-xs text-muted">Status</div>
                <div className="text-lg font-bold">{selected.status}</div>
                <div className="mt-1 text-xs text-muted">{selected.volunteers} on site</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">Weakest needs</span>
              {selected.worstNeeds.map((n) => (
                <div key={n.itemName} className="grid grid-cols-[1fr_100px_40px] items-center gap-3 text-[13px]">
                  <span className="truncate font-medium">{n.itemName}</span>
                  <Meter ratio={n.pct} color={ratioColor(n.pct)} />
                  <span className={cx("text-right font-mono text-xs font-semibold", levelText(n.pct))}>{pct(n.pct)}</span>
                </div>
              ))}
              {selected.worstNeeds.length === 0 && <span className="text-[13px] text-muted">No needs recorded.</span>}
            </div>
            <div className="mt-auto flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/camps/${selected._id}`)}>
                Open camp
              </Button>
              {isCoordinator && selected.status !== "Closed" && (
                <Button size="sm" className="flex-1" onClick={() => navigate(`/dispatches?camp=${selected._id}`)}>
                  Dispatch here
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function GapsSection({ data }: { data: Overview }) {
  const navigate = useNavigate();
  const { isCoordinator } = useViewer();
  return (
    <Section
      title={
        <>
          Critical gaps <Badge tone="danger">{data.criticalGaps.length}</Badge>
        </>
      }
      sub="High priority and under 40% delivered, worst first"
      right={
        <Link to="/needs" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
          All {data.counts.needs} needs →
        </Link>
      }
    >
      <TableHead>
        <span className="w-10 shrink-0">#</span>
        <span className="flex-1">Need · camp</span>
        <span className="w-[220px] shrink-0">Delivered</span>
        <span className="w-[64px] shrink-0 text-right">Met</span>
        <span className="w-[112px] shrink-0" />
      </TableHead>
      {data.criticalGaps.length === 0 && <p className="py-10 text-center text-sm text-muted">Every high-priority need is above 40%.</p>}
      {data.criticalGaps.slice(0, 5).map((g, i) => (
        <div key={g._id} className="group flex h-[68px] items-center border-b border-line px-5 last:border-b-0 hover:bg-tint/70">
          <span className="w-10 shrink-0">
            <span className={cx("grid size-6 place-items-center rounded-md font-mono text-xs font-semibold", i === 0 ? "bg-alert text-white" : "bg-alert-wash text-alert-ink")}>{i + 1}</span>
          </span>
          <Link to={`/camps/${g.campId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold group-hover:underline">{g.itemName}</span>
            <span className="truncate text-[13px] text-muted">
              {g.campName} · {g.district}
            </span>
          </Link>
          <div className="flex w-[220px] shrink-0 flex-col gap-1.5 pr-6">
            <Vessel fulfilled={g.fulfilled} reserved={g.reserved} required={g.required} />
            <span className="whitespace-nowrap font-mono text-[11px] text-muted">
              {fmt(g.fulfilled)} / {qty(g.required, g.unit)}
              {g.reserved > 0 && ` · +${fmt(g.reserved)} en route`}
            </span>
          </div>
          <span className="w-[64px] shrink-0 text-right text-xl font-bold tracking-[-0.02em] text-alert">{pct(g.pct)}</span>
          <div className="flex w-[112px] shrink-0 justify-end">
            {isCoordinator ? (
              <Button size="sm" variant={i === 0 ? "primary" : "secondary"} onClick={() => navigate(`/dispatches?camp=${g.campId}&need=${g._id}`)}>
                Dispatch
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/camps/${g.campId}`)}>
                Open camp
              </Button>
            )}
          </div>
        </div>
      ))}
    </Section>
  );
}

function CategorySection({ data }: { data: Overview }) {
  const rows = data.byCategory.map((c) => {
    const met = c.pct == null ? 0 : Math.round(c.pct * 100);
    return {
      category: c.category,
      critical: met < 40 ? met : 0,
      watch: met >= 40 && met < 70 ? met : 0,
      ok: met >= 70 ? met : 0,
      left: 100 - met,
      met,
      needs: c.needs,
    };
  });
  const config = {
    critical: series("Under 40%", PALETTE.alert),
    watch: series("40–70%", PALETTE.warn),
    ok: series("70% or more", PALETTE.ok),
    left: series("Still short", "#eceee9"),
  };
  return (
    <ChartCard
      title="Fulfilment by category"
      sub="Average delivered ÷ required across all camps"
      footer={
        <CardFooter>
          <span className="flex items-center gap-2 text-muted">
            <span className="h-3 border-l-2 border-dashed border-alert" /> 40% critical line
          </span>
          <span className="font-mono text-xs text-muted">{data.byCategory.reduce((s, c) => s + c.needs, 0)} needs</span>
        </CardFooter>
      }
    >
      <div className="relative min-h-[220px] flex-1">
        <div className="absolute inset-0">
          <EvilBarChart data={rows} config={config} layout="horizontal" stackType="stacked" barRadius={4} className="aspect-auto h-full">
            <EvilBarChart.Grid horizontal={false} vertical />
            <EvilBarChart.XAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} tickFormatter={(v: number) => `${v}%`} />
            <EvilBarChart.YAxis dataKey="category" width={70} />
            <EvilBarChart.Tooltip roundness="md" />
            <ReferenceLine x={40} stroke={PALETTE.alert} strokeDasharray="4 3" strokeWidth={1.5} ifOverflow="extendDomain" />
            <EvilBarChart.Bar dataKey="critical" />
            <EvilBarChart.Bar dataKey="watch" />
            <EvilBarChart.Bar dataKey="ok" />
            <EvilBarChart.Bar dataKey="left" />
          </EvilBarChart>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 pt-2">
        {rows.map((r) => (
          <div key={r.category} className="flex flex-col items-center gap-0.5 rounded-md bg-tint py-1.5">
            <span className={cx("font-mono text-xs font-semibold", levelText(r.met / 100))}>{r.met}%</span>
            <span className="text-[11px] text-muted">{r.category}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function ActivitySection() {
  const dispatches = useQuery(api.dispatches.list);
  const days = useMemo(() => lastDays(10), []);
  const rows = useMemo(() => {
    const list = dispatches ?? [];
    const of = (s: string) => byDay(list.filter((d) => d.status === s), days);
    const delivered = of("Delivered");
    const transit = of("In Transit");
    const pending = of("Pending");
    const cancelled = of("Cancelled");
    return days.map((d, i) => ({ day: d.label, delivered: delivered[i], transit: transit[i], pending: pending[i], cancelled: cancelled[i] }));
  }, [dispatches, days]);
  const config = {
    delivered: series("Delivered", STATUS_COLORS.Delivered),
    transit: series("In transit", STATUS_COLORS["In Transit"]),
    pending: series("Pending", STATUS_COLORS.Pending),
    cancelled: series("Cancelled", STATUS_COLORS.Cancelled),
  };
  return (
    <ChartCard title="Dispatch activity" sub="Dispatches created per day, last 10 days, by current status">
      <EvilBarChart data={rows} config={config} stackType="stacked" barRadius={3} isLoading={!dispatches} className="aspect-auto h-[250px]">
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
  );
}

function PipelineSection({ data }: { data: Overview }) {
  const c = data.dispatchCounts;
  const slices = [
    { status: "Pending", count: c.Pending, color: STATUS_COLORS.Pending },
    { status: "InTransit", label: "In transit", count: c["In Transit"], color: STATUS_COLORS["In Transit"] },
    { status: "Delivered", count: c.Delivered, color: STATUS_COLORS.Delivered },
    { status: "Cancelled", count: c.Cancelled, color: STATUS_COLORS.Cancelled },
  ];
  const config = Object.fromEntries(slices.map((s) => [s.status, series(s.label ?? s.status, s.color)]));
  return (
    <ChartCard
      title="Dispatch pipeline"
      sub={`${fmt(data.reservedUnits)} units reserved by open dispatches`}
      footer={
        <CardFooter>
          <span className="text-muted">Latest: {data.recent[0] ? `${data.recent[0].itemName} → ${data.recent[0].campName.split(" ")[0]}` : "none"}</span>
          {data.recent[0] && <DispatchPill status={data.recent[0].status} />}
        </CardFooter>
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative h-[180px] w-[180px] flex-none">
          <EvilPieChart data={slices.filter((s) => s.count > 0)} dataKey="count" nameKey="status" config={config} className="aspect-square h-[180px]">
            <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
            <EvilPieChart.Tooltip roundness="md" />
          </EvilPieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{data.dispatchTotal}</span>
            <span className="text-xs text-muted">dispatches</span>
          </div>
        </div>
        <div className="flex-1">
          <LegendDots items={slices.map((s) => ({ label: s.label ?? s.status, color: s.color, value: s.count }))} />
        </div>
      </div>
    </ChartCard>
  );
}

function ReorderSection({ data }: { data: Overview }) {
  return (
    <Section
      title={
        <>
          Below reorder level <Badge tone="warning">{data.lowStock.length}</Badge>
        </>
      }
      sub={`${data.okStockCount} items above reorder level`}
      right={
        <Link to="/warehouse" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
          Warehouse →
        </Link>
      }
    >
      {data.lowStock.length === 0 && <p className="py-8 text-center text-sm text-muted">Everything is above its reorder level.</p>}
      {data.lowStock.map((i) => (
        <div key={i._id} className="flex flex-col gap-2 border-b border-line px-5 py-3.5 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{i.name}</span>
              <span className="text-xs text-muted">
                {i.category} · {i.unit}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold leading-6 text-alert">{fmt(i.stock)}</span>
              <span className="whitespace-nowrap font-mono text-[11px] text-muted">reorder at {fmt(i.reorder)}</span>
            </div>
          </div>
          <Meter ratio={i.reorder ? i.stock / i.reorder : 0} color={i.stock / Math.max(1, i.reorder) < 0.5 ? PALETTE.alert : PALETTE.warn} />
        </div>
      ))}
    </Section>
  );
}
