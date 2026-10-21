import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useRun } from "./toast";
import { Button, Field, Input, Modal, Notice, Panel, PanelTitle, Select, cx } from "./ui";
import { fmt, pct, qty } from "../lib/format";
import { useI18n } from "../i18n";

/** New-dispatch dialog. `campId`/`needId` preselect the form, e.g. when opened from a need row. */
export function DispatchModal({ campId, needId, onClose }: { campId?: string; needId?: string; onClose: () => void }) {
  return (
    <Modal onClose={onClose} width={480}>
      {(close) => <DispatchForm initialCamp={campId} initialNeed={needId} onDone={close} />}
    </Modal>
  );
}

function DispatchForm({ initialCamp = "", initialNeed = "", onDone }: { initialCamp?: string; initialNeed?: string; onDone: () => void }) {
  const { t } = useI18n();
  const camps = useQuery(api.camps.list);
  const needs = useQuery(api.needs.list);
  const create = useMutation(api.dispatches.create);
  const run = useRun();
  const [campId, setCampId] = useState(initialCamp);
  const [needId, setNeedId] = useState(initialNeed);
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);

  const limits = useQuery(api.dispatches.limits, needId ? { need_id: needId as Id<"needs"> } : "skip");
  const qtyRef = useRef<HTMLInputElement>(null);
  const ready = !!limits && limits.max > 0;
  // The input is disabled until limits load, so autoFocus can't land on it at mount.
  useEffect(() => {
    if (ready && initialNeed) qtyRef.current?.focus();
  }, [ready, initialNeed]);
  const openCamps = (camps ?? []).filter((c) => c.status !== "Closed");
  const campNeeds = (needs ?? []).filter((n) => n.camp_id === campId);
  const q = Number(quantity);

  let error: string | null = null;
  if (limits && quantity !== "") {
    if (!Number.isInteger(q) || q < 1) error = t("Enter a whole number of at least 1");
    else if (q > limits.stock) error = t("Only {quantity} of {name} in the warehouse. Lower the quantity or restock first.", { quantity: qty(limits.stock, limits.unit), name: t(limits.itemName) });
    else if (q > limits.remaining) error = t("Only {quantity} of this need is still unreserved.", { quantity: qty(limits.remaining, limits.unit) });
  }
  const canSubmit = !!limits && quantity !== "" && !error && limits.max > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const ok = await run(create({ camp_id: campId as Id<"camps">, need_id: needId as Id<"needs">, quantity: q }), t("Dispatch created · {quantity} reserved", { quantity: qty(q, limits!.unit) }));
    setBusy(false);
    if (ok) onDone();
  }

  const row = (label: string, value: string, strong = false, tone = "") => (
    <div className="flex justify-between border-b border-line py-2">
      <span className={cx("text-[13px]", strong ? "font-bold" : "text-ink-2", tone)}>{label}</span>
      <span className={cx("font-mono text-xs tabular-nums", strong && "font-semibold", tone)}>{value}</span>
    </div>
  );

  return (
    <Panel>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <PanelTitle kicker={t("New dispatch")} title={t("Send supplies to a camp")} onClose={onDone} />
        <Field label={t("{step} · Camp", { step: fmt(1) })}>
          <Select
            value={campId}
            onChange={(e) => {
              setCampId(e.target.value);
              setNeedId("");
              setQuantity("");
            }}
          >
            <option value="">{t("Choose a camp…")}</option>
            {openCamps.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} · {c.district}
                {c.criticalGaps ? t(" · {count} critical", { count: fmt(c.criticalGaps) }) : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("{step} · Need", { step: fmt(2) })}>
          <Select
            value={needId}
            onChange={(e) => {
              setNeedId(e.target.value);
              setQuantity("");
            }}
            disabled={!campId}
          >
            <option value="">{campId ? (campNeeds.length ? t("Choose a need…") : t("This camp has no needs yet")) : t("Choose a camp first")}</option>
            {campNeeds.map((n) => (
              <option key={n._id} value={n._id} disabled={n.remaining === 0}>
                {t(n.item?.name ?? "Unknown item")} · {t(n.priority)} · {t("{percent} met", { percent: pct(n.pct) })}{n.remaining === 0 ? t(" · fully covered") : ""}
              </option>
            ))}
          </Select>
        </Field>

        {limits && (
          <div className="flex flex-col rounded-lg border border-line bg-tint px-3.5 py-1.5">
            {row(t("Required"), qty(limits.required, limits.unit))}
            {row(t("− Delivered"), fmt(limits.fulfilled))}
            {row(t("− Open dispatches"), fmt(limits.reserved))}
            {row(t("Remaining unreserved"), fmt(limits.remaining), true)}
            {row(t("Warehouse stock available"), fmt(limits.stock), true, limits.stock < limits.remaining ? "text-alert" : "")}
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-sm font-bold">{t("Max you can send now")}</span>
              <span className="flex items-baseline gap-2">
                <span className={cx("text-[32px] font-extrabold leading-9 tracking-[-0.03em] tabular-nums", limits.max === 0 ? "text-alert" : "text-ok-ink")}>{fmt(limits.max)}</span>
                <span className="font-mono text-[11px] text-muted">{limits.max === 0 ? t("nothing left") : t("limited by {limit}", { limit: t(limits.limitedBy) })}</span>
              </span>
            </div>
          </div>
        )}
        <Field label={t("{step} · Quantity", { step: fmt(3) })} error={error}>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!limits || limits.max === 0}
              invalid={!!error}
              ref={qtyRef}
            />
            {limits && limits.max > 0 && (
              <Button type="button" variant="secondary" className="h-[42px] shrink-0" onClick={() => setQuantity(String(limits.max))}>
                {t("Use max · {count}", { count: fmt(limits.max) })}
              </Button>
            )}
          </div>
        </Field>
        {limits && limits.max === 0 && (
          <Notice tone="warning">{limits.stock === 0 ? t("This item is out of stock.") : t("This need is already covered by delivered and open dispatches.")}</Notice>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={!canSubmit || busy}>
            {busy ? t("Reserving…") : t("Reserve stock & dispatch")}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
