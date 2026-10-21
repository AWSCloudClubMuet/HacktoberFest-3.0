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
import { useI18n } from "../i18n";
import { fmt, initials, pct, qty, stamp } from "../lib/format";

/** The field volunteer's home page: their camp, its needs, incoming deliveries and team. */
export default function MyAssignment() {
  const { t, language, dir } = useI18n();
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
    // Let the translated sentence place the inline profile link in its natural word order.
    const profileNotice = t("Add your name and skill on the {profile} so a coordinator can assign you to a camp.", {
      profile: "\uFFFC",
    }).split("\uFFFC");

    return (
      <div lang={language} dir={dir} className="contents text-start">
        <PageHeader kicker={t("My assignment")} title={t("You're not on the roster yet")} />
        <Notice tone="info">
          {profileNotice[0]}<Link to="/profile" className="font-semibold underline">{t("profile page")}</Link>{profileNotice[1]}
        </Notice>
      </div>
    );
  }

  if (!data.camp) {
    return (
      <div lang={language} dir={dir} className="contents text-start">
        <PageHeader kicker={t("My assignment")} title={t("No camp assigned yet")} />
        <Notice tone="info">
          {t("You're on the volunteer roster. A coordinator will assign you to a camp, and its needs, deliveries and team will show up here.")}
        </Notice>
      </div>
    );
  }

  const { camp, needs, deliveries, team } = data;

  return (
    <div lang={language} dir={dir} className="contents text-start">
      <PageHeader
        kicker={t("My assignment")}
        title={camp.name}
        deck={
          <>
            {t("{district} district", { district: camp.district })} · <CampStatusPill status={camp.status} />
          </>
        }
        actions={camp.criticalGaps > 0 ? <Badge tone="danger">{t("{count} critical gaps", { count: fmt(camp.criticalGaps) })}</Badge> : <Badge tone="success">{t("No critical gaps")}</Badge>}
      />

      <StatStrip cols={4}>
        <Stat label={t("Families sheltered")} value={fmt(camp.families)} sub={t("of {capacity} capacity", { capacity: fmt(camp.capacity) })} />
        <Stat label={t("Needs met")} value={pct(camp.needsMet)} sub={t("{count} tracked needs", { count: fmt(needs.length) })} />
        <Stat label={t("Open deliveries")} value={fmt(data.openDeliveries)} sub={t("pending or on the road")} tone={data.openDeliveries > 0 ? "info" : undefined} />
        <Stat label={t("Team at camp")} value={fmt(team.length)} sub={t("volunteers assigned here")} />
      </StatStrip>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title={t("Camp needs")}
              sub={t("Most urgent first")}
              right={camp.criticalGaps > 0 ? <Badge tone="danger">{t("{count} critical", { count: fmt(camp.criticalGaps) })}</Badge> : undefined}
            />
            {needs.length === 0 ? (
              <Empty>{t("No needs recorded for this camp yet.")}</Empty>
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
                        {t("{fulfilled} of {required} delivered", { fulfilled: qty(n.fulfilled, n.unit), required: qty(n.required, n.unit) })}
                        {n.reserved > 0 && <> · {t("{quantity} on the way", { quantity: qty(n.reserved, n.unit) })}</>}
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
            <CardHeader title={t("Deliveries")} sub={t("Supplies heading to this camp")} right={data.openDeliveries > 0 ? <Badge tone="info">{t("{count} open", { count: fmt(data.openDeliveries) })}</Badge> : undefined} />
            {deliveries.length === 0 ? (
              <Empty>{t("No deliveries to this camp yet.")}</Empty>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {deliveries.map((d) => (
                  <div key={d._id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">{t("{quantity} of {item}", { quantity: qty(d.quantity, d.unit), item: d.itemName })}</span>
                      <span className="text-xs text-muted">{stamp(d.created_at)}</span>
                    </div>
                    <DispatchPill status={d.status} />
                    {d.status === "In Transit" && (
                      <Button
                        onClick={() =>
                          void run(markDelivered({ id: d._id as Id<"dispatches"> }), t("Marked as delivered"))
                        }
                      >
                        {t("Mark delivered")}
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
            <CardHeader title={t("Location")} sub={t("{district} district", { district: camp.district })} />
            <ReliefMap camps={mapCamp} focusId={camp._id} selectedId={camp._id} height={280} />
          </Card>

          <Card>
            <CardHeader title={t("Team")} sub={t("{count} volunteers at {camp}", { count: fmt(team.length), camp: camp.name })} />
            {team.length === 0 ? (
              <Empty>{t("You're the only one here so far.")}</Empty>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {team.map((member) => (
                  <div key={member._id} className="flex items-center gap-3 px-6 py-3">
                    <Avatar name={initials(member.name)} tone={member.me ? "solid" : "soft"} />
                    <span className={cx("flex-1 truncate text-sm", member.me ? "font-bold" : "font-medium")}>
                      {member.name}
                      {member.me && <span className="ms-1.5 text-xs font-semibold text-muted">{t("(you)")}</span>}
                    </span>
                    <SkillPill skill={member.skill} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
