import { NextRequest, NextResponse } from "next/server";
import { acceptApplicant, rejectApplication } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, gig_id, owner_id } = body;

    if (action === "accept") {
      const result = acceptApplicant(gig_id, id, owner_id);
      return NextResponse.json(result);
    } else if (action === "reject") {
      const result = rejectApplication(id, owner_id);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update application" }, { status: 400 });
  }
}
