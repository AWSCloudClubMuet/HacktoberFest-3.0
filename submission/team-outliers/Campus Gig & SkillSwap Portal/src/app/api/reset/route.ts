import { resetDb } from "@/lib/server/store";
import { respond } from "@/lib/server/http";

// POST /api/reset — restore seed data (handy before a demo)
export function POST() {
  return respond(() => {
    resetDb();
    return { ok: true };
  });
}
