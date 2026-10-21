import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireCoordinator, requireUser } from "./lib/auth";
import { loadWorld, OPEN_DISPATCH, openReservedForNeed } from "./lib/metrics";
import { wholeNumber } from "./lib/validate";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const world = await loadWorld(ctx);
    const needById = new Map(world.needs.map((n) => [n._id, n]));
    return world.dispatches
      .map((d) => {
        const need = needById.get(d.need_id);
        return {
          ...d,
          campName: world.campById.get(d.camp_id)?.name ?? "Unknown camp",
          district: world.campById.get(d.camp_id)?.district ?? "",
          itemName: need?.item?.name ?? "Unknown item",
          unit: need?.item?.unit ?? "",
        };
      })
      .sort((a, b) => b.created_at - a.created_at);
  },
});

/** Limits the dispatch form shows before anything is reserved. */
export const limits = query({
  args: { need_id: v.id("needs") },
  handler: async (ctx, { need_id }) => {
    await requireCoordinator(ctx);
    const need = await ctx.db.get(need_id);
    if (!need) return null;
    const item = await ctx.db.get(need.inventory_item_id);
    const reserved = await openReservedForNeed(ctx, need_id);
    const remaining = Math.max(0, need.required_quantity - need.fulfilled_quantity - reserved);
    const stock = item?.stock ?? 0;
    return {
      required: need.required_quantity,
      fulfilled: need.fulfilled_quantity,
      reserved,
      remaining,
      stock,
      unit: item?.unit ?? "",
      itemName: item?.name ?? "",
      max: Math.min(stock, remaining),
      limitedBy: stock < remaining ? ("stock" as const) : ("need" as const),
    };
  },
});

export const create = mutation({
  args: { camp_id: v.id("camps"), need_id: v.id("needs"), quantity: v.number() },
  handler: async (ctx, { camp_id, need_id, quantity }) => {
    await requireCoordinator(ctx);
    const need = await ctx.db.get(need_id);
    if (!need) throw new ConvexError("Choose a need");
    if (need.camp_id !== camp_id) throw new ConvexError("That need belongs to a different camp");
    const camp = await ctx.db.get(camp_id);
    if (!camp) throw new ConvexError("Camp not found");
    if (camp.status === "Closed") throw new ConvexError("Can't dispatch to a closed camp");
    const item = await ctx.db.get(need.inventory_item_id);
    if (!item) throw new ConvexError("Inventory item not found");

    const qty = wholeNumber(quantity, "Quantity", { min: 1 });
    if (qty > item.stock) {
      throw new ConvexError(`Only ${item.stock} ${item.unit} of ${item.name} in the warehouse`);
    }
    const reserved = await openReservedForNeed(ctx, need_id);
    const remaining = need.required_quantity - need.fulfilled_quantity - reserved;
    if (qty > remaining) {
      throw new ConvexError(
        remaining <= 0
          ? "This need is already fully covered by delivered and open dispatches"
          : `Only ${remaining} ${item.unit} of this need is still unreserved`,
      );
    }

    // Reserve stock the moment the dispatch exists.
    await ctx.db.patch(item._id, { stock: item.stock - qty });
    return await ctx.db.insert("dispatches", {
      camp_id,
      need_id,
      quantity: qty,
      status: "Pending",
      created_at: Date.now(),
    });
  },
});

async function getDispatch(ctx: MutationCtx, id: Id<"dispatches">) {
  const d = await ctx.db.get(id);
  if (!d) throw new ConvexError("Dispatch not found");
  return d;
}

export const markInTransit = mutation({
  args: { id: v.id("dispatches") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const d = await getDispatch(ctx, id);
    if (d.status !== "Pending") throw new ConvexError(`A ${d.status.toLowerCase()} dispatch can't go in transit`);
    await ctx.db.patch(id, { status: "In Transit" });
  },
});

export const markDelivered = mutation({
  args: { id: v.id("dispatches") },
  handler: async (ctx, { id }) => {
    // Field volunteers confirm deliveries arriving at their own camp; coordinators confirm any.
    const user = await requireUser(ctx);
    const d = await getDispatch(ctx, id);
    if (user.role !== "coordinator") {
      const vol = await ctx.db
        .query("volunteers")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .first();
      if (!vol?.camp_id || vol.camp_id !== d.camp_id) {
        throw new ConvexError("You can only confirm deliveries for your own camp");
      }
    }
    if (d.status !== "In Transit") {
      throw new ConvexError("Only dispatches that are in transit can be marked delivered");
    }
    const need = await ctx.db.get(d.need_id);
    if (need) {
      await ctx.db.patch(need._id, {
        fulfilled_quantity: need.fulfilled_quantity + d.quantity,
      });
    }
    await ctx.db.patch(id, { status: "Delivered" });
  },
});

export const cancel = mutation({
  args: { id: v.id("dispatches") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const d: Doc<"dispatches"> = await getDispatch(ctx, id);
    if (!OPEN_DISPATCH.has(d.status)) {
      throw new ConvexError(`A ${d.status.toLowerCase()} dispatch can't be cancelled`);
    }
    const need = await ctx.db.get(d.need_id);
    const item = need ? await ctx.db.get(need.inventory_item_id) : null;
    if (item) await ctx.db.patch(item._id, { stock: item.stock + d.quantity });
    await ctx.db.patch(id, { status: "Cancelled" });
  },
});
