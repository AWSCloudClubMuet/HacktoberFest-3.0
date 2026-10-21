import { NextRequest, NextResponse } from "next/server";
import { getReviews, createReview } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gig_id = searchParams.get("gig_id") || undefined;
  const user_id = searchParams.get("user_id") || undefined;

  const reviews = getReviews(gig_id, user_id);
  return NextResponse.json({
    total: reviews.length,
    data: reviews,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const review = createReview(body);
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 400 });
  }
}
