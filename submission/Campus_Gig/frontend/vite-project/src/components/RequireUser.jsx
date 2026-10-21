import { Navigate } from "react-router-dom";
import { useUser } from "../UserContext";

export default function RequireUser({ children }) {
  const { currentUser, loading } = useUser();
  if (loading) return <p className="muted">Loading...</p>;
  if (!currentUser) return <Navigate to="/welcome" replace />;
  return children;
}
