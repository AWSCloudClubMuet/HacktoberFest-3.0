import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { loadWorld, openReservedForNeed } from "./lib/metrics";
import { wholeNumber } from "./lib/validate";
import { priority } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const world = await loadWorld(ctx);
    return world.needs.sort((a, b) => a.pct - b.pct);
  },
});

export const create = mutation({
  args: {
    camp_id: v.id("camps"),
    inventory_item_id: v.id("inventory"),
    required_quantity: v.number(),
    priority,
  },
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);
    const camp = await ctx.db.get(args.camp_id);
    if (!camp) throw new ConvexError("Camp not found");
    if (camp.status === "Closed") throw new ConvexError("Closed camps can't take new needs");
    const item = await ctx.db.get(args.inventory_item_id);
    if (!item) throw new ConvexError("Choose an inventory item");
    const required = wholeNumber(args.required_quantity, "Required quantity", { min: 1 });

    const existing = await ctx.db
      .query("needs")
      .withIndex("by_camp", (q) => q.eq("camp_id", args.camp_id))
      .collect();
    if (existing.some((n) => n.inventory_item_id === args.inventory_item_id)) {
      throw new ConvexError(`${camp.name} already has a need for ${item.name}. Edit that one instead.`);
    }
    return await ctx.db.insert("needs", {
      camp_id: args.camp_id,
      inventory_item_id: args.inventory_item_id,
      required_quantity: required,
      priority: args.priority,
      fulfilled_quantity: 0,
    });
  },
});

export const update = mutation({
  args: { id: v.id("needs"), required_quantity: v.number(), priority },
  handler: async (ctx, { id, required_quantity, priority }) => {
    await requireCoordinator(ctx);
    const need = await ctx.db.get(id);
    if (!need) throw new ConvexError("Need not found");
    const required = wholeNumber(required_quantity, "Required quantity", { min: 1 });
    const committed = need.fulfilled_quantity + (await openReservedForNeed(ctx, id));
    if (required < committed) {
      throw new ConvexError(
        `Required can't drop below ${committed}: that much is already delivered or on the way`,
      );
    }
    await ctx.db.patch(id, { required_quantity: required, priority });
  },
});

export const remove = mutation({
  args: { id: v.id("needs") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    if ((await openReservedForNeed(ctx, id)) > 0) {
      throw new ConvexError("Cancel or deliver this need's open dispatches before removing it");
    }
    const history = await ctx.db
      .query("dispatches")
      .withIndex("by_need", (q) => q.eq("need_id", id))
      .collect();
    for (const d of history) await ctx.db.delete(d._id);
    await ctx.db.delete(id);
  },
});
