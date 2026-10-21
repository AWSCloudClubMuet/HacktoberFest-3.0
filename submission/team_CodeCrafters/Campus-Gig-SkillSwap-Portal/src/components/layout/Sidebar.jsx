import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  PlusCircle,
  LayoutDashboard,
  Users,
  Briefcase,
  Star,
  MessageSquare,
  User,
  ArrowLeftRight,
  Sparkles,
  Home
} from 'lucide-react';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const {
    currentScreen,
    setCurrentScreen,
    currentUser,
    setIsDemoModalOpen,
    setIsAiAssistantOpen,
    pendingReceivedApplications,
    conversations
  } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const pendingAppsCount = pendingReceivedApplications.length;

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore Gigs', icon: Compass },
    { id: 'create-gig', label: 'Create Gig', icon: PlusCircle, highlight: true },
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    {
      id: 'manage-applications',
      label: 'Manage Applications',
      icon: Users,
      badge: pendingAppsCount > 0 ? pendingAppsCount : null,
      badgeColor: 'bg-[var(--primary-emerald)] text-white'
    },
    { id: 'my-work', label: 'My Work', icon: Briefcase },
    { id: 'reviews', label: 'Reviews', icon: Star },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null,
      badgeColor: 'bg-[var(--primary-emerald)] text-white'
    },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const handleNavClick = (screenId) => {
    setCurrentScreen(screenId);
    if (onCloseMobile) onCloseMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const content = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-color)] w-64 xl:w-72 select-none transition-colors duration-200">
      
      {/* Top Branding (Mobile drawer only) */}
      <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between lg:hidden">
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#008F72] to-[#34D399] text-white flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">
            Campus<span className="text-[var(--primary-emerald)]">Loop</span>
          </span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 py-2">
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] font-bold shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              } ${item.highlight && !isActive ? 'text-[var(--primary-emerald-text)] font-semibold' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-[var(--primary-emerald)]'
                      : item.highlight
                      ? 'text-[var(--primary-emerald)]'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-2">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 py-2">
            Campus Tools
          </div>
          
          <button
            onClick={() => {
              setIsAiAssistantOpen(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--accent-indigo-text)] bg-[var(--accent-indigo-light)] hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent-indigo)]" />
            <span>AI Campus Assistant</span>
          </button>
        </div>
      </nav>

      {/* Bottom User & Switch Account Profile Card */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface-secondary)]">
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary-emerald)] hover:shadow-sm transition-all text-left group"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-[var(--primary-emerald)]/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--primary-emerald)]">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {currentUser.major}
            </p>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary-emerald)] shrink-0" />
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-20">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[var(--bg-surface)] shadow-2xl z-10 animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
