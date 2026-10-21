import React from 'react'
import { RilliQuilt } from './illustrations/RilliQuilt'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-forest-900/50 rounded-2xl border border-gray-100 dark:border-forest-800 shadow-sm relative overflow-hidden ${className}`}
    >
      <div className="mb-4">
        {icon || <RilliQuilt size={90} className="mx-auto" />}
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-neon text-neon-dark font-bold rounded-xl text-sm hover:brightness-105 active:scale-95 transition shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
