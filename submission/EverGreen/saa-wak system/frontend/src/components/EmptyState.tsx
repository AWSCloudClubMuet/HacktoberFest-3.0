import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#E8E7DF] text-center max-w-lg mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#EEF2E8] border border-[#DCE8D3] flex items-center justify-center mx-auto mb-4 text-2xl text-[#607D52]">
        {icon || '🌾'}
      </div>
      <h4 className="text-base font-bold text-[#344B35] mb-1">{title}</h4>
      <p className="text-xs text-[#777B72] max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-[#607D52] hover:bg-[#344B35] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
