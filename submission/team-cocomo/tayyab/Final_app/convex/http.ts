import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { registerApi } from "./rest/routes";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });
// KisanMandi REST API under /api/v1 (see convex/rest/routes.ts).
registerApi(http);
export default http;
