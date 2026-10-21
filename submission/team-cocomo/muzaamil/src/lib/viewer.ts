import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useViewer() {
  const viewer = useQuery(api.users.viewer);
  return {
    viewer,
    isCoordinator: viewer?.role === "coordinator",
  };
}
