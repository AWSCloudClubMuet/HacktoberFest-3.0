import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, ShoppingBag, Bell, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

export const BottomNav = () => {
  const { isFarmer } = useAuth();
  const { unreadCount } = useAlerts();

  // Tab definitions by role
  const farmerTabs = [
    { name: 'Prices', to: '/', icon: Store },
    { name: 'Marketplace', to: '/marketplace', icon: ShoppingBag },
    { name: 'Alerts', to: '/alerts', icon: Bell, badge: unreadCount },
    { name: 'My Listings', to: '/my-listings', icon: Layers }
  ];

  const buyerTabs = [
    { name: 'Prices', to: '/', icon: Store },
    { name: 'Marketplace', to: '/marketplace', icon: ShoppingBag }
  ];

  const tabs = isFarmer ? farmerTabs : buyerTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-40 bg-white/95 backdrop-blur-md border-t border-earth-300 shadow-xl">
      <div className={`grid ${isFarmer ? 'grid-cols-4' : 'grid-cols-2'} h-16 items-center px-1`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.to}
              id={`tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full transition-colors relative ${
                  isActive
                    ? 'text-emerald-800 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {tab.badge > 0 && (
                  <span
                    id="alerts-badge-count"
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-tight">{tab.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
