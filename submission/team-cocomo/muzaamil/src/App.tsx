import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import { useViewer } from "./lib/viewer";
import SignIn from "./pages/SignIn";
import Overview from "./pages/Overview";
import Camps from "./pages/Camps";
import CampDetail from "./pages/CampDetail";
import Needs from "./pages/Needs";
import Warehouse from "./pages/Warehouse";
import Dispatches from "./pages/Dispatches";
import Donations from "./pages/Donations";
import Volunteers from "./pages/Volunteers";
import QuickLog from "./pages/QuickLog";
import MyAssignment from "./pages/MyAssignment";
import Profile from "./pages/Profile";

/** Volunteers land on their assignment; coordinators get the full overview. */
function Home() {
  const { viewer, isCoordinator } = useViewer();
  if (viewer === undefined) return <Loading />;
  return isCoordinator ? <Overview /> : <Navigate to="/assignment" replace />;
}

/** Coordinator-only pages; volunteers are sent back to their assignment. */
function CoordinatorOnly({ children }: { children: ReactNode }) {
  const { viewer, isCoordinator } = useViewer();
  if (viewer === undefined) return <Loading />;
  if (!isCoordinator) return <Navigate to="/assignment" replace />;
  return <>{children}</>;
}

/** The assignment view belongs to field volunteers, including after account switches. */
function VolunteerOnly({ children }: { children: ReactNode }) {
  const { viewer, isCoordinator } = useViewer();
  if (viewer === undefined) return <Loading />;
  if (isCoordinator) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { viewer } = useViewer();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="label">Loading ReliefHub…</div>
      </div>
    );
  }

  if (!isAuthenticated) return <SignIn />;
  if (viewer === undefined) return <Loading />;
  if (!viewer) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col gap-4 text-center">
          <p>This account is unavailable. Sign in with an active account.</p>
          <button className="cursor-pointer font-semibold underline" onClick={() => void signOut()}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="assignment" element={<VolunteerOnly><MyAssignment /></VolunteerOnly>} />
        <Route path="profile" element={<Profile />} />
        <Route path="camps" element={<CoordinatorOnly><Camps /></CoordinatorOnly>} />
        <Route path="camps/:id" element={<CoordinatorOnly><CampDetail /></CoordinatorOnly>} />
        <Route path="needs" element={<CoordinatorOnly><Needs /></CoordinatorOnly>} />
        <Route path="warehouse" element={<CoordinatorOnly><Warehouse /></CoordinatorOnly>} />
        <Route path="dispatches" element={<CoordinatorOnly><Dispatches /></CoordinatorOnly>} />
        <Route path="donations" element={<CoordinatorOnly><Donations /></CoordinatorOnly>} />
        <Route path="volunteers" element={<CoordinatorOnly><Volunteers /></CoordinatorOnly>} />
        <Route path="log" element={<CoordinatorOnly><QuickLog /></CoordinatorOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
