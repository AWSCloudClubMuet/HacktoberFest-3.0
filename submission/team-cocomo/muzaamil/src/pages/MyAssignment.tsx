import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ReliefMap from "../components/ReliefMap";
import { useRun } from "../components/toast";
import {
  Avatar,
  Badge,
  Button,
  CampStatusPill,
  Card,
  CardHeader,
  DispatchPill,
  Empty,
  Loading,
  Meter,
  Notice,
  PageHeader,
  PriorityPill,
  SkillPill,
  Stat,
  StatStrip,
  cx,
  ratioColor,
} from "../components/ui";
import { fmt, initials, pct, qty, stamp } from "../lib/format";

/** The field volunteer's home page: their camp, its needs, incoming deliveries and team. */
export default function MyAssignment() {
  const data = useQuery(api.me.assignment);
  const run = useRun();
  const markDelivered = useMutation(api.dispatches.markDelivered);

  const mapCamp = useMemo(
    () =>
      data?.camp
        ? [
            {
              _id: data.camp._id,
              name: data.camp.name,
              district: data.camp.district,
              status: data.camp.status,
              lat: data.camp.lat,
              lng: data.camp.lng,
              families: data.camp.families,
              needsMet: data.camp.needsMet,
              criticalGaps: data.camp.criticalGaps,
            },
          ]
        : [],
    [data],
  );

  if (data === undefined) return <Loading />;

  if (!data.linked) {
    return (
      <>
        <PageHeader kicker="My assignment" title="You're not on the roster yet" />
        <Notice tone="info">
          Add your name and skill on the <Link to="/profile" className="font-semibold underline">profile page</Link> so a
          coordinator can assign you to a camp.
        </Notice>
      </>
    );
  }

  if (!data.camp) {
    return (
      <>
        <PageHeader kicker="My assignment" title="No camp assigned yet" />
        <Notice tone="info">
          You're on the volunteer roster. A coordinator will assign you to a camp, and its needs, deliveries and team
          will show up here.
        </Notice>
      </>
    );
  }

  const { camp, needs, deliveries, team } = data;

  return (
    <>
      <PageHeader
        kicker="My assignment"
        title={camp.name}
        deck={
          <>
            {camp.district} district · <CampStatusPill status={camp.status} />
          </>
        }
        actions={camp.criticalGaps > 0 ? <Badge tone="danger">{camp.criticalGaps} critical gaps</Badge> : <Badge tone="success">No critical gaps</Badge>}
      />

      <StatStrip cols={4}>
        <Stat label="Families sheltered" value={fmt(camp.families)} sub={`of ${fmt(camp.capacity)} capacity`} />
        <Stat label="Needs met" value={pct(camp.needsMet)} sub={`${needs.length} tracked needs`} />
        <Stat label="Open deliveries" value={fmt(data.openDeliveries)} sub="pending or on the road" tone={data.openDeliveries > 0 ? "info" : undefined} />
        <Stat label="Team at camp" value={fmt(team.length)} sub="volunteers assigned here" />
      </StatStrip>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Camp needs"
              sub="Most urgent first"
              right={camp.criticalGaps > 0 ? <Badge tone="danger">{camp.criticalGaps} critical</Badge> : undefined}
            />
            {needs.length === 0 ? (
              <Empty>No needs recorded for this camp yet.</Empty>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {needs.map((n) => (
                  <div key={n._id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{n.itemName}</span>
                        <PriorityPill priority={n.priority} />
                      </span>
                      <span className="text-xs text-muted">
                        {qty(n.fulfilled, n.unit)} of {qty(n.required, n.unit)} delivered
                        {n.reserved > 0 && ` · ${qty(n.reserved, n.unit)} on the way`}
                      </span>
                    </div>
                    <div className="flex w-40 flex-col items-end gap-1.5">
                      <span className="font-mono text-xs font-semibold" style={{ color: ratioColor(n.pct) }}>
                        {pct(n.pct)}
                      </span>
                      <Meter ratio={n.pct} color={ratioColor(n.pct)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Deliveries" sub="Supplies heading to this camp" right={data.openDeliveries > 0 ? <Badge tone="info">{data.openDeliveries} open</Badge> : undefined} />
            {deliveries.length === 0 ? (
              <Empty>No deliveries to this camp yet.</Empty>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {deliveries.map((d) => (
                  <div key={d._id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">{qty(d.quantity, d.unit)} of {d.itemName}</span>
                      <span className="text-xs text-muted">{stamp(d.created_at)}</span>
                    </div>
                    <DispatchPill status={d.status} />
                    {d.status === "In Transit" && (
                      <Button
                        onClick={() =>
                          void run(markDelivered({ id: d._id as Id<"dispatches"> }), "Marked as delivered")
                        }
                      >
                        Mark delivered
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col">
            <CardHeader title="Location" sub={`${camp.district} district`} />
            <ReliefMap camps={mapCamp} focusId={camp._id} selectedId={camp._id} height={280} />
          </Card>

          <Card>
            <CardHeader title="Team" sub={`${team.length} volunteers at ${camp.name}`} />
            {team.length === 0 ? (
              <Empty>You're the only one here so far.</Empty>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {team.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 px-6 py-3">
                    <Avatar name={initials(t.name)} tone={t.me ? "solid" : "soft"} />
                    <span className={cx("flex-1 truncate text-sm", t.me ? "font-bold" : "font-medium")}>
                      {t.name}
                      {t.me && <span className="ml-1.5 text-xs font-semibold text-muted">(you)</span>}
                    </span>
                    <SkillPill skill={t.skill} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
