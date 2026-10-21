import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useRun } from "./toast";
import { Button, Field, Input, Modal, Notice, Panel, PanelTitle, Select, cx } from "./ui";
import { fmt, qty } from "../lib/format";

/** New-dispatch dialog. `campId`/`needId` preselect the form, e.g. when opened from a need row. */
export function DispatchModal({ campId, needId, onClose }: { campId?: string; needId?: string; onClose: () => void }) {
  return (
    <Modal onClose={onClose} width={480}>
      {(close) => <DispatchForm initialCamp={campId} initialNeed={needId} onDone={close} />}
    </Modal>
  );
}

function DispatchForm({ initialCamp = "", initialNeed = "", onDone }: { initialCamp?: string; initialNeed?: string; onDone: () => void }) {
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
    if (!Number.isInteger(q) || q < 1) error = "Enter a whole number of at least 1";
    else if (q > limits.stock) error = `Only ${qty(limits.stock, limits.unit)} of ${limits.itemName} in the warehouse. Lower the quantity or restock first.`;
    else if (q > limits.remaining) error = `Only ${qty(limits.remaining, limits.unit)} of this need is still unreserved.`;
  }
  const canSubmit = !!limits && quantity !== "" && !error && limits.max > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const ok = await run(create({ camp_id: campId as Id<"camps">, need_id: needId as Id<"needs">, quantity: q }), `Dispatch created · ${qty(q, limits!.unit)} reserved`);
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
        <PanelTitle kicker="New dispatch" title="Send supplies to a camp" onClose={onDone} />
        <Field label="1 · Camp">
          <Select
            value={campId}
            onChange={(e) => {
              setCampId(e.target.value);
              setNeedId("");
              setQuantity("");
            }}
          >
            <option value="">Choose a camp…</option>
            {openCamps.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} · {c.district}
                {c.criticalGaps ? ` · ${c.criticalGaps} critical` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="2 · Need">
          <Select
            value={needId}
            onChange={(e) => {
              setNeedId(e.target.value);
              setQuantity("");
            }}
            disabled={!campId}
          >
            <option value="">{campId ? (campNeeds.length ? "Choose a need…" : "This camp has no needs yet") : "Choose a camp first"}</option>
            {campNeeds.map((n) => (
              <option key={n._id} value={n._id} disabled={n.remaining === 0}>
                {n.item?.name} · {n.priority} · {Math.round(n.pct * 100)}% met{n.remaining === 0 ? " · fully covered" : ""}
              </option>
            ))}
          </Select>
        </Field>

        {limits && (
          <div className="flex flex-col rounded-lg border border-line bg-tint px-3.5 py-1.5">
            {row("Required", qty(limits.required, limits.unit))}
            {row("− Delivered", fmt(limits.fulfilled))}
            {row("− Open dispatches", fmt(limits.reserved))}
            {row("Remaining unreserved", fmt(limits.remaining), true)}
            {row("Warehouse stock available", fmt(limits.stock), true, limits.stock < limits.remaining ? "text-alert" : "")}
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-sm font-bold">Max you can send now</span>
              <span className="flex items-baseline gap-2">
                <span className={cx("text-[32px] font-extrabold leading-9 tracking-[-0.03em] tabular-nums", limits.max === 0 ? "text-alert" : "text-ok-ink")}>{fmt(limits.max)}</span>
                <span className="font-mono text-[11px] text-muted">{limits.max === 0 ? "nothing left" : `limited by ${limits.limitedBy}`}</span>
              </span>
            </div>
          </div>
        )}
        <Field label="3 · Quantity" error={error}>
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
                Use max · {fmt(limits.max)}
              </Button>
            )}
          </div>
        </Field>
        {limits && limits.max === 0 && (
          <Notice tone="warning">{limits.stock === 0 ? "This item is out of stock." : "This need is already covered by delivered and open dispatches."}</Notice>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[1.4]" disabled={!canSubmit || busy}>
            {busy ? "Reserving…" : "Reserve stock & dispatch"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
