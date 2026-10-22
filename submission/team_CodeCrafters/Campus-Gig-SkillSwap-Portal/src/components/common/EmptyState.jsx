import React from 'react';
import { Sparkles } from 'lucide-react';

export function EmptyState({ icon: Icon = Sparkles, title, description, actionText, onAction, secondaryActionText, onSecondaryAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle max-w-lg mx-auto my-6 transition-colors duration-200">
      <div className="w-14 h-14 rounded-2xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] flex items-center justify-center mb-4 shadow-sm border border-[var(--primary-emerald)]/20">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && (
          <button
            onClick={onAction}
            className="px-4 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-sm font-semibold transition-all shadow-sm"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-95 text-sm font-semibold transition-all"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}
