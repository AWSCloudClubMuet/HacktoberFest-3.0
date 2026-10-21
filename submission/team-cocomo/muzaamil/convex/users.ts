import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { demoModeEnabled, getUser, requireCoordinator } from "./lib/auth";
import { role } from "./schema";

export const demoMode = query({
  args: {},
  handler: () => demoModeEnabled(),
});

/** Shared server-side gate for actions, which cannot read the users table directly. */
export const assertCoordinator = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireCoordinator(ctx);
    return null;
  },
});

/** Trusted deployment operator only: never exposed to browser clients. */
export const setRole = internalMutation({
  args: { email: v.string(), role },
  handler: async (ctx, { email, role }) => {
    const user = await ctx.db.query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    if (!user) throw new ConvexError("Create the account before setting its role");
    await ctx.db.patch(user._id, { role });
    return { email: user.email, role };
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name ?? user.email ?? "User",
      email: user.email ?? "",
      role: user.role ?? "volunteer",
    };
  },
});
