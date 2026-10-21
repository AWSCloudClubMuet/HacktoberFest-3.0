import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PricesPage } from './pages/PricesPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MyListingsPage } from './pages/MyListingsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CropDetailPage } from './pages/CropDetailPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { OnboardingPage } from './pages/OnboardingPage';

export function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="analytics" element={<CropDetailPage />} />
              <Route path="rates" element={<PricesPage />} />
              <Route path="crop/:cropId" element={<CropDetailPage />} />
              <Route path="fields" element={<MarketplacePage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="harvesting" element={<MyListingsPage />} />
              <Route path="my-listings" element={<MyListingsPage />} />
              <Route path="finances" element={<CalculatorPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="weather" element={<AlertsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="settings" element={<OnboardingPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
