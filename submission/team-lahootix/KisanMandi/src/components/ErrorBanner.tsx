import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBannerProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = 'Failed to load data. Please check your network and try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex items-start space-x-3 text-red-800 dark:text-red-300 relative overflow-hidden ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 active:scale-95 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 rtl-flip" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorBanner
