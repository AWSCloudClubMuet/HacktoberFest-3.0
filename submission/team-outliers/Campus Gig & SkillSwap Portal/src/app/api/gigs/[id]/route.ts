import { NextRequest } from "next/server";
import { getGig, patchGig } from "@/lib/server/store";
import { readJson, respond } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: NextRequest, { params }: Ctx) {
  return respond(async () => getGig((await params).id));
}

// PATCH /api/gigs/:id  body: { owner_id, status: "Completed" }
export function PATCH(request: NextRequest, { params }: Ctx) {
  return respond(async () => patchGig((await params).id, await readJson(request)));
}
