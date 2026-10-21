import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import FarmerRoute from './components/FarmerRoute.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Demo from './pages/Demo.jsx';
import Prices from './pages/Prices.jsx';
import CropDetail from './pages/CropDetail.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Alerts from './pages/Alerts.jsx';
import AlertForm from './pages/AlertForm.jsx';
import MyListings from './pages/MyListings.jsx';
import ListingForm from './pages/ListingForm.jsx';
import ProfitCalculator from './pages/ProfitCalculator.jsx';
import { useUser } from './context/UserContext.jsx';

export default function App() {
  const { i18n } = useTranslation();
  const { user } = useUser();

  useEffect(() => {
    const urdu = i18n.language === 'ur';
    document.documentElement.lang = urdu ? 'ur' : 'en';
    document.documentElement.dir = urdu ? 'rtl' : 'ltr';
    document.body.classList.toggle('urdu', urdu);
    localStorage.setItem('kisanmandi_language', urdu ? 'ur' : 'en');
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/onboarding" element={user ? <Navigate to="/prices" replace /> : <Onboarding />} />
      <Route path="/demo" element={<Demo />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/prices" element={<Prices />} />
          <Route path="/prices/:cropId" element={<CropDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:listingId" element={<ListingDetail />} />
          <Route element={<FarmerRoute />}>
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/new" element={<AlertForm />} />
            <Route path="/alerts/:alertId/edit" element={<AlertForm />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/my-listings/new" element={<ListingForm />} />
            <Route path="/my-listings/:listingId/edit" element={<ListingForm />} />
            <Route path="/profit" element={<ProfitCalculator />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/prices' : '/onboarding'} replace />} />
    </Routes>
  );
}
