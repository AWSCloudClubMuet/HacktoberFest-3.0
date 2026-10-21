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
import { fmt, levelText, pct, qty, unitLabel } from "../lib/format";
import { useViewer } from "../lib/viewer";
import { useI18n } from "../i18n";

type Overview = FunctionReturnType<typeof api.dashboard.overview>;

const Icon = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Overview() {
  const { t } = useI18n();
  const data = useQuery(api.dashboard.overview);
  if (!data) return <Loading />;
  if (data.counts.camps === 0) {
    return (
      <Card className="flex flex-col gap-4 p-8">
        <h1 className="display text-3xl">{t("No data yet")}</h1>
        <p className="text-ink-2">
          {t("Seed the demo dataset with {command}, or start by adding a camp.", { command: "npx convex run seed:run" })}
        </p>
        <Link to="/camps" className="w-fit text-sm font-semibold underline underline-offset-4">
          {t("Go to camps")}
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
  const { t, language } = useI18n();
  const { kpis } = data;
  const worst = [...data.byCategory].filter((c) => c.pct != null).sort((a, b) => a.pct! - b.pct!)[0];
  const top = data.criticalGaps[0];
  const updated = new Date().toLocaleTimeString(language === "en" ? "en-GB" : `${language}-PK`, { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="rise flex flex-col gap-5">
      <div className="flex items-end justify-between gap-10">
        <div className="flex flex-col gap-2">
          <div className="label">{t("Situation report · updated {time}", { time: updated })}</div>
          <h1 className="display text-[34px] leading-10">
            {t("{families} families sheltered in {camps} camps.", { families: fmt(kpis.families), camps: fmt(kpis.activeCamps) })}
          </h1>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link to="/warehouse">
            <Button variant="secondary">{t("Check stock")}</Button>
          </Link>
          <Link to="/needs">
            <Button>{t("Review critical needs")}</Button>
          </Link>
        </div>
      </div>
      {top ? (
        <Notice tone="error">
          <span className="font-semibold">
            {t(data.criticalGaps.length === 1 ? "{count} high-priority need is under the 40% line." : "{count} high-priority needs are under the 40% line.", { count: fmt(data.criticalGaps.length) })}
          </span>{" "}
          {t("The worst is {item} at {camp}, {district}: {fulfilled} of {required} delivered.", { item: t(top.itemName), camp: top.campName, district: top.district, fulfilled: fmt(top.fulfilled), required: qty(top.required, top.unit) })}
          {worst && worst.pct! < 0.4 && <> {t("{category} supply overall is {percent} met.", { category: t(worst.category), percent: pct(worst.pct) })}</>}
        </Notice>
      ) : (
        <Notice tone="success">{t("No high-priority need is below the 40% line right now.")}</Notice>
      )}
    </section>
  );
}

function Metrics({ data }: { data: Overview }) {
  const { t } = useI18n();
  const { kpis } = data;
  const lowNames = data.lowStock
    .slice(0, 3)
    .map((i) => t(i.name))
    .join(", ");
  const occupancy = kpis.openCapacity ? kpis.families / kpis.openCapacity : 0;
  return (
    <StatStrip>
      <Stat
        label={t("Active camps")}
        icon={<Icon d="M3 20h18M5 20l7-15 7 15" />}
        value={fmt(kpis.activeCamps)}
        unit={`/ ${fmt(kpis.totalCamps)}`}
        sub={t("{full} full · {closed} closed", { full: fmt(kpis.fullCamps), closed: fmt(kpis.closedCamps) })}
      />
      <Stat
        label={t("Families sheltered")}
        icon={<Icon d="M3 12l9-8 9 8M5 10v10h14V10" />}
        tone="info"
        value={fmt(kpis.families)}
        badge={<Badge tone={occupancy > 0.9 ? "warning" : "info"}>{t("{percent} full", { percent: pct(occupancy) })}</Badge>}
        sub={t("of {count} open capacity", { count: fmt(kpis.openCapacity) })}
      />
      <Stat
        label={t("Needs fulfilled")}
        icon={<Icon d="M20 6L9 17l-5-5" />}
        tone={kpis.fulfilment < 0.4 ? "alert" : kpis.fulfilment < 0.7 ? "warn" : "ok"}
        value={pct(kpis.fulfilment)}
        badge={<Badge tone="danger">{t("{count} critical", { count: fmt(data.criticalGaps.length) })}</Badge>}
        sub={t("delivered ÷ required, all needs")}
      />
      <Stat
        label={t("Low-stock items")}
        icon={<Icon d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" />}
        tone={kpis.lowStockCount ? "warn" : "ok"}
        value={fmt(kpis.lowStockCount)}
        unit={`/ ${fmt(kpis.itemCount)}`}
        sub={lowNames || t("all above reorder level")}
      />
      <Stat
        label={t("Volunteers deployed")}
        icon={<Icon d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0" />}
        tone="ok"
        value={fmt(kpis.volunteersDeployed)}
        unit={`/ ${fmt(kpis.volunteersTotal)}`}
        sub={t("{count} awaiting a camp", { count: fmt(kpis.volunteersTotal - kpis.volunteersDeployed) })}
      />
    </StatStrip>
  );
}

function MapRow({ data }: { data: Overview }) {
  const { t } = useI18n();
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
          title={t("Camps across Sindh")}
          sub={t("Pin size shows families sheltered. Dashed lines are open dispatches from the nearest depot.")}
          right={<Badge tone="info">{t("{count} open routes", { count: fmt(data.routes.length) })}</Badge>}
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
            sub={t("{district} · {count} volunteers", { district: selected.district, count: fmt(selected.volunteers) })}
            right={selected.criticalGaps > 0 ? <Badge tone="danger">{t("{count} critical", { count: fmt(selected.criticalGaps) })}</Badge> : <Badge tone="success">{t("Stable")}</Badge>}
          />
          <div className="flex flex-1 flex-col gap-5 p-5">
            <div className="relative h-[150px] [&_.recharts-surface]:[direction:ltr]">
              <EvilRadialChart
                data={[{ name: "met", value: met }]}
                nameKey="name"
                config={{ met: series(t("Needs met"), ratioColor(selected.needsMet)) }}
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
                <span className="text-xs text-muted">{t("needs met")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-tint p-3">
                <div className="text-xs text-muted">{t("Families")}</div>
                <div className="text-lg font-bold">
                  <bdi dir="ltr">{fmt(selected.families)} <span className="text-sm font-medium text-muted">/ {fmt(selected.capacity)}</span></bdi>
                </div>
                <div className="mt-2">
                  <Meter ratio={selected.capacity ? selected.families / selected.capacity : 0} color={PALETTE.info} />
                </div>
              </div>
              <div className="rounded-lg bg-tint p-3">
                <div className="text-xs text-muted">{t("Status")}</div>
                <div className="text-lg font-bold">{t(selected.status)}</div>
                <div className="mt-1 text-xs text-muted">{t("{count} on site", { count: fmt(selected.volunteers) })}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">{t("Weakest needs")}</span>
              {selected.worstNeeds.map((n) => (
                <div key={n.itemName} className="grid grid-cols-[1fr_100px_40px] items-center gap-3 text-[13px]">
                  <span className="truncate font-medium">{t(n.itemName)}</span>
                  <Meter ratio={n.pct} color={ratioColor(n.pct)} />
                  <span className={cx("text-end font-mono text-xs font-semibold", levelText(n.pct))}>{pct(n.pct)}</span>
                </div>
              ))}
              {selected.worstNeeds.length === 0 && <span className="text-[13px] text-muted">{t("No needs recorded.")}</span>}
            </div>
            <div className="mt-auto flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/camps/${selected._id}`)}>
                {t("Open camp")}
              </Button>
              {isCoordinator && selected.status !== "Closed" && (
                <Button size="sm" className="flex-1" onClick={() => navigate(`/dispatches?camp=${selected._id}`)}>
                  {t("Dispatch here")}
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isCoordinator } = useViewer();
  return (
    <Section
      title={
        <>
          {t("Critical gaps")} <Badge tone="danger">{fmt(data.criticalGaps.length)}</Badge>
        </>
      }
      sub={t("High priority and under 40% delivered, worst first")}
      right={
        <Link to="/needs" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
          {t("All {count} needs", { count: fmt(data.counts.needs) })} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
        </Link>
      }
    >
      <TableHead>
        <span className="w-10 shrink-0">#</span>
        <span className="flex-1">{t("Need · camp")}</span>
        <span className="w-[220px] shrink-0">{t("Delivered")}</span>
        <span className="w-[64px] shrink-0 text-end">{t("Met")}</span>
        <span className="w-[112px] shrink-0" />
      </TableHead>
      {data.criticalGaps.length === 0 && <p className="py-10 text-center text-sm text-muted">{t("Every high-priority need is above 40%.")}</p>}
      {data.criticalGaps.slice(0, 5).map((g, i) => (
        <div key={g._id} className="group flex h-[68px] items-center border-b border-line px-5 last:border-b-0 hover:bg-tint/70">
          <span className="w-10 shrink-0">
            <span className={cx("grid size-6 place-items-center rounded-md font-mono text-xs font-semibold", i === 0 ? "bg-alert text-white" : "bg-alert-wash text-alert-ink")}>{fmt(i + 1)}</span>
          </span>
          <Link to={`/camps/${g.campId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold group-hover:underline">{t(g.itemName)}</span>
            <span className="truncate text-[13px] text-muted">
              {g.campName} · {g.district}
            </span>
          </Link>
          <div className="flex w-[220px] shrink-0 flex-col gap-1.5 pe-6">
            <Vessel fulfilled={g.fulfilled} reserved={g.reserved} required={g.required} />
            <span className="whitespace-nowrap font-mono text-[11px] text-muted">
              <bdi dir="ltr">{fmt(g.fulfilled)} / {qty(g.required, g.unit)}</bdi>
              {g.reserved > 0 && <> · {t("+{count} en route", { count: fmt(g.reserved) })}</>}
            </span>
          </div>
          <span className="w-[64px] shrink-0 text-end text-xl font-bold tracking-[-0.02em] text-alert">{pct(g.pct)}</span>
          <div className="flex w-[112px] shrink-0 justify-end">
            {isCoordinator ? (
              <Button size="sm" variant={i === 0 ? "primary" : "secondary"} onClick={() => navigate(`/dispatches?camp=${g.campId}&need=${g._id}`)}>
                {t("Dispatch")}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/camps/${g.campId}`)}>
                {t("Open camp")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </Section>
  );
}

function CategorySection({ data }: { data: Overview }) {
  const { t } = useI18n();
  const rows = data.byCategory.map((c) => {
    const met = c.pct == null ? 0 : Math.round(c.pct * 100);
    return {
      category: t(c.category),
      critical: met < 40 ? met : 0,
      watch: met >= 40 && met < 70 ? met : 0,
      ok: met >= 70 ? met : 0,
      left: 100 - met,
      met,
      needs: c.needs,
    };
  });
  const config = {
    critical: series(t("Under 40%"), PALETTE.alert),
    watch: series(t("40–70%"), PALETTE.warn),
    ok: series(t("70% or more"), PALETTE.ok),
    left: series(t("Still short"), "#eceee9"),
  };
  return (
    <ChartCard
      title={t("Fulfilment by category")}
      sub={t("Average delivered ÷ required across all camps")}
      footer={
        <CardFooter>
          <span className="flex items-center gap-2 text-muted">
            <span className="h-3 border-s-2 border-dashed border-alert" /> {t("40% critical line")}
          </span>
          <span className="font-mono text-xs text-muted">{t("{count} needs", { count: fmt(data.byCategory.reduce((s, c) => s + c.needs, 0)) })}</span>
        </CardFooter>
      }
    >
      <div className="relative min-h-[220px] flex-1">
        <div className="absolute inset-0">
          <EvilBarChart data={rows} config={config} layout="horizontal" stackType="stacked" barRadius={4} className="aspect-auto h-full">
            <EvilBarChart.Grid horizontal={false} vertical />
            <EvilBarChart.XAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} tickFormatter={(v: number) => pct(v / 100)} />
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
            <span className={cx("font-mono text-xs font-semibold", levelText(r.met / 100))}>{pct(r.met / 100)}</span>
            <span className="text-[11px] text-muted">{r.category}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function ActivitySection() {
  const { t, language, dir } = useI18n();
  const dispatches = useQuery(api.dispatches.list);
  const days = useMemo(() => lastDays(10, undefined, language), [language]);
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
    delivered: series(t("Delivered"), STATUS_COLORS.Delivered),
    transit: series(t("In Transit"), STATUS_COLORS["In Transit"]),
    pending: series(t("Pending"), STATUS_COLORS.Pending),
    cancelled: series(t("Cancelled"), STATUS_COLORS.Cancelled),
  };
  return (
    <ChartCard title={t("Dispatch activity")} sub={t("Dispatches created per day, last 10 days, by current status")}>
      <EvilBarChart data={rows} config={config} stackType="stacked" barRadius={3} isLoading={!dispatches} className="aspect-auto h-[250px]">
        <EvilBarChart.Grid />
        <EvilBarChart.XAxis dataKey="day" />
        <EvilBarChart.YAxis allowDecimals={false} width={24} tickFormatter={(value: number) => fmt(value)} />
        <EvilBarChart.Tooltip roundness="md" />
        <EvilBarChart.Legend variant="rounded-square" align={dir === "rtl" ? "right" : "left"} />
        <EvilBarChart.Bar dataKey="delivered" />
        <EvilBarChart.Bar dataKey="transit" />
        <EvilBarChart.Bar dataKey="pending" />
        <EvilBarChart.Bar dataKey="cancelled" />
      </EvilBarChart>
    </ChartCard>
  );
}

function PipelineSection({ data }: { data: Overview }) {
  const { t } = useI18n();
  const c = data.dispatchCounts;
  const slices = [
    { status: "Pending", count: c.Pending, color: STATUS_COLORS.Pending },
    { status: "InTransit", label: "In Transit", count: c["In Transit"], color: STATUS_COLORS["In Transit"] },
    { status: "Delivered", count: c.Delivered, color: STATUS_COLORS.Delivered },
    { status: "Cancelled", count: c.Cancelled, color: STATUS_COLORS.Cancelled },
  ];
  const config = Object.fromEntries(slices.map((s) => [s.status, series(t(s.label ?? s.status), s.color)]));
  return (
    <ChartCard
      title={t("Dispatch pipeline")}
      sub={t("{count} units reserved by open dispatches", { count: fmt(data.reservedUnits) })}
      footer={
        <CardFooter>
          <span className="text-muted">{data.recent[0] ? t("Latest: {item} to {camp}", { item: t(data.recent[0].itemName), camp: data.recent[0].campName.split(" ")[0] }) : t("Latest: none")}</span>
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
            <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{fmt(data.dispatchTotal)}</span>
            <span className="text-xs text-muted">{t("dispatches")}</span>
          </div>
        </div>
        <div className="flex-1">
          <LegendDots items={slices.map((s) => ({ label: t(s.label ?? s.status), color: s.color, value: fmt(s.count) }))} />
        </div>
      </div>
    </ChartCard>
  );
}

function ReorderSection({ data }: { data: Overview }) {
  const { t } = useI18n();
  return (
    <Section
      title={
        <>
          {t("Below reorder level")} <Badge tone="warning">{fmt(data.lowStock.length)}</Badge>
        </>
      }
      sub={t("{count} items above reorder level", { count: fmt(data.okStockCount) })}
      right={
        <Link to="/warehouse" className="text-[13px] font-semibold text-ink-2 hover:text-ink">
          {t("Warehouse")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
        </Link>
      }
    >
      {data.lowStock.length === 0 && <p className="py-8 text-center text-sm text-muted">{t("Everything is above its reorder level.")}</p>}
      {data.lowStock.map((i) => (
        <div key={i._id} className="flex flex-col gap-2 border-b border-line px-5 py-3.5 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{t(i.name)}</span>
              <span className="text-xs text-muted">
                {t(i.category)} · {unitLabel(1, i.unit)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold leading-6 text-alert">{fmt(i.stock)}</span>
              <span className="whitespace-nowrap font-mono text-[11px] text-muted">{t("reorder at {count}", { count: fmt(i.reorder) })}</span>
            </div>
          </div>
          <Meter ratio={i.reorder ? i.stock / i.reorder : 0} color={i.stock / Math.max(1, i.reorder) < 0.5 ? PALETTE.alert : PALETTE.warn} />
        </div>
      ))}
    </Section>
  );
}
