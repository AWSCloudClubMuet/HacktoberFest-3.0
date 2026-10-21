import { NextRequest, NextResponse } from "next/server";
import { getApplications, createApplication } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gig_id = searchParams.get("gig_id") || undefined;
  const applicant_id = searchParams.get("applicant_id") || undefined;

  const applications = getApplications(gig_id, applicant_id);
  return NextResponse.json({
    total: applications.length,
    data: applications,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const app = createApplication(body);
    return NextResponse.json(app, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 400 });
  }
}
