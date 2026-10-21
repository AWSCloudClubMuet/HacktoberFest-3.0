import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There is currently no data matching your criteria.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-earth-300 p-8 text-center my-6 flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-full bg-earth-200 text-earth-700 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
