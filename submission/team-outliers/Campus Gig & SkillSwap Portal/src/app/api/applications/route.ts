import { NextRequest } from "next/server";
import { listApplications, createApplication } from "@/lib/server/store";
import { readJson, respond } from "@/lib/server/http";

// GET /api/applications?gig_id=&applicant_id=
export function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  return respond(() => {
    const data = listApplications(p.get("gig_id") || undefined, p.get("applicant_id") || undefined);
    return { total: data.length, data };
  });
}

// POST /api/applications  body: { gig_id, applicant_id, message }
export function POST(request: NextRequest) {
  return respond(async () => createApplication(await readJson(request)), 201);
}
