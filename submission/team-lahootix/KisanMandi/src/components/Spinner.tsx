import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`} role="status">
      <div
        className={`${sizeClasses[size]} border-primary/20 border-t-primary rounded-full animate-spin`}
      />
      {label && <span className="mt-2 text-sm text-gray-500 font-medium">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner
