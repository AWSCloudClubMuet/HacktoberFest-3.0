// client/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import MarketplacePage from './pages/MarketplacePage';
import GigDetailsPage from './pages/GigDetailsPage';
import CreateEditGigPage from './pages/CreateEditGigPage';
import DashboardPage from './pages/DashboardPage';
import UserProfilePage from './pages/UserProfilePage';
import ProfilesDirectoryPage from './pages/ProfilesDirectoryPage';
import CreateProfilePage from './pages/CreateProfilePage';
import { GraduationCap } from 'lucide-react';

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#202923]">
          <Navbar onShowToast={showToast} />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<MarketplacePage onShowToast={showToast} />} />
              <Route path="/gigs/:id" element={<GigDetailsPage onShowToast={showToast} />} />
              <Route path="/gigs/create" element={<CreateEditGigPage onShowToast={showToast} />} />
              <Route path="/create-gig" element={<CreateEditGigPage onShowToast={showToast} />} />
              <Route path="/edit-gig/:id" element={<CreateEditGigPage onShowToast={showToast} />} />
              <Route path="/dashboard" element={<DashboardPage onShowToast={showToast} />} />
              <Route path="/profile/:id" element={<UserProfilePage onShowToast={showToast} />} />
              <Route path="/users/:id" element={<UserProfilePage onShowToast={showToast} />} />
              <Route path="/profiles" element={<ProfilesDirectoryPage onShowToast={showToast} />} />
              <Route path="/profiles/create" element={<CreateProfilePage onShowToast={showToast} />} />
              <Route path="/create-profile" element={<CreateProfilePage onShowToast={showToast} />} />
            </Routes>
          </main>

          {/* Toast Notification */}
          <Toast toast={toast} onClose={() => setToast(null)} />

          {/* Clean Product Footer */}
          <footer className="border-t border-[#E3E9E4] bg-white py-6 px-4 text-xs text-[#68746D]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#176B52] flex items-center justify-center text-white">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-[#202923]">
                  Campus Gig & SkillSwap
                </span>
                <span className="text-[#68746D] hidden md:inline">— Peer Opportunity Platform</span>
              </div>

              <div className="flex items-center gap-5 font-medium text-[#202923]">
                <Link to="/" className="hover:text-[#176B52] transition-colors">Marketplace</Link>
                <Link to="/gigs/create" className="hover:text-[#176B52] transition-colors">Post Opportunity</Link>
                <Link to="/dashboard" className="hover:text-[#176B52] transition-colors">Dashboard</Link>
                <Link to="/profiles" className="hover:text-[#176B52] transition-colors">Student Peers</Link>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}
