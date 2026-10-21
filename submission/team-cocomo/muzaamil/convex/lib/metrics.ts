import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const OPEN_DISPATCH = new Set(["Pending", "In Transit"]);
export const CRITICAL_THRESHOLD = 0.4;

export type NeedView = Doc<"needs"> & {
  item: Doc<"inventory"> | null;
  camp: Doc<"camps"> | null;
  reserved: number;
  remaining: number;
  pct: number;
  isCriticalGap: boolean;
};

export function needRatio(need: Pick<Doc<"needs">, "fulfilled_quantity" | "required_quantity">) {
  if (need.required_quantity <= 0) return 1;
  return Math.min(1, need.fulfilled_quantity / need.required_quantity);
}

/** Sum of quantities in Pending / In Transit dispatches, keyed by need. */
export function reservedByNeed(dispatches: Doc<"dispatches">[]) {
  const map = new Map<Id<"needs">, number>();
  for (const d of dispatches) {
    if (!OPEN_DISPATCH.has(d.status)) continue;
    map.set(d.need_id, (map.get(d.need_id) ?? 0) + d.quantity);
  }
  return map;
}

export async function openReservedForNeed(ctx: QueryCtx, needId: Id<"needs">) {
  const rows = await ctx.db
    .query("dispatches")
    .withIndex("by_need", (q) => q.eq("need_id", needId))
    .collect();
  return rows
    .filter((d) => OPEN_DISPATCH.has(d.status))
    .reduce((sum, d) => sum + d.quantity, 0);
}

/** Loads every collection once; the dataset is small enough for in-memory joins. */
export async function loadWorld(ctx: QueryCtx) {
  const [camps, inventory, needs, dispatches, donations, volunteers] =
    await Promise.all([
      ctx.db.query("camps").collect(),
      ctx.db.query("inventory").collect(),
      ctx.db.query("needs").collect(),
      ctx.db.query("dispatches").collect(),
      ctx.db.query("donations").collect(),
      ctx.db.query("volunteers").collect(),
    ]);
  const campById = new Map(camps.map((c) => [c._id, c]));
  const itemById = new Map(inventory.map((i) => [i._id, i]));
  const reserved = reservedByNeed(dispatches);

  const needViews: NeedView[] = needs.map((n) => {
    const r = reserved.get(n._id) ?? 0;
    const pct = needRatio(n);
    return {
      ...n,
      item: itemById.get(n.inventory_item_id) ?? null,
      camp: campById.get(n.camp_id) ?? null,
      reserved: r,
      remaining: Math.max(0, n.required_quantity - n.fulfilled_quantity - r),
      pct,
      isCriticalGap: n.priority === "High" && pct < CRITICAL_THRESHOLD,
    };
  });

  return {
    camps,
    inventory,
    needs: needViews,
    dispatches,
    donations,
    volunteers,
    campById,
    itemById,
  };
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function isLowStock(item: Doc<"inventory">) {
  return item.stock <= item.reorder_level;
}

/** Camp status follows capacity unless the camp is closed. */
export function deriveCampStatus(
  requested: Doc<"camps">["status"],
  currentFamilies: number,
  capacity: number,
): Doc<"camps">["status"] {
  if (requested === "Closed") return "Closed";
  return currentFamilies >= capacity ? "Full" : "Open";
}
