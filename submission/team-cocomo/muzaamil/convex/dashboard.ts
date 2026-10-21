import { query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { average, CRITICAL_THRESHOLD, isLowStock, loadWorld, needRatio, OPEN_DISPATCH } from "./lib/metrics";

const CATEGORIES = ["Food", "Water", "Medical", "Shelter", "Hygiene"] as const;

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const w = await loadWorld(ctx);

    const activeCamps = w.camps.filter((c) => c.status !== "Closed");
    const openCapacity = activeCamps.reduce((s, c) => s + c.capacity, 0);
    const families = activeCamps.reduce((s, c) => s + c.current_families, 0);
    const lowStock = w.inventory.filter(isLowStock).sort((a, b) => a.stock / Math.max(1, a.reorder_level) - b.stock / Math.max(1, b.reorder_level));
    const deployed = w.volunteers.filter((vol) => vol.camp_id).length;

    const byCategory = CATEGORIES.map((category) => {
      const needs = w.needs.filter((n) => n.item?.category === category);
      return { category, pct: needs.length ? average(needs.map((n) => n.pct)) : null, needs: needs.length };
    });

    const criticalGaps = w.needs
      .filter((n) => n.isCriticalGap)
      .sort((a, b) => a.pct - b.pct || b.remaining - a.remaining)
      .map((n) => ({
        _id: n._id,
        campId: n.camp_id,
        campName: n.camp?.name ?? "",
        district: n.camp?.district ?? "",
        itemName: n.item?.name ?? "",
        unit: n.item?.unit ?? "",
        fulfilled: n.fulfilled_quantity,
        required: n.required_quantity,
        reserved: n.reserved,
        short: Math.max(0, n.required_quantity - n.fulfilled_quantity - n.reserved),
        pct: n.pct,
      }));

    const camps = w.camps.map((c) => {
      const needs = w.needs.filter((n) => n.camp_id === c._id);
      return {
        _id: c._id,
        name: c.name,
        district: c.district,
        status: c.status,
        lat: c.lat ?? null,
        lng: c.lng ?? null,
        capacity: c.capacity,
        families: c.current_families,
        needsMet: needs.length ? average(needs.map((n) => n.pct)) : null,
        criticalGaps: needs.filter((n) => n.isCriticalGap).length,
        volunteers: w.volunteers.filter((vol) => vol.camp_id === c._id).length,
        worstNeeds: needs
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 3)
          .map((n) => ({ itemName: n.item?.name ?? "", pct: n.pct })),
      };
    });

    const dispatchCounts = {
      Pending: 0,
      "In Transit": 0,
      Delivered: 0,
      Cancelled: 0,
    } as Record<string, number>;
    for (const d of w.dispatches) dispatchCounts[d.status]++;
    const open = w.dispatches.filter((d) => OPEN_DISPATCH.has(d.status));
    const needById = new Map(w.needs.map((n) => [n._id, n]));
    const routes = open.map((d) => ({
      _id: d._id,
      campId: d.camp_id,
      status: d.status,
    }));
    const recent = [...w.dispatches]
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 3)
      .map((d) => ({
        _id: d._id,
        status: d.status,
        quantity: d.quantity,
        itemName: needById.get(d.need_id)?.item?.name ?? "",
        unit: needById.get(d.need_id)?.item?.unit ?? "",
        campName: w.campById.get(d.camp_id)?.name ?? "",
      }));

    const cash = w.donations
      .filter((d) => d.type === "Cash")
      .reduce((s, d) => s + d.amount_or_quantity, 0);

    return {
      kpis: {
        activeCamps: activeCamps.length,
        totalCamps: w.camps.length,
        fullCamps: w.camps.filter((c) => c.status === "Full").length,
        closedCamps: w.camps.filter((c) => c.status === "Closed").length,
        families,
        openCapacity,
        fulfilment: average(w.needs.map((n) => n.pct)),
        lowStockCount: lowStock.length,
        itemCount: w.inventory.length,
        volunteersDeployed: deployed,
        volunteersTotal: w.volunteers.length,
      },
      byCategory,
      criticalGaps,
      camps,
      lowStock: lowStock.map((i) => ({ _id: i._id, name: i.name, category: i.category, unit: i.unit, stock: i.stock, reorder: i.reorder_level })),
      okStockCount: w.inventory.length - lowStock.length,
      dispatchCounts,
      dispatchTotal: w.dispatches.length,
      reservedUnits: open.reduce((s, d) => s + d.quantity, 0),
      reservedPending: open.filter((d) => d.status === "Pending").reduce((s, d) => s + d.quantity, 0),
      routes,
      recent,
      cash,
      inKind: w.donations.length - w.donations.filter((d) => d.type === "Cash").length,
      counts: {
        camps: w.camps.length,
        needs: w.needs.length,
        inventory: w.inventory.length,
        dispatches: w.dispatches.length,
        donations: w.donations.length,
        volunteers: w.volunteers.length,
      },
    };
  },
});

/** Lightweight counts for the navigation bar and footer. */
export const nav = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const [camps, needs, inventory, dispatches, donations, volunteers] = await Promise.all([
      ctx.db.query("camps").collect(),
      ctx.db.query("needs").collect(),
      ctx.db.query("inventory").collect(),
      ctx.db.query("dispatches").collect(),
      ctx.db.query("donations").collect(),
      ctx.db.query("volunteers").collect(),
    ]);
    return {
      camps: camps.length,
      needs: needs.length,
      inventory: inventory.length,
      dispatches: dispatches.length,
      donations: donations.length,
      volunteers: volunteers.length,
      criticalGaps: needs.filter((n) => n.priority === "High" && needRatio(n) < CRITICAL_THRESHOLD).length,
      lowStock: inventory.filter(isLowStock).length,
      cash: donations.filter((d) => d.type === "Cash").reduce((s, d) => s + d.amount_or_quantity, 0),
      inKind: donations.filter((d) => d.type === "In-Kind").length,
    };
  },
});
