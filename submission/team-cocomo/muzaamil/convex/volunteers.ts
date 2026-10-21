import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCoordinator } from "./lib/auth";
import { cleanText } from "./lib/validate";
import { skill } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    const [volunteers, camps] = await Promise.all([
      ctx.db.query("volunteers").collect(),
      ctx.db.query("camps").collect(),
    ]);
    const campById = new Map(camps.map((c) => [c._id, c]));
    return volunteers
      .map((vol) => ({
        ...vol,
        campName: vol.camp_id ? (campById.get(vol.camp_id)?.name ?? null) : null,
      }))
      .sort((a, b) => Number(!a.camp_id) - Number(!b.camp_id) || a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: { name: v.string(), skill },
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);
    return await ctx.db.insert("volunteers", {
      name: cleanText(args.name, "Name"),
      skill: args.skill,
    });
  },
});

export const assign = mutation({
  args: { id: v.id("volunteers"), camp_id: v.id("camps") },
  handler: async (ctx, { id, camp_id }) => {
    await requireCoordinator(ctx);
    const vol = await ctx.db.get(id);
    if (!vol) throw new ConvexError("Volunteer not found");
    if (vol.camp_id) {
      throw new ConvexError(`${vol.name} already has an assignment. Unassign them first.`);
    }
    const camp = await ctx.db.get(camp_id);
    if (!camp) throw new ConvexError("Camp not found");
    if (camp.status === "Closed") throw new ConvexError("Closed camps can't take volunteers");
    await ctx.db.patch(id, { camp_id });
  },
});

export const unassign = mutation({
  args: { id: v.id("volunteers") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    const vol = await ctx.db.get(id);
    if (!vol) throw new ConvexError("Volunteer not found");
    await ctx.db.patch(id, { camp_id: undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("volunteers") },
  handler: async (ctx, { id }) => {
    await requireCoordinator(ctx);
    await ctx.db.delete(id);
  },
});
