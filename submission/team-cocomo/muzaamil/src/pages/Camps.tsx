import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { ChartCard, PALETTE, series } from "../components/charts";
import ReliefMap, { MapKey } from "../components/ReliefMap";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useRun } from "../components/toast";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CampStatusPill,
  EditIcon,
  Empty,
  Field,
  Flag,
  IconButton,
  Input,
  Loading,
  Meter,
  Modal,
  Notice,
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
  Toolbar,
  TrashIcon,
  cx,
} from "../components/ui";
import { fmt, levelText, pct } from "../lib/format";
import { DISTRICT_COORDS } from "../lib/geo";
import { useViewer } from "../lib/viewer";

type StatusFilter = "All" | "Open" | "Full" | "Closed";

export default function Camps() {
  const camps = useQuery(api.camps.list);
  const { isCoordinator } = useViewer();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [district, setDistrict] = useState("All");
  const [editing, setEditing] = useState<Doc<"camps"> | "new" | null>(null);
  const remove = useMutation(api.camps.remove);
  const run = useRun();

  useEffect(() => setSearch(params.get("q") ?? ""), [params]);

  const districts = useMemo(() => [...new Set((camps ?? []).map((c) => c.district))].sort(), [camps]);
  const counts = useMemo(() => {
    const c = { All: 0, Open: 0, Full: 0, Closed: 0 } as Record<StatusFilter, number>;
    for (const camp of camps ?? []) {
      c.All++;
      c[camp.status]++;
    }
    return c;
  }, [camps]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (camps ?? []).filter(
      (c) =>
        (status === "All" || c.status === status) &&
        (district === "All" || c.district === district) &&
        (!q || c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q)),
    );
  }, [camps, search, status, district]);

  const totalFamilies = (camps ?? []).filter((c) => c.status !== "Closed").reduce((s, c) => s + c.current_families, 0);

  async function onDelete(camp: Doc<"camps">) {
    if (!confirm(`Delete ${camp.name}? Its needs and dispatch history will be removed and its volunteers unassigned.`)) return;
    if (await run(remove({ id: camp._id }), `${camp.name} deleted`)) {
      if (editing !== "new" && editing?._id === camp._id) setEditing(null);
    }
  }

  return (
    <>
      <PageHeader
        kicker={`Camp registry · ${counts.All} records`}
        title={`${counts.All} camps across ${districts.length} districts.`}
        deck={`${fmt(totalFamilies)} families sheltered. A camp is marked Full automatically when its families reach capacity.`}
        actions={
          isCoordinator && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon /> Add camp
            </Button>
          )
        }
      />

      {camps && <CampInsights camps={camps} />}

      {!isCoordinator && <ReadOnlyNote />}
      <Card>
          <Toolbar>
            <SearchBox
              value={search}
              onChange={(v) => {
                setSearch(v);
                if (params.get("q")) setParams({}, { replace: true });
              }}
              placeholder="Search name or district"
            />
            <div className="flex items-center gap-2.5">
              <Segmented value={status} onChange={setStatus} options={(["All", "Open", "Full", "Closed"] as const).map((s) => ({ value: s, label: `${s} ${counts[s]}` }))} />
              <Select value={district} onChange={(e) => setDistrict(e.target.value)} className="h-[38px] w-44 text-[13px] font-semibold">
                <option value="All">All districts</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </div>
          </Toolbar>
          <TableHead>
            <span className="flex-1 pl-[15px]">Camp · district</span>
            <span className="w-[170px] shrink-0">Families</span>
            <span className="w-[72px] shrink-0 text-right">Met</span>
            <span className="w-14 shrink-0 text-right">Vols</span>
            <span className="w-[90px] shrink-0 pl-5">Status</span>
            <span className="w-16 shrink-0" />
          </TableHead>
          {!camps ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty>No camps match these filters.</Empty>
          ) : (
            rows.map((c) => {
              const isEditing = editing !== "new" && editing?._id === c._id;
              const closed = c.status === "Closed";
              const critical = c.criticalGaps > 0 && !closed;
              return (
                <Row key={c._id} className={cx("h-16", isEditing && "bg-tint")}>
                  <Link to={`/camps/${c._id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <Flag tone={isEditing ? "ink" : critical ? "alert" : null} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className={cx("truncate text-[15px] font-semibold group-hover:underline", closed && "text-faint")}>{c.name}</span>
                      <span className="truncate text-[13px] text-muted">
                        {c.district} ·{" "}
                        <span className={critical ? "text-alert" : ""}>
                          {critical ? `${c.criticalGaps} critical gap${c.criticalGaps > 1 ? "s" : ""}` : `${c.needCount} needs`}
                          {c.status === "Full" && " · auto-marked Full"}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <span className="flex w-[170px] shrink-0 items-center gap-3 pr-4">
                    <span className={cx("w-[68px] shrink-0 font-mono text-xs", closed && "text-faint")}>
                      {fmt(c.current_families)}/{fmt(c.capacity)}
                    </span>
                    <span className="flex-1">
                      <Meter ratio={c.capacity ? c.current_families / c.capacity : 0} color={closed ? "var(--color-ghost)" : c.status === "Full" ? PALETTE.warn : PALETTE.info} />
                    </span>
                  </span>
                  <span className={cx("w-[72px] shrink-0 text-right text-lg font-bold tracking-[-0.02em]", levelText(c.needsMet))}>{pct(c.needsMet)}</span>
                  <span className={cx("w-14 shrink-0 text-right font-mono text-[13px]", closed && "text-faint")}>{c.volunteers}</span>
                  <span className="flex w-[90px] shrink-0 pl-5">
                    <CampStatusPill status={c.status} />
                  </span>
                  <span className="flex w-16 shrink-0 justify-end gap-1.5">
                    {isCoordinator && (
                      <>
                        <IconButton label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton label={`Delete ${c.name}`} tone="alert" onClick={() => onDelete(c)}>
                          <TrashIcon />
                        </IconButton>
                      </>
                    )}
                  </span>
                </Row>
              );
            })
          )}
        </Card>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          {(close) => <CampForm key={editing === "new" ? "new" : editing._id} camp={editing === "new" ? null : editing} districts={districts} onDone={close} />}
        </Modal>
      )}
    </>
  );
}

type CampRow = FunctionReturnType<typeof api.camps.list>[number];

function CampInsights({ camps }: { camps: CampRow[] }) {
  const navigate = useNavigate();
  const mapCamps = useMemo(
    () => camps.map((c) => ({ ...c, lat: c.lat ?? null, lng: c.lng ?? null, families: c.current_families })),
    [camps],
  );
  const occupancy = camps
    .filter((c) => c.status !== "Closed")
    .map((c) => ({ camp: c.name.split(" ")[0], families: c.current_families, free: Math.max(0, c.capacity - c.current_families) }))
    .sort((a, b) => b.families + b.free - (a.families + a.free));
  const critical = camps.filter((c) => c.criticalGaps > 0 && c.status !== "Closed").length;
  return (
    <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6">
      <Card className="flex flex-col">
        <CardHeader
          title="Camp locations"
          sub="Select a pin to open the camp"
          right={critical > 0 ? <Badge tone="danger">{critical} with critical gaps</Badge> : <Badge tone="success">No critical gaps</Badge>}
        />
        <ReliefMap camps={mapCamps} onSelect={(id) => navigate(`/camps/${id}`)} height={320} />
        <CardFooter>
          <MapKey />
        </CardFooter>
      </Card>
      <ChartCard title="Occupancy" sub="Families sheltered against capacity, open and full camps">
        <EvilBarChart
          data={occupancy}
          config={{ families: series("Families", PALETTE.info), free: series("Free places", "#dfe3dc") }}
          layout="horizontal"
          stackType="stacked"
          barRadius={3}
          className="aspect-auto h-[340px]"
        >
          <EvilBarChart.Grid horizontal={false} vertical />
          <EvilBarChart.XAxis />
          <EvilBarChart.YAxis dataKey="camp" width={80} />
          <EvilBarChart.Tooltip roundness="md" />
          <EvilBarChart.Legend variant="rounded-square" align="left" />
          <EvilBarChart.Bar dataKey="families" />
          <EvilBarChart.Bar dataKey="free" />
        </EvilBarChart>
      </ChartCard>
    </div>
  );
}

function CampForm({ camp, districts, onDone }: { camp: Doc<"camps"> | null; districts: string[]; onDone: () => void }) {
  const create = useMutation(api.camps.create);
  const update = useMutation(api.camps.update);
  const run = useRun();
  const [name, setName] = useState(camp?.name ?? "");
  const [district, setDistrict] = useState(camp?.district ?? "");
  const [capacity, setCapacity] = useState(camp ? String(camp.capacity) : "");
  const [families, setFamilies] = useState(camp ? String(camp.current_families) : "0");
  const [closed, setClosed] = useState(camp?.status === "Closed");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const cap = Number(capacity);
  const fam = Number(families);
  const errors = {
    name: !name.trim() ? "Camp name is required" : null,
    district: !district.trim() ? "District is required" : null,
    capacity: !capacity || !Number.isInteger(cap) || cap < 1 ? "Capacity must be a whole number of at least 1" : null,
    families:
      families === "" || !Number.isInteger(fam) || fam < 0
        ? "Enter a whole number, 0 or more"
        : Number.isInteger(cap) && cap > 0 && fam > cap
          ? `Can't be more than capacity (${cap})`
          : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const willBeFull = !closed && valid && fam >= cap;
  const knownDistricts = [...new Set([...districts, ...Object.keys(DISTRICT_COORDS)])].sort();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const fields = { name, district, capacity: cap, current_families: fam, status: closed ? ("Closed" as const) : ("Open" as const) };
    const ok = camp ? await run(update({ id: camp._id as Id<"camps">, ...fields }), `${name.trim()} saved`) : await run(create(fields), `${name.trim()} added`);
    setBusy(false);
    if (ok) onDone();
  }

  const show = (key: keyof typeof errors) => (touched ? errors[key] : null);

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={camp ? "Edit camp" : "New record"} title={camp ? camp.name : "Add camp"} onClose={onDone} />
        <Field label="Camp name" error={show("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!show("name")} maxLength={80} placeholder="Sehwan Sharif Relief Camp" />
        </Field>
        <Field label="District" error={show("district")}>
          <Input list="district-options" value={district} onChange={(e) => setDistrict(e.target.value)} invalid={!!show("district")} placeholder="Jamshoro" />
          <datalist id="district-options">
            {knownDistricts.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <div className="flex gap-3">
          <Field label="Capacity (families)" error={show("capacity")}>
            <Input type="number" min={1} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} invalid={!!show("capacity")} />
          </Field>
          <Field label="Current families" error={show("families")}>
            <Input type="number" min={0} step={1} value={families} onChange={(e) => setFamilies(e.target.value)} invalid={!!show("families")} />
          </Field>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">Status</span>
          <Segmented
            value={closed ? "Closed" : willBeFull ? "Full" : "Open"}
            onChange={(v) => setClosed(v === "Closed")}
            options={[
              { value: "Open", label: "Open", disabled: willBeFull },
              { value: "Full", label: "Full · auto", disabled: !willBeFull },
              { value: "Closed", label: "Closed" },
            ]}
          />
          <span className="font-mono text-[11px] leading-4 text-muted">Full is set automatically when families reach capacity.</span>
        </div>
        {closed && camp && camp.status !== "Closed" && <Notice tone="warning">Closing this camp unassigns its volunteers and stops new dispatches to it.</Notice>}
        <div className="flex gap-2.5 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {busy ? "Saving…" : camp ? "Save changes" : "Add camp"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
