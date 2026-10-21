import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

export default function ProtectedRoute() {
  const { user } = useUser();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/onboarding" replace state={{ from: location }} />;
}
