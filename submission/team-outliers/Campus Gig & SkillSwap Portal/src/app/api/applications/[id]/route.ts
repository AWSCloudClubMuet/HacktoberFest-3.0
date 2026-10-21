import { NextRequest } from "next/server";
import { patchApplication } from "@/lib/server/store";
import { readJson, respond } from "@/lib/server/http";

// PATCH /api/applications/:id  body: { owner_id, action: "accept" | "reject" }
export function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return respond(async () => patchApplication((await params).id, await readJson(request)));
}
