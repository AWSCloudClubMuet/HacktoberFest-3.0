import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

export default function GuestRoute() {
  const { currentUser } = useUser();
  const location = useLocation();

  if (currentUser) return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  return <Outlet />;
}
