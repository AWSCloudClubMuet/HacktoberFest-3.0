import React from 'react'

interface ChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  className?: string
  icon?: React.ReactNode
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  }

  const variantClasses = {
    default: active
      ? 'bg-forest dark:bg-forest-800 text-neon font-bold shadow-2xs border border-forest dark:border-forest-700'
      : 'bg-white dark:bg-forest-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-forest-800 hover:bg-gray-50 dark:hover:bg-forest-800 active:scale-95',
    primary: 'bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint border border-forest-200 dark:border-forest-700 font-bold',
    accent: 'bg-neon/20 text-neon-dark dark:text-neon border border-neon/50 font-bold',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold',
    danger: 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold',
  }

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full transition-all duration-150 select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </Tag>
  )
}

export default Chip
