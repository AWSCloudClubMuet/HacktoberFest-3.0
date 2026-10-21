import { NextResponse } from "next/server";
import { ApiError } from "./store";

export async function readJson(request: Request): Promise<Record<string, any>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch { /* fallthrough */ }
  throw new ApiError(400, "Request body must be a JSON object.");
}

export function respond(fn: () => unknown | Promise<unknown>, successStatus = 200) {
  return Promise.resolve()
    .then(fn)
    .then((data) => NextResponse.json(data, { status: successStatus, headers: { "Cache-Control": "no-store" } }))
    .catch((err: unknown) => {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    });
}
