/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as camps from "../camps.js";
import type * as dashboard from "../dashboard.js";
import type * as dispatches from "../dispatches.js";
import type * as donations from "../donations.js";
import type * as http from "../http.js";
import type * as intent from "../intent.js";
import type * as inventory from "../inventory.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_metrics from "../lib/metrics.js";
import type * as lib_validate from "../lib/validate.js";
import type * as me from "../me.js";
import type * as needs from "../needs.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as volunteers from "../volunteers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  camps: typeof camps;
  dashboard: typeof dashboard;
  dispatches: typeof dispatches;
  donations: typeof donations;
  http: typeof http;
  intent: typeof intent;
  inventory: typeof inventory;
  "lib/auth": typeof lib_auth;
  "lib/metrics": typeof lib_metrics;
  "lib/validate": typeof lib_validate;
  me: typeof me;
  needs: typeof needs;
  seed: typeof seed;
  users: typeof users;
  volunteers: typeof volunteers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
