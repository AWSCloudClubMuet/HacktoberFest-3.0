import React, { useState } from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  GitCompare,
  Bell,
  Store,
  Calculator,
  Layers,
  Users,
  Menu,
  X,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'prices'
  | 'insights'
  | 'marketplace'
  | 'alerts'
  | 'calculator'
  | 'my-listings'
  | 'messages'
  | 'ai';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onOpenOnboarding: () => void;
  onRefreshData: () => Promise<void>;
  isRefreshing: boolean;
  alertCount: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  allUsers,
  onSelectUser,
  onOpenOnboarding,
  onRefreshData,
  isRefreshing,
  alertCount,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isFarmer = currentUser.role === 'farmer';

  const navItems: { id: NavTab; label: string; sindhiLabel: string; icon: React.ReactNode; farmerOnly?: boolean }[] = [
    {
      id: 'overview',
      label: 'Overview',
      sindhiLabel: 'جائزو',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'prices',
      label: 'Crop Prices',
      sindhiLabel: 'فصلن جا اگهه',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'insights',
      label: '14-Day Insights',
      sindhiLabel: 'مارڪيٽ ڀيٽ',
      icon: <GitCompare className="w-4 h-4" />,
    },
    {
      id: 'marketplace',
      label: 'Produce Market',
      sindhiLabel: 'پيداوار منڊي',
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: 'Price Alerts',
      sindhiLabel: 'اگهه خبرداري',
      icon: <Bell className="w-4 h-4" />,
      farmerOnly: true,
    },
    {
      id: 'calculator',
      label: 'Profit Estimator',
      sindhiLabel: 'نفعو حساب',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'my-listings',
      label: 'My Listings',
      sindhiLabel: 'منهنجا فصل',
      icon: <Layers className="w-4 h-4" />,
      farmerOnly: true,
    },
    {
      id: 'messages',
      label: 'Messages',
      sindhiLabel: 'پيغام',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'ai',
      label: 'AI Advisory',
      sindhiLabel: 'زرعي صلاح',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.farmerOnly || isFarmer);

  const handleTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'overview':
        return { en: 'Marketplace Intelligence', sd: 'اڄوڪي منڊي صورتحال' };
      case 'prices':
        return { en: 'Daily Mandi Quotations', sd: 'روزانو فصلن جا اگهه' };
      case 'insights':
        return { en: '14-Day Price Trends & Comparison', sd: '14 ڏينهن جو رجحان ۽ مارڪيٽ ڀيٽ' };
      case 'marketplace':
        return { en: 'Sindh Produce Marketplace', sd: 'سنڌ زرعي پيداوار منڊي' };
      case 'alerts':
        return { en: 'Price Threshold Alerts', sd: 'اگهه خبرداري الرٽ' };
      case 'calculator':
        return { en: 'Harvest Profit & Scenario Estimator', sd: 'هارويسٽ نفعو تخمينو' };
      case 'my-listings':
        return { en: 'Manage Your Produce Batches', sd: 'پنهنجي فصلن جو انتظام' };
      case 'messages':
        return { en: 'Direct Mandi Messages', sd: 'سڌيون پيغام رساني' };
      case 'ai':
        return { en: 'Sindh Agri Advisory AI', sd: 'سنڌ زرعي سمارٽ رهنمائي' };
    }
  };

  const currentTitle = getPageTitle(currentTab);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col md:flex-row text-[#2F332C]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E8E7DF] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="p-5 border-b border-[#E8E7DF]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌱</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#2D452B] tracking-tight">
                  saa-wak
                </span>
                <span className="text-sm font-semibold text-[#4A6B42] font-sindhi">
                  ساوڪ
                </span>
              </div>
              <p className="text-[11px] text-[#767B70]">
                Know the market. Grow with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF2E8] text-[#2D452B] border border-[#DCE8D3]'
                    : 'text-[#666B60] hover:text-[#2F332C] hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#4A6B42]' : 'text-[#767B70]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.id === 'alerts' && alertCount > 0 && (
                    <span className="bg-[#4A6B42] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums">
                      {alertCount}
                    </span>
                  )}
                  <span className="text-[10px] text-[#767B70] font-sindhi opacity-70">
                    {item.sindhiLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Role Card & Switcher in Sidebar footer */}
        <div className="p-3 border-t border-[#E8E7DF] bg-[#FAF9F5]/60">
          <div className="bg-white p-3 rounded-xl border border-[#E8E7DF]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#767B70]">
                Active Profile
              </span>
              <span className="text-[10px] font-semibold text-[#4A6B42] capitalize bg-[#EEF2E8] px-1.5 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>

            <div className="font-semibold text-xs text-[#2F332C] truncate">
              {currentUser.displayName}
            </div>
            <div className="text-[11px] text-[#767B70]">
              {currentUser.district} District
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#E8E7DF] flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="text-[#4A6B42] hover:text-[#2D452B] text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Users className="w-3 h-3" />
                <span>Switch Profile</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E7DF] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile menu button & brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-[#767B70] hover:bg-[#FAF9F5] border border-[#E8E7DF] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="md:hidden flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <span className="font-bold text-base text-[#2D452B]">saa-wak</span>
                <span className="text-xs font-bold text-[#4A6B42] font-sindhi">ساوڪ</span>
              </div>

              {/* Desktop breadcrumb / Page title */}
              <div className="hidden md:flex items-center gap-2 text-xs text-[#767B70]">
                <span className="font-semibold text-[#2D452B] text-sm">{currentTitle.en}</span>
                <span className="text-[#C5C4BA]" aria-hidden="true">/</span>
                <span className="font-medium text-[#4A6B42] font-sindhi text-xs">
                  {currentTitle.sd}
                </span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-[#2D452B] bg-[#EEF2E8] hover:bg-[#DCE8D3] border border-[#DCE8D3] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                title="Refresh latest mandi quotations & evaluate alerts"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#4A6B42] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Prices</span>
              </button>

              {/* Profile button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#FAF9F5] hover:bg-[#EEF2E8] border border-[#E8E7DF] px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <div className="w-5 h-5 rounded-full bg-[#DCE8D3] text-[#2D452B] font-bold flex items-center justify-center text-[10px]">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <span className="font-medium text-[#2F332C] max-w-[120px] truncate hidden sm:inline">
                    {currentUser.displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#767B70]" />
                </button>

                {/* Profile quick switch dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E8E7DF] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 border-b border-[#E8E7DF] mb-1">
                      <div className="text-[10px] font-bold text-[#767B70] uppercase tracking-wider">
                        Switch Demo Profile
                      </div>
                    </div>

                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSelectUser(u);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                            currentUser.id === u.id
                              ? 'bg-[#EEF2E8] text-[#2D452B] font-semibold'
                              : 'text-[#2F332C] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          <div>
                            <div className="truncate">{u.displayName}</div>
                            <div className="text-[10px] text-[#767B70]">{u.district}</div>
                          </div>
                          <span className="text-[10px] text-[#4A6B42] bg-[#EEF2E8] px-1.5 py-0.5 rounded capitalize">
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-[#E8E7DF]">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOnboarding();
                        }}
                        className="w-full text-center text-xs font-semibold text-[#4A6B42] hover:text-[#2D452B] py-1 cursor-pointer"
                      >
                        Change Role (Farmer / Buyer)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E8E7DF] p-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {visibleNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF2E8] text-[#2D452B] border border-[#DCE8D3]'
                      : 'text-[#666B60] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#4A6B42]' : 'text-[#767B70]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[11px] text-[#767B70] font-sindhi">
                    {item.sindhiLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 min-w-0 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E7DF] py-2 px-3 z-30 flex items-center justify-around shadow-lg">
          <button
            type="button"
            onClick={() => handleTabClick('overview')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center ${
              currentTab === 'overview' ? 'text-[#2D452B] font-bold' : 'text-[#767B70]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('prices')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center ${
              currentTab === 'prices' ? 'text-[#2D452B] font-bold' : 'text-[#767B70]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Prices</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('insights')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center ${
              currentTab === 'insights' ? 'text-[#2D452B] font-bold' : 'text-[#777B70]'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Trends</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('marketplace')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center ${
              currentTab === 'marketplace' ? 'text-[#2D452B] font-bold' : 'text-[#777B70]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Market</span>
          </button>

          {isFarmer ? (
            <button
              type="button"
              onClick={() => handleTabClick('alerts')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center relative ${
                currentTab === 'alerts' ? 'text-[#2D452B] font-bold' : 'text-[#777B70]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#186F43]" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTabClick('calculator')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium cursor-pointer min-h-[44px] justify-center ${
                currentTab === 'calculator' ? 'text-[#2D452B] font-bold' : 'text-[#777B70]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
