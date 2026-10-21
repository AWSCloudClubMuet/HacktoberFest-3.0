import { httpRouter } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalQuery } from "./_generated/server";
import { auth } from "./auth";
import { requireCoordinator } from "./lib/auth";

const COLLECTIONS = ["camps", "inventory", "needs", "dispatches", "donations", "volunteers"] as const;
type Collection = (typeof COLLECTIONS)[number];

export const exportCollection = internalQuery({
  args: {
    table: v.union(
      v.literal("camps"),
      v.literal("inventory"),
      v.literal("needs"),
      v.literal("dispatches"),
      v.literal("donations"),
      v.literal("volunteers"),
    ),
  },
  handler: async (ctx, { table }) => {
    await requireCoordinator(ctx);
    const rows = await ctx.db.query(table).collect();
    return rows.map(({ _id, _creationTime, ...rest }) => ({ id: _id, ...rest }));
  },
});

const http = httpRouter();
auth.addHttpRoutes(http);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

// Coordinator-only REST mirror. Supply a Convex Auth token as Authorization: Bearer <token>.
for (const table of COLLECTIONS) {
  http.route({
    path: `/api/${table}`,
    method: "GET",
    handler: httpAction(async (ctx) => {
      // Invalid or expired bearer tokens can reject rather than return null.
      const identity = await ctx.auth.getUserIdentity().catch(() => null);
      if (!identity) {
        return new Response(JSON.stringify({ error: "Please sign in first" }), { status: 401, headers: cors });
      }
      try {
        await ctx.runQuery(internal.users.assertCoordinator, {});
        const rows = await ctx.runQuery(internal.http.exportCollection, { table: table as Collection });
        return new Response(JSON.stringify(rows), { status: 200, headers: cors });
      } catch (error) {
        if (!(error instanceof ConvexError)) throw error;
        return new Response(JSON.stringify({ error: "Only Relief Coordinators can access collection exports" }), { status: 403, headers: cors });
      }
    }),
  });
  http.route({
    path: `/api/${table}`,
    method: "OPTIONS",
    handler: httpAction(async () => new Response(null, { status: 204, headers: cors })),
  });
}

export default http;
