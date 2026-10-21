import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useRun } from "../components/toast";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { ChartCard, keyOf, LegendDots, PALETTE, series, SKILL_COLORS } from "../components/charts";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Flag,
  IconButton,
  Input,
  LockIcon,
  Loading,
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
  SkillPill,
  Stat,
  StatStrip,
  TableHead,
  Toolbar,
  TrashIcon,
  cx,
} from "../components/ui";
import { initials, SKILLS, type Skill } from "../lib/format";
import { useViewer } from "../lib/viewer";

type Volunteer = FunctionReturnType<typeof api.volunteers.list>[number];

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen"];
const say = (n: number) => words[n] ?? String(n);

export default function Volunteers() {
  const volunteers = useQuery(api.volunteers.list);
  const { isCoordinator } = useViewer();
  const unassign = useMutation(api.volunteers.unassign);
  const remove = useMutation(api.volunteers.remove);
  const run = useRun();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  useEffect(() => setSearch(params.get("q") ?? ""), [params]);
  const [skill, setSkill] = useState<"All" | Skill>("All");
  const [panel, setPanel] = useState<{ mode: "assign"; vol: Volunteer } | { mode: "register" } | null>(null);

  const all = volunteers ?? [];
  const waiting = all.filter((v) => !v.camp_id).length;
  const campCount = new Set(all.filter((v) => v.camp_id).map((v) => v.camp_id)).size;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((v) => (skill === "All" || v.skill === skill) && (!q || v.name.toLowerCase().includes(q)));
  }, [all, search, skill]);

  return (
    <>
      <PageHeader
        kicker={`Volunteers · ${all.length - waiting} deployed across ${campCount} camps`}
        title={
          <>
            {say(all.length)} volunteers.{" "}
            {waiting > 0 ? <span className="text-warn-ink">{say(waiting)} waiting for a camp.</span> : "Everyone is deployed."}
          </>
        }
        deck="Each volunteer holds one assignment at a time. Closed camps can't take new volunteers."
        actions={
          isCoordinator && (
            <Button onClick={() => setPanel({ mode: "register" })}>
              <PlusIcon /> Register volunteer
            </Button>
          )
        }
      />
      <StatStrip cols={4}>
        <Stat label="Volunteers" value={all.length} sub="Registered in the field team" />
        <Stat label="Deployed" value={all.length - waiting} tone="ok" sub={`Across ${campCount} camps`} />
        <Stat label="Waiting for a camp" value={waiting} tone={waiting ? "warn" : undefined} sub={waiting ? "Assign them below" : "Everyone has a camp"} />
        <Stat label="Medical staff" value={all.filter((v) => v.skill === "Medical").length} tone="info" sub="Doctors, nurses and first aid" />
      </StatStrip>

      {volunteers && <VolunteerCharts volunteers={volunteers} />}

      {!isCoordinator && <ReadOnlyNote />}
      <Card>          <Toolbar>
            <SearchBox value={search} onChange={setSearch} placeholder="Search by name" width="w-56" />
            <Segmented
              value={skill}
              onChange={setSkill}
              options={(["All", ...SKILLS] as const).map((s) => ({
                value: s,
                label: `${s} ${s === "All" ? all.length : all.filter((v) => v.skill === s).length}`,
              }))}
            />
          </Toolbar>
          <TableHead>
            <span className="flex-1 pl-[15px]">Volunteer</span>
            <span className="w-[120px] shrink-0">Skill</span>
            <span className="w-[230px] shrink-0">Assigned camp</span>
            <span className="w-[140px] shrink-0" />
          </TableHead>
          {!volunteers ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty>No volunteers match.</Empty>
          ) : (
            rows.map((v) => {
              const active = panel?.mode === "assign" && panel.vol._id === v._id;
              return (
                <Row key={v._id} className={cx("h-[56px]", active && "bg-tint")}>
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <Flag tone={active ? "ink" : v.camp_id ? null : "signal"} />
                    <Avatar name={initials(v.name)} tone={active ? "solid" : v.camp_id ? "soft" : "dashed"} />
                    <span className="truncate text-[15px] font-semibold">{v.name}</span>
                  </span>
                  <span className="w-[120px] shrink-0">
                    <SkillPill skill={v.skill} />
                  </span>
                  <span className={cx("w-[230px] shrink-0 truncate pr-3 text-sm", !v.campName && "italic text-muted")}>{v.campName ?? "Unassigned"}</span>
                  <span className="flex w-[140px] shrink-0 justify-end gap-1.5">
                    {isCoordinator &&
                      (v.camp_id ? (
                        <Button size="sm" variant="secondary" onClick={() => void run(unassign({ id: v._id }), `${v.name} unassigned`)}>
                          Unassign
                        </Button>
                      ) : (
                        <Button size="sm" variant={active ? "primary" : "secondary"} onClick={() => setPanel({ mode: "assign", vol: v })}>
                          Assign
                        </Button>
                      ))}
                    {isCoordinator && (
                      <IconButton
                        label={`Remove ${v.name}`}
                        tone="alert"
                        onClick={() => {
                          if (confirm(`Remove ${v.name} from the volunteer list?`)) void run(remove({ id: v._id }), `${v.name} removed`);
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                    )}
                  </span>
                </Row>
              );
            })
          )}
        </Card>

      {isCoordinator && panel && (
        <Modal onClose={() => setPanel(null)} width={panel.mode === "assign" ? 520 : 440}>
          {(close) =>
            panel.mode === "assign" ? <AssignPanel key={panel.vol._id} vol={panel.vol} onDone={close} /> : <RegisterForm onDone={close} />
          }
        </Modal>
      )}
    </>
  );
}

function VolunteerCharts({ volunteers }: { volunteers: Volunteer[] }) {
  const camps = useQuery(api.camps.list);
  const skills = SKILLS.map((s) => ({ skill: s, count: volunteers.filter((v) => v.skill === s).length, color: SKILL_COLORS[s] ?? PALETTE.grey }));
  const deployment = useMemo(
    () =>
      (camps ?? [])
        .filter((c) => c.status !== "Closed")
        .map((c) => {
          const row: Record<string, string | number> = { camp: c.name.split(" ")[0] };
          for (const s of SKILLS) row[keyOf(s)] = volunteers.filter((v) => v.camp_id === c._id && v.skill === s).length;
          return row;
        }),
    [camps, volunteers],
  );
  const config = Object.fromEntries(SKILLS.map((s) => [keyOf(s), series(s, SKILL_COLORS[s] ?? PALETTE.grey)]));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6">
      <ChartCard title="Skills on the team" sub={`${volunteers.length} volunteers by primary skill`}>
        <div className="flex h-full items-center gap-5">
          <div className="relative h-[190px] w-[190px] flex-none">
            <EvilPieChart
              data={skills.filter((s) => s.count > 0)}
              dataKey="count"
              nameKey="skill"
              config={Object.fromEntries(skills.map((s) => [s.skill, series(s.skill, s.color)]))}
              className="aspect-square h-[190px]"
            >
              <EvilPieChart.Pie innerRadius="62%" outerRadius="95%" paddingAngle={3} cornerRadius={4} />
              <EvilPieChart.Tooltip roundness="md" />
            </EvilPieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{volunteers.length}</span>
              <span className="text-xs text-muted">people</span>
            </div>
          </div>
          <div className="flex-1">
            <LegendDots items={skills.map((s) => ({ label: s.skill, color: s.color, value: s.count }))} />
          </div>
        </div>
      </ChartCard>
      <ChartCard title="Deployment by camp" sub="Volunteers assigned to each open camp, by skill">
        <EvilBarChart data={deployment} config={config} stackType="stacked" barRadius={3} isLoading={!camps} className="aspect-auto h-[230px]">
          <EvilBarChart.Grid />
          <EvilBarChart.XAxis dataKey="camp" interval={0} />
          <EvilBarChart.YAxis allowDecimals={false} width={24} />
          <EvilBarChart.Tooltip roundness="md" />
          <EvilBarChart.Legend variant="rounded-square" align="left" />
          {SKILLS.map((s) => (
            <EvilBarChart.Bar key={s} dataKey={keyOf(s)} />
          ))}
        </EvilBarChart>
      </ChartCard>
    </div>
  );
}

function AssignPanel({ vol, onDone }: { vol: Volunteer; onDone: () => void }) {
  const camps = useQuery(api.camps.list);
  const assign = useMutation(api.volunteers.assign);
  const run = useRun();
  const sorted = useMemo(
    () => [...(camps ?? [])].sort((a, b) => Number(a.status === "Closed") - Number(b.status === "Closed") || b.criticalGaps - a.criticalGaps || a.volunteers - b.volunteers),
    [camps],
  );
  const [campId, setCampId] = useState<string>("");
  const chosen = campId || sorted.find((c) => c.status !== "Closed")?._id || "";
  const chosenCamp = sorted.find((c) => c._id === chosen);
  const [busy, setBusy] = useState(false);

  return (
    <Panel>
      <PanelTitle kicker={`Assign · ${vol.skill}`} title={vol.name} onClose={onDone} />
      <span className="text-[13px] font-semibold text-ink-2">Choose a camp</span>
      <div className="-mt-2 flex max-h-[min(430px,50vh)] flex-col gap-1.5 overflow-y-auto overscroll-contain">
        {!camps && <Loading />}
        {sorted.map((c) => {
          const closed = c.status === "Closed";
          const on = c._id === chosen;
          return (
            <button
              key={c._id}
              type="button"
              disabled={closed}
              onClick={() => setCampId(c._id)}
              className={cx(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                closed ? "cursor-not-allowed border-line bg-tint" : "cursor-pointer border-line hover:border-line-strong hover:bg-tint",
                on && "border-info-line bg-info-wash hover:border-info-line hover:bg-info-wash",
              )}
            >
              <span
                className={cx(
                  "size-4 shrink-0 rounded-full",
                  closed ? "bg-line" : on ? "border-[5px] border-info bg-white" : "border-[1.5px] border-faint",
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cx("truncate text-sm font-semibold", closed && "text-faint")}>{c.name}</span>
                <span className={cx("truncate font-mono text-[11px]", closed ? "text-faint" : "text-muted")}>
                  {closed
                    ? "Closed · can't take volunteers"
                    : `${c.district} · ${c.volunteers} volunteer${c.volunteers === 1 ? "" : "s"}${c.criticalGaps ? ` · ${c.criticalGaps} critical` : ""}`}
                </span>
              </span>
              {closed ? (
                <span className="text-faint">
                  <LockIcon />
                </span>
              ) : (
                c.criticalGaps > 0 && (
                  <Badge tone="danger" dot>Needs help</Badge>
                )
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] leading-[18px] text-muted">A volunteer can hold one assignment at a time. Unassign them first to move them to another camp.</p>
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onDone}>
          Cancel
        </Button>
        <Button
          className="flex-[1.8]"
          disabled={!chosenCamp || busy}
          onClick={async () => {
            if (!chosenCamp) return;
            setBusy(true);
            const ok = await run(assign({ id: vol._id, camp_id: chosenCamp._id as Id<"camps"> }), `${vol.name} assigned to ${chosenCamp.name}`);
            setBusy(false);
            if (ok) onDone();
          }}
        >
          {chosenCamp ? `Assign to ${chosenCamp.name.split(" ")[0]}` : "Choose a camp"}
        </Button>
      </div>
    </Panel>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const create = useMutation(api.volunteers.create);
  const run = useRun();
  const [name, setName] = useState("");
  const [skill, setSkill] = useState<Skill>("Medical");
  const [touched, setTouched] = useState(false);
  const error = !name.trim() ? "Name is required" : null;

  return (
    <Panel>
      <form
        className="flex flex-col gap-[18px]"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (error) return;
          if (await run(create({ name, skill }), `${name.trim()} registered`)) onDone();
        }}
      >
        <PanelTitle kicker="New volunteer" title="Register volunteer" onClose={onDone} />
        <Field label="Full name" error={touched ? error : null}>
          <Input value={name} onChange={(e) => setName(e.target.value)} invalid={touched && !!error} placeholder="Mehwish Abro" />
        </Field>
        <Field label="Skill">
          <Select value={skill} onChange={(e) => setSkill(e.target.value as Skill)}>
            {SKILLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]">
            Register
          </Button>
        </div>
      </form>
    </Panel>
  );
}
