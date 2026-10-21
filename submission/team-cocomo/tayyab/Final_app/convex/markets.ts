import { internalQuery } from "./_generated/server";
import { allMarkets, marketView } from "./prices";

export const list = internalQuery({
  args: {},
  handler: async (ctx) => (await allMarkets(ctx)).map(marketView),
});
