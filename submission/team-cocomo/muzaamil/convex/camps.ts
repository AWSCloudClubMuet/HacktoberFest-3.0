import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { average, deriveCampStatus, loadWorld, OPEN_DISPATCH } from "./lib/metrics";
import { cleanText, wholeNumber } from "./lib/validate";
import { campStatus } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const world = await loadWorld(ctx);
    return world.camps
      .map((camp) => {
        const needs = world.needs.filter((n) => n.camp_id === camp._id);
        return {
          ...camp,
          needCount: needs.length,
          needsMet: needs.length ? average(needs.map((n) => n.pct)) : null,
          criticalGaps: needs.filter((n) => n.isCriticalGap).length,
          volunteers: world.volunteers.filter((vol) => vol.camp_id === camp._id).length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const get = query({
  args: { id: v.id("camps") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const world = await loadWorld(ctx);
    const camp = world.campById.get(id);
    if (!camp) return null;
    const needs = world.needs
      .filter((n) => n.camp_id === id)
      .sort((a, b) => a.pct - b.pct);
    const dispatches = world.dispatches
      .filter((d) => d.camp_id === id)
      .sort((a, b) => b.created_at - a.created_at)
      .map((d) => {
        const need = needs.find((n) => n._id === d.need_id);
        return { ...d, itemName: need?.item?.name ?? "Item", unit: need?.item?.unit ?? "" };
      });
    return {
      camp,
      needs,
      needsMet: needs.length ? average(needs.map((n) => n.pct)) : null,
      criticalGaps: needs.filter((n) => n.isCriticalGap).length,
      openDispatches: dispatches.filter((d) => OPEN_DISPATCH.has(d.status)).length,
      reservedUnits: needs.reduce((s, n) => s + n.reserved, 0),
      dispatches,
      volunteers: world.volunteers.filter((vol) => vol.camp_id === id),
    };
  },
});

const campFields = {
  name: v.string(),
  district: v.string(),
  capacity: v.number(),
  current_families: v.number(),
  status: campStatus,
};

function validateCamp(args: {
  name: string;
  district: string;
  capacity: number;
  current_families: number;
  status: "Open" | "Full" | "Closed";
}) {
  const name = cleanText(args.name, "Camp name");
  const district = cleanText(args.district, "District", 40);
  const capacity = wholeNumber(args.capacity, "Capacity", { min: 1 });
  const current = wholeNumber(args.current_families, "Current families");
  if (current > capacity) {
    throw new ConvexError(
      `Current families (${current}) can't be more than capacity (${capacity})`,
    );
  }
  return {
    name,
    district,
    capacity,
    current_families: current,
    status: deriveCampStatus(args.status, current, capacity),
  };
}

export const create = mutation({
  args: campFields,
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);
    const camp = validateCamp(args);
    const dupe = (await ctx.db.query("camps").collect()).find(
      (c) => c.name.toLowerCase() === camp.name.toLowerCase(),
    );
    if (dupe) throw new ConvexError(`A camp named "${camp.name}" already exists`);
    return await ctx.db.insert("camps", camp);
  },
});

export const update = mutation({
  args: { id: v.id("camps"), ...campFields },
  handler: async (ctx, { id, ...args }) => {
    await requireCoordinator(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError("Camp not found");
    const camp = validateCamp(args);
    await ctx.db.patch(id, camp);

    // Volunteers can't stay assigned to a closed camp.
    let unassigned = 0;
    if (camp.status === "Closed" && existing.status !== "Closed") {
      const vols = await ctx.db
        .query("volunteers")
        .withIndex("by_camp", (q) => q.eq("camp_id", id))
        .collect();
      for (const vol of vols) {
        await ctx.db.patch(vol._id, { camp_id: undefined });
        unassigned++;
      }
    }
    return { status: camp.status, unassigned };
  },
});

export const remove = mutation({
  args: { id: v.id("camps") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const camp = await ctx.db.get(id);
    if (!camp) throw new ConvexError("Camp not found");

    const dispatches = await ctx.db
      .query("dispatches")
      .withIndex("by_camp", (q) => q.eq("camp_id", id))
      .collect();
    if (dispatches.some((d) => OPEN_DISPATCH.has(d.status))) {
      throw new ConvexError(
        "This camp has dispatches on the way. Deliver or cancel them before deleting the camp.",
      );
    }
    for (const d of dispatches) await ctx.db.delete(d._id);

    const needs = await ctx.db
      .query("needs")
      .withIndex("by_camp", (q) => q.eq("camp_id", id))
      .collect();
    for (const n of needs) await ctx.db.delete(n._id);

    const vols = await ctx.db
      .query("volunteers")
      .withIndex("by_camp", (q) => q.eq("camp_id", id))
      .collect();
    for (const vol of vols) await ctx.db.patch(vol._id, { camp_id: undefined });

    await ctx.db.delete(id);
  },
});
