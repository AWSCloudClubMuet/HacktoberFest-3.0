import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

export default function FarmerRoute() {
  const { user } = useUser();
  return user?.role === 'Farmer' ? <Outlet /> : <Navigate to="/prices" replace />;
}
