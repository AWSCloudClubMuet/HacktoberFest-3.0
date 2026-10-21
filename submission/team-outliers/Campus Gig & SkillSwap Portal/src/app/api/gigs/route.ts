import { NextRequest } from "next/server";
import { listGigs, createGig } from "@/lib/server/store";
import { readJson, respond } from "@/lib/server/http";

const num = (v: string | null) => (v !== null && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);

// GET /api/gigs?category=&type=&payment_type=&status=&q=&min_budget=&max_budget=&user_id=
export function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  return respond(() => {
    const data = listGigs({
      category: (p.get("category") as any) || undefined,
      type: (p.get("type") as any) || undefined,
      payment_type: (p.get("payment_type") as any) || undefined,
      status: (p.get("status") as any) || undefined,
      search: p.get("q") || p.get("search") || undefined,
      minBudget: num(p.get("min_budget")),
      maxBudget: num(p.get("max_budget")),
      userId: p.get("user_id") || undefined,
    });
    return { total: data.length, data };
  });
}

// POST /api/gigs
export function POST(request: NextRequest) {
  return respond(async () => createGig(await readJson(request)), 201);
}
