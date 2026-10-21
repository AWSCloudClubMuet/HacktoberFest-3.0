import { NextRequest } from "next/server";
import { listReviews, createReview } from "@/lib/server/store";
import { readJson, respond } from "@/lib/server/http";

// GET /api/reviews?gig_id=&user_id=
export function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  return respond(() => {
    const data = listReviews(p.get("gig_id") || undefined, p.get("user_id") || undefined);
    return { total: data.length, data };
  });
}

// POST /api/reviews  body: { gig_id, reviewer_id, rating, comment }
export function POST(request: NextRequest) {
  return respond(async () => createReview(await readJson(request)), 201);
}
