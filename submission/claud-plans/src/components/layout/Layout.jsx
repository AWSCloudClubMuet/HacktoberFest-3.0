import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { OnboardingPage } from '../../pages/OnboardingPage';
import {
  Sprout,
  LogOut,
  Search,
  User,
  LayoutDashboard,
  LineChart,
  ShoppingBag,
  Layers,
  Calculator,
  CloudSun,
  Settings,
  ArrowRightLeft,
  Check
} from 'lucide-react';

export const Layout = () => {
  const { currentUser, clearUser, users, switchUser, isFarmer, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchGlobal, setSearchGlobal] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F5EC] flex items-center justify-center font-sans">
        <div className="p-8 bg-white rounded-3xl shadow-xl text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">Loading KisanMandi Agricultur...</p>
        </div>
      </div>
    );
  }

  // On first launch or when localStorage is cleared, show onboarding form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F0F5EC] p-4 sm:p-8 flex items-center justify-center font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-[32px] shadow-2xl p-6 sm:p-8 border border-slate-200/80">
          <OnboardingPage />
        </div>
      </div>
    );
  }

  // Nav Items exactly matching the mockup:
  // Dashboard, Analytics, Fields, Harvesting, Finances, Weather, Settings
  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Analytics', to: '/analytics', icon: LineChart },
    { name: 'Fields', to: '/fields', icon: ShoppingBag }, // Marketplace
    { name: 'Harvesting', to: '/harvesting', icon: Layers }, // My Listings
    { name: 'Finances', to: '/finances', icon: Calculator }, // Profit Calculator
    { name: 'Weather', to: '/weather', icon: CloudSun }, // Weather & Alerts
    { name: 'Settings', to: '/settings', icon: Settings } // User profile & persona settings
  ];

  const handleLogout = () => {
    clearUser();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#EDF3E9] p-2 sm:p-4 lg:p-6 flex items-center justify-center font-sans text-slate-800">
      {/* Laptop / Desktop Rounded Dashboard Shell */}
      <div className="max-w-[1440px] w-full min-h-[880px] bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200/80">
        
        {/* Left Dark Sidebar */}
        <aside className="w-full md:w-60 bg-[#1E231F] text-white flex flex-col justify-between p-6 shrink-0 border-r border-[#2a2f2b]">
          <div className="space-y-8">
            {/* Logo: agri🌱cultur */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-1 cursor-pointer select-none px-2 group"
            >
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                agri
              </span>
              <div className="flex items-center justify-center -mt-1 text-[#E2FA8A]">
                <Sprout className="w-5 h-5 text-[#E2FA8A]" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                cultur
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/' || location.pathname === '/dashboard'
                    : location.pathname.startsWith(item.to) ||
                      (item.to === '/fields' && location.pathname === '/marketplace') ||
                      (item.to === '/harvesting' && location.pathname === '/my-listings') ||
                      (item.to === '/finances' && location.pathname === '/calculator') ||
                      (item.to === '/weather' && location.pathname === '/alerts') ||
                      (item.to === '/settings' && location.pathname === '/onboarding');

                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#E2FA8A] text-[#1E231F] font-black shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar: Logout & Switch User */}
          <div className="pt-6 border-t border-white/10 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              title="Logout and clear user"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Top Header Bar */}
          <header className="h-16 px-6 sm:px-8 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white">
            {/* Search Input: "Search any of content" */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search any of content"
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchGlobal.trim()) {
                    navigate(`/fields?q=${encodeURIComponent(searchGlobal)}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-transparent focus:border-slate-300 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Right Controls: User Profile Avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-50 transition-colors"
                title="Account & Persona"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {currentUser.role} • {currentUser.district}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-[#1E231F] text-[#E2FA8A] font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-emerald-500/30">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {/* Profile / Switcher Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 space-y-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-xs font-black text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.phone}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-slate-400">{currentUser.district}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1.5">
                      Switch Active Persona
                    </span>
                    <div className="space-y-1">
                      {users.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              switchUser(u.id);
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                              isSelected
                                ? 'bg-[#E2FA8A]/30 text-slate-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="truncate">
                              {u.name} ({u.role})
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Switch User / Onboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
