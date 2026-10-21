import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { average, needRatio, OPEN_DISPATCH, reservedByNeed } from "./lib/metrics";
import { cleanText } from "./lib/validate";
import { skill } from "./schema";

async function rosterEntry(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("volunteers")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .first();
}

/** The signed-in person's account plus their volunteer roster entry, if they have one. */
export const profile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const vol = await rosterEntry(ctx, user._id);
    const camp = vol?.camp_id ? await ctx.db.get(vol.camp_id) : null;
    return {
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "volunteer",
      volunteer: vol ? { _id: vol._id, name: vol.name, skill: vol.skill, phone: vol.phone ?? "", campName: camp?.name ?? null } : null,
    };
  },
});

/**
 * Volunteers manage only their own details. Saving the first time adds them to the
 * roster (unassigned) so a coordinator can place them at a camp.
 */
export const saveProfile = mutation({
  args: { name: v.string(), skill: v.optional(skill), phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = cleanText(args.name, "Name");
    const phone = args.phone?.trim().slice(0, 30) || undefined;
    await ctx.db.patch(user._id, { name });
    if (user.role === "coordinator") return null;

    const vol = await rosterEntry(ctx, user._id);
    if (vol) {
      await ctx.db.patch(vol._id, { name, phone, ...(args.skill ? { skill: args.skill } : {}) });
      return vol._id;
    }
    if (!args.skill) throw new ConvexError("Choose your main skill");
    return await ctx.db.insert("volunteers", { name, skill: args.skill, phone, user_id: user._id });
  },
});

/** Everything a field volunteer needs about their own camp, and nothing about the others. */
export const assignment = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const vol = await rosterEntry(ctx, user._id);
    if (!vol?.camp_id) return { linked: !!vol, camp: null };
    const camp = await ctx.db.get(vol.camp_id);
    if (!camp || camp.status === "Closed") return { linked: true, camp: null };

    const [needs, dispatches, team] = await Promise.all([
      ctx.db.query("needs").withIndex("by_camp", (q) => q.eq("camp_id", camp._id)).collect(),
      ctx.db.query("dispatches").withIndex("by_camp", (q) => q.eq("camp_id", camp._id)).collect(),
      ctx.db.query("volunteers").withIndex("by_camp", (q) => q.eq("camp_id", camp._id)).collect(),
    ]);
    const items = new Map((await Promise.all(needs.map((n) => ctx.db.get(n.inventory_item_id)))).flatMap((i) => (i ? [[i._id, i] as const] : [])));
    const reserved = reservedByNeed(dispatches);
    const needRows = needs
      .map((n) => {
        const item = items.get(n.inventory_item_id);
        return {
          _id: n._id,
          itemName: item?.name ?? "Item",
          unit: item?.unit ?? "",
          priority: n.priority,
          required: n.required_quantity,
          fulfilled: n.fulfilled_quantity,
          reserved: reserved.get(n._id) ?? 0,
          pct: needRatio(n),
        };
      })
      .sort((a, b) => a.pct - b.pct);
    const needById = new Map(needRows.map((n) => [n._id, n]));
    const deliveries = dispatches
      .filter((d) => d.status !== "Cancelled")
      .sort((a, b) => b.created_at - a.created_at)
      .map((d) => ({
        _id: d._id,
        status: d.status,
        quantity: d.quantity,
        created_at: d.created_at,
        itemName: needById.get(d.need_id)?.itemName ?? "Item",
        unit: needById.get(d.need_id)?.unit ?? "",
      }));

    return {
      linked: true,
      camp: {
        _id: camp._id,
        name: camp.name,
        district: camp.district,
        status: camp.status,
        capacity: camp.capacity,
        families: camp.current_families,
        lat: camp.lat ?? null,
        lng: camp.lng ?? null,
        needsMet: needRows.length ? average(needRows.map((n) => n.pct)) : null,
        criticalGaps: needRows.filter((n) => n.priority === "High" && n.pct < 0.4).length,
      },
      needs: needRows,
      deliveries,
      openDeliveries: deliveries.filter((d) => OPEN_DISPATCH.has(d.status)).length,
      team: team.map((t) => ({ _id: t._id, name: t.name, skill: t.skill, me: t._id === vol._id })),
    };
  },
});
