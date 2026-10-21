import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  X,
  Check
} from 'lucide-react';

export function NotificationsModal() {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    currentUser,
    markAllNotificationsRead,
    setCurrentScreen
  } = useApp();

  if (!isNotificationsOpen) return null;

  const userNotifications = notifications.filter(n => n.user_id === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-6 p-2 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--bg-surface)] rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[85vh] mt-12 sm:mt-14 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Campus Notifications</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Live activity for {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] p-2">
          {userNotifications.length > 0 ? (
            userNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.type === 'application') setCurrentScreen('manage-applications');
                  if (n.type === 'status') setCurrentScreen('my-work');
                  if (n.type === 'review') setCurrentScreen('reviews');
                  setIsNotificationsOpen(false);
                }}
                className={`p-3.5 rounded-2xl transition-colors cursor-pointer space-y-1 ${
                  !n.read ? 'bg-[var(--primary-emerald-light)]' : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary-emerald)]" />}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{n.created_at}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-3.5">
                  {n.message}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs">
              No notifications yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface-secondary)] flex items-center justify-between">
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-bold text-[var(--primary-emerald)] hover:opacity-80 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
