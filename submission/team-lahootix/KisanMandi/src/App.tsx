import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from './context/UserContext'
import { CultureProvider } from './context/CultureContext'
import { LanguageProvider } from './i18n'
import { ToastProvider, Layout, SplashScreen } from './components'
import Onboarding from './pages/Onboarding'
import Prices from './pages/Prices'
import CropDetail from './pages/CropDetail'
import Marketplace from './pages/Marketplace'
import ListingDetail from './pages/ListingDetail'
import ListingForm from './pages/ListingForm'
import MyListings from './pages/MyListings'
import Alerts from './pages/Alerts'
import AlertForm from './pages/AlertForm'
import ProfitCalculator from './pages/ProfitCalculator'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CultureProvider>
          <UserProvider>
            <ToastProvider>
              <SplashScreen />
              <BrowserRouter>
                <Routes>
                  {/* Onboarding Route */}
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* Protected App Shell */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/prices" replace />} />
                    <Route path="/prices" element={<Prices />} />
                    <Route path="/crops/:cropId" element={<CropDetail />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/listings/new" element={<ListingForm />} />
                    <Route path="/listings/:id" element={<ListingDetail />} />
                    <Route path="/listings/:id/edit" element={<ListingForm />} />
                    <Route path="/my-listings" element={<MyListings />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/alerts/new" element={<AlertForm />} />
                    <Route path="/alerts/:id/edit" element={<AlertForm />} />
                    <Route path="/calculator" element={<ProfitCalculator />} />
                    <Route path="*" element={<Navigate to="/prices" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </UserProvider>
        </CultureProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default App
