import React from 'react';
import { useApp } from '../../context/AppContext';
import { RatingStars } from './RatingStars';
import {
  UserCheck,
  X,
  ShieldAlert
} from 'lucide-react';

export function DemoAccountModal() {
  const {
    isDemoModalOpen,
    setIsDemoModalOpen,
    users,
    currentUser,
    switchUser
  } = useApp();

  if (!isDemoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--bg-surface)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-color)]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] text-[11px] font-bold border border-[var(--primary-emerald)]/30 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
              <span>Hackathon Demonstration Mode</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Switch Student Demo Account
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Select any of the 12 seeded student profiles to test different roles, applications, and reviews.
            </p>
          </div>

          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Disclaimer notice */}
        <div className="my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Note for Hackathon Judges:</strong> Demo authentication switches identity instantly without requiring login credentials.
          </span>
        </div>

        {/* Users Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 pr-1">
          {users.map(u => {
            const isSelected = u.id === currentUser.id;

            return (
              <div
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[var(--primary-emerald-light)] border-[var(--primary-emerald)] ring-2 ring-[var(--primary-emerald)]/30'
                    : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] hover:border-[var(--primary-emerald)]/50 hover:bg-[var(--bg-hover)]'
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-1 ring-[var(--border-color)] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                      {u.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[var(--primary-emerald-text)] bg-[var(--primary-emerald-light)] px-1.5 py-0.5 rounded border border-[var(--primary-emerald)]/30">
                        Active
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                    {u.major} • {u.semester}
                  </span>

                  <div className="flex items-center gap-1.5 mt-1">
                    <RatingStars rating={u.rating} size="xs" />
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">{u.rating}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Currently logged in as: <strong className="text-[var(--text-primary)]">{currentUser.name}</strong></span>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
