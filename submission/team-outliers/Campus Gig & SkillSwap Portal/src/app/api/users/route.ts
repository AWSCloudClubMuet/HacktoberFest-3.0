import { listUsers } from "@/lib/server/store";
import { respond } from "@/lib/server/http";

// GET /api/users
export function GET() {
  return respond(() => {
    const data = listUsers();
    return { total: data.length, data };
  });
}
