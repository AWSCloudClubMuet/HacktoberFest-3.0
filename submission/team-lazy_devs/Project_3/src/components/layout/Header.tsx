import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Menu,
  RotateCcw,
  Server,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenResetConfirm: () => void;
  criticalGapsCount?: number;
  lowStockCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenResetConfirm,
  criticalGapsCount = 0,
  lowStockCount = 0,
}) => {
  const {
    role,
    setRole,
    backendOnline,
    notify,
    activeTab,
    setActiveTab,
    notifications,
    unreadNotificationsCount,
    toggleNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const handleRoleToggle = (newRole: 'admin' | 'volunteer') => {
    setRole(newRole);
    notify(
      'info',
      `Switched to ${newRole === 'admin' ? 'Relief Coordinator (Admin)' : 'Field Volunteer'}`,
      newRole === 'admin'
        ? 'Full write and administrative permissions enabled.'
        : 'Restricted field operational mode enabled. Administrative endpoints will be protected.'
    );
  };

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const pageTitles: Record<string, { section: string; title: string }> = {
    overview: { section: 'Operations Command', title: 'Operational Overview' },
    camps: { section: 'Operations Command', title: 'Relief Camps Directory' },
    inventory: { section: 'Operations Command', title: 'Warehouse Inventory' },
    needs: { section: 'Operations Command', title: 'Camp Supply Needs' },
    dispatches: { section: 'Logistics & Personnel', title: 'Dispatches & Fleet' },
    donations: { section: 'Logistics & Personnel', title: 'Donations Ledger' },
    volunteers: { section: 'Logistics & Personnel', title: 'Volunteer Force' },
    demo: { section: 'System & Invariants', title: 'Demo Guide & Tests' },
  };

  const currentBreadcrumb = pageTitles[activeTab] || { section: 'Operations', title: 'Dashboard' };
  const totalAlerts = criticalGapsCount + lowStockCount;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#E5E1D9] px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-lg md:hidden transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#697586] min-w-0">
          <span className="font-medium text-[#697586] hidden sm:inline whitespace-nowrap">
            {currentBreadcrumb.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          <span className="font-semibold text-[#263242] text-sm tracking-tight truncate">
            {currentBreadcrumb.title}
          </span>
          <span className="hidden lg:inline text-slate-300" aria-hidden="true">·</span>
          <span className="hidden lg:inline text-[11px] text-[#697586] whitespace-nowrap font-mono">
            {todayFormatted}
          </span>
        </div>
      </div>

      {/* Zone 2: Real System Status & Alerts */}
      <div className="flex items-center gap-2.5">
        {/* Real Backend Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0ECE3] border border-[#E5E1D9] text-xs">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              backendOnline ? 'bg-emerald-600' : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span className="text-[#697586]">API:</span>
          <span
            className={`font-semibold font-mono text-[11px] ${
              backendOnline ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {backendOnline ? 'Online (Synced)' : 'Checking...'}
          </span>
        </div>

        {/* In-App Notification Center */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-lg transition-colors"
            aria-label="View operational notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[10px] font-bold font-mono text-white bg-rose-600 rounded-full border border-white flex items-center justify-center tabular-nums shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E5E1D9] z-50 text-xs overflow-hidden">
              {/* Header */}
              <div className="p-3 bg-[#F0ECE3]/80 border-b border-[#E5E1D9] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#263242] block">Operational Notifications</span>
                  <span className="text-[11px] text-[#697586] font-mono">
                    {unreadNotificationsCount} unread · {notifications.length} total
                  </span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-[#D6A85F] hover:text-[#b88c45] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="px-3 py-1.5 bg-white border-b border-[#E5E1D9] flex items-center gap-1.5">
                {(['all', 'unread', 'critical'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setNotifFilter(tab)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      notifFilter === tab
                        ? 'bg-[#202B3C] text-white font-semibold'
                        : 'text-[#697586] hover:bg-[#F0ECE3]'
                    }`}
                  >
                    {tab === 'all' && `All (${notifications.length})`}
                    {tab === 'unread' && `Unread (${unreadNotificationsCount})`}
                    {tab === 'critical' && `Critical (${notifications.filter((n) => n.priority === 'critical').length})`}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                {notifications
                  .filter((n) => {
                    if (notifFilter === 'unread') return !n.read;
                    if (notifFilter === 'critical') return n.priority === 'critical';
                    return true;
                  })
                  .map((notif) => {
                    const iconColor = {
                      critical: 'text-rose-600 bg-rose-50 border-rose-200',
                      warning: 'text-amber-600 bg-amber-50 border-amber-200',
                      info: 'text-blue-600 bg-blue-50 border-blue-200',
                    }[notif.priority];

                    return (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                          notif.read ? 'bg-white opacity-75' : 'bg-slate-50/70 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${iconColor}`}>
                          {notif.type === 'critical_gap' && <ShieldAlert className="w-3.5 h-3.5" />}
                          {notif.type === 'low_stock' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {notif.type === 'dispatch_delay' && <RotateCcw className="w-3.5 h-3.5" />}
                          {notif.type === 'camp_full' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-semibold text-xs truncate ${notif.read ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">{notif.timestamp}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNotificationRead(notif.id);
                                }}
                                className="text-slate-500 hover:text-slate-800 underline"
                              >
                                {notif.read ? 'Mark unread' : 'Mark read'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(notif.targetTab);
                                  setShowAlertsDropdown(false);
                                }}
                                className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-0.5"
                              >
                                <span>View</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {notifications.length === 0 && (
                  <p className="text-slate-500 text-center py-6 text-xs">No active operational alerts.</p>
                )}
                {notifications.length > 0 &&
                  notifications.filter((n) => {
                    if (notifFilter === 'unread') return !n.read;
                    if (notifFilter === 'critical') return n.priority === 'critical';
                    return true;
                  }).length === 0 && (
                    <p className="text-slate-500 text-center py-6 text-xs">No notifications matching this filter.</p>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Segmented Control */}
        <div className="flex items-center p-0.5 bg-[#F0ECE3] rounded-lg border border-[#E5E1D9]">
          <button
            type="button"
            onClick={() => handleRoleToggle('admin')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              role === 'admin'
                ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                : 'text-[#697586] hover:text-[#263242]'
            }`}
            title="Coordinator has full administrative control"
          >
            Coordinator
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('volunteer')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              role === 'volunteer'
                ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                : 'text-[#697586] hover:text-[#263242]'
            }`}
            title="Volunteer has operational view without admin powers"
          >
            Volunteer
          </button>
        </div>

        {/* Reset Demo Data Button */}
        {role === 'admin' && (
          <button
            type="button"
            onClick={onOpenResetConfirm}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#263242] bg-white border border-[#E5E1D9] rounded-lg hover:bg-[#F0ECE3] hover:text-[#202B3C] transition-colors whitespace-nowrap shadow-xs"
            title="Restore pristine seed dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#697586]" />
            <span>Reset Data</span>
          </button>
        )}
      </div>
    </header>
  );
};
