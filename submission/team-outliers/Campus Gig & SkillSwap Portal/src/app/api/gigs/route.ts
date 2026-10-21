import { NextRequest, NextResponse } from "next/server";
import { getGigs, createGig } from "@/lib/api";
import { GigCategory, GigType, PaymentType, GigStatus } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as GigCategory | null;
  const type = searchParams.get("type") as GigType | null;
  const q = searchParams.get("q") || searchParams.get("search");
  const payment_type = searchParams.get("payment_type") as PaymentType | null;
  const status = searchParams.get("status") as GigStatus | null;

  const gigs = getGigs({
    category: category || undefined,
    type: type || undefined,
    payment_type: payment_type || undefined,
    status: status || undefined,
    search: q || undefined,
  });

  return NextResponse.json({
    total: gigs.length,
    data: gigs,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newGig = createGig(body);
    return NextResponse.json(newGig, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create gig" }, { status: 400 });
  }
}
