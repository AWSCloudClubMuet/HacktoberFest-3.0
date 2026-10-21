import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorBanner = ({ message, onRetry }) => {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Failed to load data</p>
          <p className="text-xs text-rose-700 mt-0.5">{message || 'Could not connect to mock server on port 3001.'}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
};
