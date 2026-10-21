import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalQuery } from "./_generated/server";
import { auth } from "./auth";

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
    const rows = await ctx.db.query(table).collect();
    return rows.map(({ _id, _creationTime, ...rest }) => ({ id: _id, ...rest }));
  },
});

const http = httpRouter();
auth.addHttpRoutes(http);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Read-only REST view of each collection: GET {CONVEX_SITE_URL}/api/camps
for (const table of COLLECTIONS) {
  http.route({
    path: `/api/${table}`,
    method: "GET",
    handler: httpAction(async (ctx) => {
      const rows = await ctx.runQuery(internal.http.exportCollection, { table: table as Collection });
      return new Response(JSON.stringify(rows), { status: 200, headers: cors });
    }),
  });
}

export default http;
