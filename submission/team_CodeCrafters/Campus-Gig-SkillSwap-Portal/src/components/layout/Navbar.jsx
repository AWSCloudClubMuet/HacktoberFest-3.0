import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, Sparkles, UserCheck, Menu, Sun, Moon } from 'lucide-react';

export function Navbar({ onToggleMobileSidebar }) {
  const {
    currentScreen,
    setCurrentScreen,
    currentUser,
    globalSearch,
    setGlobalSearch,
    unreadNotificationsCount,
    setIsNotificationsOpen,
    setIsDemoModalOpen,
    setIsAiAssistantOpen,
    theme,
    toggleTheme
  } = useApp();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (currentScreen !== 'explore') {
      setCurrentScreen('explore');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          
          {/* Left: Mobile menu button + Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl lg:hidden hover:bg-[var(--bg-hover)] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentScreen('landing')}
              className="flex items-center gap-2.5 group focus:outline-none text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008F72] to-[#34D399] text-white flex items-center justify-center shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg sm:text-xl tracking-tight text-[var(--text-primary)] font-sans">
                    Campus<span className="text-[var(--primary-emerald)]">Loop</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] border border-[var(--primary-emerald)]/30 rounded-md">
                    Campus Beta
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl mx-4 items-center relative"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search gigs, skills, or people..."
              className="w-full pl-9 pr-20 py-2 rounded-xl text-sm bg-[var(--bg-input)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-14 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs px-1"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--primary-emerald)] text-white hover:bg-[var(--primary-emerald-hover)] active:scale-95 transition-all shadow-xs"
            >
              Find
            </button>
          </form>

          {/* Right Actions: Theme Toggle, AI Assistant, Notifications, Demo User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold transition-all focus:outline-none"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle light and dark theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[var(--accent-indigo)]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* AI Assistant Quick Pill */}
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-indigo-light)] hover:opacity-90 border border-[var(--accent-indigo)]/40 text-[var(--accent-indigo-text)] text-xs font-semibold transition-all group shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-indigo)] group-hover:rotate-12 transition-transform" />
              <span>Campus AI</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus:outline-none"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary-emerald)] text-[10px] font-bold text-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block" />

            {/* Demo User Switcher Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[var(--bg-hover)] transition-all border border-transparent hover:border-[var(--border-color)] text-left focus:outline-none group"
              title="Click to switch demo account"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--primary-emerald)]/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--primary-emerald)] ring-2 ring-[var(--bg-surface)]" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[var(--primary-emerald)] leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[var(--primary-emerald)] inline" /> Switch Demo
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
