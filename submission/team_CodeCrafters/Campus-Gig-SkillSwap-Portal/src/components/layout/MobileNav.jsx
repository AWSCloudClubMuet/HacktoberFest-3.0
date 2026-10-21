import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';

export function MobileNav() {
  const { currentScreen, setCurrentScreen, conversations } = useApp();
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const tabs = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'create-gig', label: 'Create', icon: Plus, isAction: true },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: totalUnread > 0 ? totalUnread : null },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleNav = (screenId) => {
    setCurrentScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-color)] lg:hidden px-2 py-1 safe-area-pb shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                className="flex flex-col items-center justify-center -mt-4 group focus:outline-none"
                aria-label="Create Gig"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20 ring-4 ring-[var(--bg-surface)] active:scale-95 transition-all">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-[var(--text-primary)] mt-1">Create</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg relative transition-colors focus:outline-none ${
                isActive ? 'text-[var(--primary-emerald)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--primary-emerald)] text-[9px] font-bold text-white ring-1 ring-[var(--bg-surface)]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
