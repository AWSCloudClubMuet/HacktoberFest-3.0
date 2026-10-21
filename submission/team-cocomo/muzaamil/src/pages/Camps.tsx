import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/evilcharts/ui/recharts-tooltip";
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
import { useI18n } from "../i18n";

type StatusFilter = "All" | "Open" | "Full" | "Closed";

export default function Camps() {
  const { t } = useI18n();
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
    if (!confirm(t("Delete {name}? Its needs and dispatch history will be removed and its volunteers unassigned.", { name: camp.name }))) return;
    if (await run(remove({ id: camp._id }), t("{name} deleted", { name: camp.name }))) {
      if (editing !== "new" && editing?._id === camp._id) setEditing(null);
    }
  }

  return (
    <>
      <PageHeader
        kicker={t("Camp registry · {count} records", { count: fmt(counts.All) })}
        title={t("{count} camps across {districts} districts.", { count: fmt(counts.All), districts: fmt(districts.length) })}
        deck={t("{count} families sheltered. A camp is marked Full automatically when its families reach capacity.", { count: fmt(totalFamilies) })}
        actions={
          isCoordinator && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon /> {t("Add camp")}
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
              placeholder={t("Search name or district")}
            />
            <div className="flex items-center gap-2.5">
              <Segmented value={status} onChange={setStatus} options={(["All", "Open", "Full", "Closed"] as const).map((s) => ({ value: s, label: `${t(s)} ${fmt(counts[s])}` }))} />
              <Select value={district} onChange={(e) => setDistrict(e.target.value)} className="h-[38px] w-44 text-[13px] font-semibold">
                <option value="All">{t("All districts")}</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </div>
          </Toolbar>
          <TableHead>
            <span className="flex-1 ps-[15px]">{t("Camp · district")}</span>
            <span className="w-[170px] shrink-0">{t("Families")}</span>
            <span className="w-[72px] shrink-0 text-end">{t("Met")}</span>
            <span className="w-14 shrink-0 text-end">{t("Vols")}</span>
            <span className="w-[90px] shrink-0 ps-5">{t("Status")}</span>
            <span className="w-16 shrink-0" />
          </TableHead>
          {!camps ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty>{t("No camps match these filters.")}</Empty>
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
                          {critical ? t(c.criticalGaps === 1 ? "{count} critical gap" : "{count} critical gaps", { count: fmt(c.criticalGaps) }) : t("{count} needs", { count: fmt(c.needCount) })}
                          {c.status === "Full" && <> · {t("auto-marked Full")}</>}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <span className="flex w-[170px] shrink-0 items-center gap-3 pe-4">
                    <span className={cx("w-[68px] shrink-0 font-mono text-xs", closed && "text-faint")}>
                      {fmt(c.current_families)}/{fmt(c.capacity)}
                    </span>
                    <span className="flex-1">
                      <Meter ratio={c.capacity ? c.current_families / c.capacity : 0} color={closed ? "var(--color-ghost)" : c.status === "Full" ? PALETTE.warn : PALETTE.info} />
                    </span>
                  </span>
                  <span className={cx("w-[72px] shrink-0 text-end text-lg font-bold tracking-[-0.02em]", levelText(c.needsMet))}>{pct(c.needsMet)}</span>
                  <span className={cx("w-14 shrink-0 text-end font-mono text-[13px]", closed && "text-faint")}>{fmt(c.volunteers)}</span>
                  <span className="flex w-[90px] shrink-0 ps-5">
                    <CampStatusPill status={c.status} />
                  </span>
                  <span className="flex w-16 shrink-0 justify-end gap-1.5">
                    {isCoordinator && (
                      <>
                        <IconButton label={t("Edit {name}", { name: c.name })} onClick={() => setEditing(c)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton label={t("Delete {name}", { name: c.name })} tone="alert" onClick={() => onDelete(c)}>
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
  const { t, dir } = useI18n();
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
          title={t("Camp locations")}
          sub={t("Select a pin to open the camp")}
          right={critical > 0 ? <Badge tone="danger">{t("{count} with critical gaps", { count: fmt(critical) })}</Badge> : <Badge tone="success">{t("No critical gaps")}</Badge>}
        />
        <ReliefMap camps={mapCamps} onSelect={(id) => navigate(`/camps/${id}`)} height={320} />
        <CardFooter>
          <MapKey />
        </CardFooter>
      </Card>
      <ChartCard title={t("Occupancy")} sub={t("Families sheltered against capacity, open and full camps")}>
        <EvilBarChart
          data={occupancy}
          config={{ families: series(t("Families"), PALETTE.info), free: series(t("Free places"), "#dfe3dc") }}
          layout="horizontal"
          stackType="stacked"
          barRadius={3}
          className="aspect-auto h-[340px]"
        >
          <EvilBarChart.Grid horizontal={false} vertical />
          <EvilBarChart.XAxis tickFormatter={(value: number) => fmt(value)} reversed={dir === "rtl"} />
          <EvilBarChart.YAxis dataKey="camp" width={80} orientation={dir === "rtl" ? "right" : "left"} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent roundness="md" formatter={(value, name, item) => (
            <div className="flex w-full items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.color }} />
              <span className="flex-1 text-muted-foreground">{t(name === "free" ? "Free places" : "Families")}</span>
              <span className="font-mono font-medium tabular-nums">{fmt(Number(value))}</span>
            </div>
          )} />} />
          <EvilBarChart.Legend variant="rounded-square" align={dir === "rtl" ? "right" : "left"} />
          <EvilBarChart.Bar dataKey="families" />
          <EvilBarChart.Bar dataKey="free" />
        </EvilBarChart>
      </ChartCard>
    </div>
  );
}

function CampForm({ camp, districts, onDone }: { camp: Doc<"camps"> | null; districts: string[]; onDone: () => void }) {
  const { t } = useI18n();
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
    name: !name.trim() ? t("Camp name is required") : null,
    district: !district.trim() ? t("District is required") : null,
    capacity: !capacity || !Number.isInteger(cap) || cap < 1 ? t("Capacity must be a whole number of at least 1") : null,
    families:
      families === "" || !Number.isInteger(fam) || fam < 0
        ? t("Enter a whole number, 0 or more")
        : Number.isInteger(cap) && cap > 0 && fam > cap
          ? t("Can't be more than capacity ({count})", { count: fmt(cap) })
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
    const ok = camp ? await run(update({ id: camp._id as Id<"camps">, ...fields }), t("{name} saved", { name: name.trim() })) : await run(create(fields), t("{name} added", { name: name.trim() }));
    setBusy(false);
    if (ok) onDone();
  }

  const show = (key: keyof typeof errors) => (touched ? errors[key] : null);

  return (
    <Panel>
      <form onSubmit={save} className="flex flex-col gap-[18px]" noValidate>
        <PanelTitle kicker={t(camp ? "Edit camp" : "New record")} title={camp ? camp.name : t("Add camp")} onClose={onDone} />
        <Field label={t("Camp name")} error={show("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!show("name")} maxLength={80} placeholder={t("Sehwan Sharif Relief Camp")} />
        </Field>
        <Field label={t("District")} error={show("district")}>
          <Input list="district-options" value={district} onChange={(e) => setDistrict(e.target.value)} invalid={!!show("district")} placeholder={t("Jamshoro")} />
          <datalist id="district-options">
            {knownDistricts.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <div className="flex gap-3">
          <Field label={t("Capacity (families)")} error={show("capacity")}>
            <Input type="number" min={1} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} invalid={!!show("capacity")} />
          </Field>
          <Field label={t("Current families")} error={show("families")}>
            <Input type="number" min={0} step={1} value={families} onChange={(e) => setFamilies(e.target.value)} invalid={!!show("families")} />
          </Field>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">{t("Status")}</span>
          <Segmented
            value={closed ? "Closed" : willBeFull ? "Full" : "Open"}
            onChange={(v) => setClosed(v === "Closed")}
            options={[
              { value: "Open", label: t("Open"), disabled: willBeFull },
              { value: "Full", label: t("Full · auto"), disabled: !willBeFull },
              { value: "Closed", label: t("Closed") },
            ]}
          />
          <span className="font-mono text-[11px] leading-4 text-muted">{t("Full is set automatically when families reach capacity.")}</span>
        </div>
        {closed && camp && camp.status !== "Closed" && <Notice tone="warning">{t("Closing this camp unassigns its volunteers and stops new dispatches to it.")}</Notice>}
        <div className="flex gap-2.5 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={busy || (touched && !valid)}>
            {t(busy ? "Saving…" : camp ? "Save changes" : "Add camp")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
