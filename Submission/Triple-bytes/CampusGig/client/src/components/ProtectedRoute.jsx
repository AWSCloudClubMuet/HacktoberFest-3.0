import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext.jsx';

export default function ProtectedRoute() {
  const { t } = useTranslation();
  const { currentUser, loading } = useUser();
  const location = useLocation();

  if (loading) return <div className="pagemsg">{t('common.loading')}</div>;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
