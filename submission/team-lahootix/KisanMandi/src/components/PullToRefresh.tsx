import React, { useState, useRef, useEffect, useCallback } from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void
  isRefreshing?: boolean
  children: React.ReactNode
  pullThreshold?: number
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing = false,
  children,
  pullThreshold = 70,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(isRefreshing)
  const touchStartY = useRef<number | null>(null)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRefreshing(isRefreshing)
  }, [isRefreshing])

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh if we are at the top of the page
    if (window.scrollY <= 2 && !refreshing) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || touchStartY.current === null || refreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current

    if (diff > 0 && window.scrollY <= 2) {
      // Damping resistance formula
      const damping = 0.4
      const distance = Math.min(diff * damping, pullThreshold + 25)
      setPullDistance(distance)
    } else {
      setPullDistance(0)
      isPulling.current = false
    }
  }

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false
    touchStartY.current = null

    if (pullDistance >= pullThreshold) {
      setRefreshing(true)
      setPullDistance(pullThreshold * 0.75)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => {
          setRefreshing(false)
          setPullDistance(0)
        }, 400)
      }
    } else {
      setPullDistance(0)
    }
  }, [onRefresh, pullDistance, pullThreshold])

  const progress = Math.min(pullDistance / pullThreshold, 1)

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative ${className}`}
    >
      {/* Pull Indicator */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
        className="overflow-hidden flex items-center justify-center transition-all duration-150 text-primary pointer-events-none"
      >
        <div className="flex items-center space-x-2 text-xs font-semibold bg-white/90 backdrop-blur-xs py-1.5 px-3 rounded-full shadow-sm border border-gray-100">
          {refreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span>Refreshing prices...</span>
            </>
          ) : progress >= 1 ? (
            <>
              <RefreshCw className="w-4 h-4 text-primary transform rotate-180 transition-transform" />
              <span>Release to refresh</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-4 h-4 text-primary transition-transform"
                style={{ transform: `rotate(${progress * 180}deg)` }}
              />
              <span>Pull to refresh</span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

export default PullToRefresh
