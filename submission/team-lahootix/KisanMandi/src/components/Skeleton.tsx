import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-gray-200 dark:bg-forest-900 rounded-md ${className}`} />
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-forest-950 rounded-2xl p-4 border border-gray-100 dark:border-forest-800 shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between items-end pt-2">
        <Skeleton className="h-8 w-1/2 rounded" />
        <Skeleton className="h-5 w-1/4 rounded" />
      </div>
    </div>
  )
}

export default Skeleton
