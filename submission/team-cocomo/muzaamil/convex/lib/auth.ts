import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in first");
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("Account not found");
  return user;
}

export async function requireCoordinator(ctx: QueryCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "coordinator") {
    throw new ConvexError("Only Relief Coordinators can make this change");
  }
  return user;
}
