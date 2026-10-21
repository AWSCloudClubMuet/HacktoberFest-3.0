import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { isLowStock, OPEN_DISPATCH } from "./lib/metrics";
import { cleanText, wholeNumber } from "./lib/validate";
import { category } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const [items, needs, dispatches] = await Promise.all([
      ctx.db.query("inventory").collect(),
      ctx.db.query("needs").collect(),
      ctx.db.query("dispatches").collect(),
    ]);
    const itemByNeed = new Map(needs.map((n) => [n._id, n.inventory_item_id]));
    const reserved = new Map<string, number>();
    for (const d of dispatches) {
      if (!OPEN_DISPATCH.has(d.status)) continue;
      const itemId = itemByNeed.get(d.need_id);
      if (itemId) reserved.set(itemId, (reserved.get(itemId) ?? 0) + d.quantity);
    }
    return items
      .map((item) => ({
        ...item,
        lowStock: isLowStock(item),
        reserved: reserved.get(item._id) ?? 0,
        needCount: needs.filter((n) => n.inventory_item_id === item._id).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

const itemFields = {
  name: v.string(),
  category,
  unit: v.string(),
  stock: v.number(),
  reorder_level: v.number(),
};

function validateItem(args: {
  name: string;
  category: "Food" | "Water" | "Medical" | "Shelter" | "Hygiene";
  unit: string;
  stock: number;
  reorder_level: number;
}) {
  return {
    name: cleanText(args.name, "Item name"),
    category: args.category,
    unit: cleanText(args.unit, "Unit", 20),
    stock: wholeNumber(args.stock, "Stock"),
    reorder_level: wholeNumber(args.reorder_level, "Reorder level"),
  };
}

export const create = mutation({
  args: itemFields,
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);
    const item = validateItem(args);
    const dupe = (await ctx.db.query("inventory").collect()).find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (dupe) throw new ConvexError(`"${item.name}" is already in the warehouse`);
    return await ctx.db.insert("inventory", item);
  },
});

export const update = mutation({
  args: { id: v.id("inventory"), ...itemFields },
  handler: async (ctx, { id, ...args }) => {
    await requireCoordinator(ctx);
    if (!(await ctx.db.get(id))) throw new ConvexError("Item not found");
    await ctx.db.patch(id, validateItem(args));
  },
});

/** Adds a delivery to stock on hand without touching the item's other fields. */
export const restock = mutation({
  args: { id: v.id("inventory"), quantity: v.number() },
  handler: async (ctx, { id, quantity }) => {
    await requireCoordinator(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError("Item not found");
    const qty = wholeNumber(quantity, "Quantity", { min: 1 });
    await ctx.db.patch(id, { stock: item.stock + qty });
    return item.stock + qty;
  },
});

export const remove = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const used = await ctx.db
      .query("needs")
      .withIndex("by_item", (q) => q.eq("inventory_item_id", id))
      .first();
    if (used) {
      throw new ConvexError("This item is linked to camp needs. Remove those needs first.");
    }
    await ctx.db.delete(id);
  },
});
