import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { wholeNumber } from "./lib/validate";
import { donationType } from "./schema";

const CATEGORIES = ["Food", "Water", "Medical", "Shelter", "Hygiene"] as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const [donations, items] = await Promise.all([
      ctx.db.query("donations").collect(),
      ctx.db.query("inventory").collect(),
    ]);
    const itemById = new Map(items.map((i) => [i._id, i]));
    const rows = donations
      .map((d) => {
        const item = d.item_id ? itemById.get(d.item_id) : undefined;
        return { ...d, itemName: item?.name ?? null, unit: item?.unit ?? null };
      })
      .sort((a, b) => b.created_at - a.created_at);

    const cash = rows.filter((d) => d.type === "Cash");
    const byCategory = CATEGORIES.map((category) => {
      const gifts = rows.filter((d) => d.type === "In-Kind" && d.category === category);
      return {
        category,
        count: gifts.length,
        lines: gifts.map((g) => `${g.amount_or_quantity.toLocaleString()} ${g.unit ?? ""} ${g.itemName ?? ""}`.trim()),
      };
    });
    return {
      rows,
      totals: {
        cash: cash.reduce((s, d) => s + d.amount_or_quantity, 0),
        cashCount: cash.length,
        inKindCount: rows.length - cash.length,
        byCategory,
      },
    };
  },
});

export const create = mutation({
  args: {
    type: donationType,
    amount_or_quantity: v.number(),
    item_id: v.optional(v.id("inventory")),
    donor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);
    const donor = args.donor?.trim().slice(0, 80) || undefined;

    if (args.type === "Cash") {
      const amount = wholeNumber(args.amount_or_quantity, "Amount", { min: 1 });
      return await ctx.db.insert("donations", {
        type: "Cash",
        amount_or_quantity: amount,
        category: "Cash",
        donor,
        created_at: Date.now(),
      });
    }

    if (!args.item_id) throw new ConvexError("Choose the item that was donated");
    const item = await ctx.db.get(args.item_id);
    if (!item) throw new ConvexError("Item not found");
    const qty = wholeNumber(args.amount_or_quantity, "Quantity", { min: 1 });

    // In-kind gifts go straight into warehouse stock.
    await ctx.db.patch(item._id, { stock: item.stock + qty });
    return await ctx.db.insert("donations", {
      type: "In-Kind",
      amount_or_quantity: qty,
      item_id: item._id,
      category: item.category,
      donor,
      created_at: Date.now(),
    });
  },
});
