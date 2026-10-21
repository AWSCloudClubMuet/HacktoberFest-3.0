import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";

declare const process: { env: Record<string, string | undefined> };

export function demoModeEnabled() {
  return process.env.RELIEFHUB_DEMO_MODE === "true";
}

export function isDemoAccount(email: string | undefined) {
  return ["coordinator@reliefhub.demo", "volunteer@reliefhub.demo"].includes(email?.trim().toLowerCase() ?? "");
}

export async function getUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  // Shared test credentials grant access only in explicitly enabled demo deployments.
  // Check existing sessions too, so disabling demo mode immediately revokes access.
  if (!user || (isDemoAccount(user.email) && !demoModeEnabled())) return null;
  return user;
}

export async function requireUser(ctx: QueryCtx) {
  const user = await getUser(ctx);
  if (!user) throw new ConvexError("Please sign in with an active account");
  return user;
}

export async function requireCoordinator(ctx: QueryCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "coordinator") {
    throw new ConvexError("Only Relief Coordinators can make this change");
  }
  return user;
}
