import { NextRequest, NextResponse } from "next/server";
import { getGigById, updateGig } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gig = getGigById(id);
  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }
  return NextResponse.json(gig);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { owner_id, ...updates } = body;
    const updated = updateGig(id, updates, owner_id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update gig" }, { status: 400 });
  }
}
