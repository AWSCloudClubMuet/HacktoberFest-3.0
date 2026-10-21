import { NextRequest } from "next/server";
import { getUser } from "@/lib/server/store";
import { respond } from "@/lib/server/http";

// GET /api/users/:id  → profile + computed stats (posted, completed, average rating from stored reviews)
export function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return respond(async () => getUser((await params).id));
}
