import React from 'react'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'primary' | 'accent' | 'danger' | 'success' | 'neutral'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-forest-100 dark:bg-forest-800 text-forest-900 dark:text-mint border-forest-200 dark:border-forest-700',
    accent: 'bg-neon/20 dark:bg-neon/30 text-neon-dark dark:text-neon border-neon/50 font-bold',
    danger: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900',
    success: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    neutral: 'bg-gray-100 dark:bg-forest-900 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-forest-800',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
