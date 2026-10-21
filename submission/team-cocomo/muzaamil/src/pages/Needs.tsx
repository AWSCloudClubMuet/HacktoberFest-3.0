import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { ChartCard, LegendDots, PALETTE, series } from "../components/charts";
import { Card, Empty, Flag, Loading, PageHeader, PriorityPill, SearchBox, Segmented, Select, TableHead, Toggle, Toolbar, Vessel, cx } from "../components/ui";
import { CATEGORIES, fmt, levelText, pct, PRIORITIES, qty, type Priority } from "../lib/format";

export default function Needs() {
  const needs = useQuery(api.needs.list);
  const [priority, setPriority] = useState<"All" | Priority>("All");
  const [category, setCategory] = useState("All");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (needs ?? []).filter(
      (n) =>
        (priority === "All" || n.priority === priority) &&
        (category === "All" || n.item?.category === category) &&
        (!criticalOnly || n.isCriticalGap) &&
        (!q || n.item?.name.toLowerCase().includes(q) || n.camp?.name.toLowerCase().includes(q) || n.camp?.district.toLowerCase().includes(q)),
    );
  }, [needs, priority, category, criticalOnly, search]);

  const critical = (needs ?? []).filter((n) => n.isCriticalGap).length;

  return (
    <>
      <PageHeader
        kicker={`Needs · ${needs?.length ?? 0} across every camp`}
        title={
          <>
            {needs?.length ?? 0} needs.{" "}
            {critical > 0 ? (
              <span className="text-alert">
                {critical} critical {critical === 1 ? "gap" : "gaps"}.
              </span>
            ) : (
              "No critical gaps."
            )}
          </>
        }
        deck="A critical gap is a High-priority need below 40% delivered. Sorted worst first. Open a camp to add, edit or dispatch against its needs."
      />
      {needs && <NeedCharts needs={needs} />}
      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search item, camp or district" />
          <div className="flex items-center gap-2.5">
            <Toggle on={criticalOnly} onClick={() => setCriticalOnly((v) => !v)}>
              Critical gaps only · {critical}
            </Toggle>
            <Segmented value={priority} onChange={setPriority} options={[{ value: "All", label: "All" }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]} />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-[38px] w-44 text-[13px] font-semibold">
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
        </Toolbar>
        <TableHead>
          <span className="w-[270px] shrink-0 pl-[15px]">Camp</span>
          <span className="w-[210px] shrink-0">Item</span>
          <span className="w-[90px] shrink-0">Priority</span>
          <span className="flex-1">Progress</span>
          <span className="w-[150px] shrink-0">Left to send</span>
          <span className="w-[70px] shrink-0 text-right">Met</span>
        </TableHead>
        {!needs ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty>No needs match these filters.</Empty>
        ) : (
          rows.map((n) => (
            <Link key={n._id} to={`/camps/${n.camp_id}`} className="group flex h-[60px] items-center border-b border-line px-5 last:border-b-0 hover:bg-tint/70">
              <span className="flex w-[270px] shrink-0 items-center gap-3">
                <Flag tone={n.isCriticalGap ? "alert" : null} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold group-hover:underline">{n.camp?.name}</span>
                  <span className="text-xs text-muted">{n.camp?.district}</span>
                </span>
              </span>
              <span className="flex w-[210px] shrink-0 flex-col gap-0.5">
                <span className="truncate text-sm">{n.item?.name}</span>
                <span className="text-xs text-muted">{n.item?.category}</span>
              </span>
              <span className="flex w-[90px] shrink-0">
                <PriorityPill priority={n.priority} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[7px] pr-8">
                <Vessel fulfilled={n.fulfilled_quantity} reserved={n.reserved} required={n.required_quantity} />
                <span className="truncate font-mono text-[11px] text-muted">
                  {fmt(n.fulfilled_quantity)} / {qty(n.required_quantity, n.item?.unit)}
                  {n.reserved > 0 && ` · +${fmt(n.reserved)} reserved`}
                </span>
              </span>
              <span className="w-[150px] shrink-0 font-mono text-xs">{qty(n.remaining, n.item?.unit)}</span>
              <span className={cx("w-[70px] shrink-0 text-right text-xl font-bold tracking-[-0.02em]", levelText(n.pct))}>{pct(n.pct)}</span>
            </Link>
          ))
        )}
      </Card>
    </>
  );
}

type Need = FunctionReturnType<typeof api.needs.list>[number];

function NeedCharts({ needs }: { needs: Need[] }) {
  const byCamp = new Map<string, Need[]>();
  for (const n of needs) {
    const name = n.camp?.name.split(" ")[0] ?? "Camp";
    byCamp.set(name, [...(byCamp.get(name) ?? []), n]);
  }
  // One value per camp, split into three series so each bar takes its health colour.
  const camps = [...byCamp.entries()]
    .map(([camp, list]) => {
      const met = Math.round((list.reduce((s, n) => s + n.pct, 0) / list.length) * 100);
      return { camp, critical: met < 40 ? met : 0, watch: met >= 40 && met < 70 ? met : 0, ok: met >= 70 ? met : 0, met };
    })
    .sort((a, b) => a.met - b.met);
  const crit = needs.filter((n) => n.isCriticalGap).length;
  const below = needs.filter((n) => !n.isCriticalGap && n.pct < 0.7).length;
  const slices = [
    { status: "critical", label: "Critical gap", count: crit, color: PALETTE.alert },
    { status: "watch", label: "Below 70%", count: below, color: PALETTE.warn },
    { status: "ok", label: "On track", count: needs.length - crit - below, color: PALETTE.ok },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
      <ChartCard title="Fulfilment by camp" sub="Average share delivered across each camp's needs, weakest first">
        <EvilBarChart
          data={camps}
          config={{ critical: series("Under 40%", PALETTE.alert), watch: series("40–70%", PALETTE.warn), ok: series("70% or more", PALETTE.ok) }}
          stackType="stacked"
          barRadius={4}
          className="aspect-auto h-[240px]"
        >
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="camp" />
          <EvilBarChart.YAxis domain={[0, 100]} width={34} tickFormatter={(v: number) => `${v}%`} />
          <EvilBarChart.Tooltip roundness="md" />
          <EvilBarChart.Legend variant="rounded-square" align="left" />
          <EvilBarChart.Bar dataKey="critical" />
          <EvilBarChart.Bar dataKey="watch" />
          <EvilBarChart.Bar dataKey="ok" />
        </EvilBarChart>
      </ChartCard>
      <ChartCard title="Need health" sub={`${needs.length} needs across every camp`}>
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[200px] w-[200px] flex-none">
            <EvilPieChart
              data={slices.filter((s) => s.count > 0)}
              dataKey="count"
              nameKey="status"
              config={Object.fromEntries(slices.map((s) => [s.status, series(s.label, s.color)]))}
              className="aspect-square h-[200px]"
            >
              <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
              <EvilPieChart.Tooltip roundness="md" />
            </EvilPieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] font-bold leading-8 tracking-[-0.03em] text-alert">{crit}</span>
              <span className="text-xs text-muted">critical</span>
            </div>
          </div>
          <div className="flex-1">
            <LegendDots items={slices.map((s) => ({ label: s.label, color: s.color, value: s.count }))} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
