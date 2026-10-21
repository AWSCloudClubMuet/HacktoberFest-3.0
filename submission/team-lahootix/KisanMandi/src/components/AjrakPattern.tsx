import React from 'react'

/**
 * Reusable Ajrak pattern components
 * All components include the `culture-layer` class so they disappear
 * when the user disables "Cultural patterns".
 * Symmetrical and safe in RTL.
 */

interface PatternProps {
  className?: string
  height?: number
  opacity?: number
}

// 1. Thin Ajrak Strip for headers, card tops, heroes
export const AjrakStrip: React.FC<PatternProps & { variant?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  height = 8,
  variant = 'sm',
}) => {
  const h = variant === 'sm' ? 6 : variant === 'lg' ? 14 : 10
  return (
    <div
      aria-hidden="true"
      className={`culture-layer w-full overflow-hidden select-none pointer-events-none transition-opacity ${
        variant === 'sm' ? 'bg-ajrak-strip-sm' : 'bg-ajrak-strip'
      } ${className}`}
      style={{ height: `${height || h}px` }}
    />
  )
}

// 2. Corner Ornament for cards (e.g. Onboarding card, Best Market card)
export const AjrakCorner: React.FC<{
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  size?: number
}> = ({ className = '', position = 'top-right', size = 36 }) => {
  const posClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0 -scale-x-100',
    'bottom-right': 'bottom-0 right-0 scale-y-[-1]',
    'bottom-left': 'bottom-0 left-0 -scale-100',
  }[position]

  return (
    <div
      aria-hidden="true"
      className={`culture-layer absolute ${posClasses} pointer-events-none select-none z-10 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xs"
      >
        {/* Corner triangle backing */}
        <path d="M0 0 H36 V36 Z" fill="var(--ajrak-indigo)" opacity="0.9" />
        {/* Crimson diamond accent */}
        <path d="M12 0 L36 24 V12 L24 0 Z" fill="var(--ajrak-crimson)" />
        {/* Traditional 8-point Ajrak Star at corner center */}
        <g transform="translate(24, 12) scale(0.6)">
          <path
            d="M0 -8 L2.5 -2.5 L8 0 L2.5 2.5 L0 8 L-2.5 2.5 L-8 0 L-2.5 -2.5 Z"
            fill="var(--ajrak-ivory)"
          />
          <path
            d="M-5.6 -5.6 L-1.8 -1.8 L-1.8 -1.8 L-5.6 5.6 L-1.8 1.8 L5.6 5.6 L1.8 -1.8 L5.6 -5.6 Z"
            fill="var(--ajrak-crimson)"
          />
          <circle cx="0" cy="0" r="1.5" fill="var(--ajrak-ivory)" />
        </g>
        {/* Ivory boundary dots */}
        <circle cx="6" cy="30" r="1.5" fill="var(--ajrak-ivory)" />
        <circle cx="12" cy="24" r="1.5" fill="var(--ajrak-ivory)" />
        <circle cx="18" cy="18" r="1.5" fill="var(--ajrak-ivory)" />
        <circle cx="24" cy="12" r="1.5" fill="var(--ajrak-ivory)" />
        <circle cx="30" cy="6" r="1.5" fill="var(--ajrak-ivory)" />
      </svg>
    </div>
  )
}

// 3. Ajrak Section Divider (row of diamonds and dots)
export const AjrakDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`culture-layer flex items-center justify-center space-x-2 py-3 overflow-hidden select-none pointer-events-none ${className}`}
    >
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-forest-700 to-transparent" />
      <div className="flex items-center space-x-1.5 px-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ajrak-crimson)]" />
        <span className="w-2 h-2 rotate-45 bg-[var(--ajrak-indigo)] border border-[var(--ajrak-ivory)]" />
        <span className="w-3 h-3 rotate-45 bg-[var(--ajrak-crimson)] border border-[var(--ajrak-ivory)] shadow-2xs" />
        <span className="w-2 h-2 rotate-45 bg-[var(--ajrak-indigo)] border border-[var(--ajrak-ivory)]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ajrak-crimson)]" />
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-forest-700 to-transparent" />
    </div>
  )
}

// 4. Ajrak Badge Ring (for circular crop icon badge)
export const AjrakBadgeRing: React.FC<{ size?: number; className?: string; children?: React.ReactNode }> = ({
  size = 44,
  className = '',
  children,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Decorative Ajrak dotted ring */}
      <svg
        aria-hidden="true"
        className="culture-layer absolute inset-0 w-full h-full pointer-events-none select-none"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="22"
          cy="22"
          r="20.5"
          stroke="var(--ajrak-crimson)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.85"
        />
        <circle
          cx="22"
          cy="22"
          r="18.5"
          stroke="var(--ajrak-indigo)"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </svg>
      {children}
    </div>
  )
}

// 5. Best Place to Sell Ribbon (crimson and ivory Ajrak corner badge)
export const AjrakBestMarketRibbon: React.FC<{ label?: string; className?: string }> = ({
  label = '🏆 Best Mandi',
  className = '',
}) => {
  return (
    <div
      className={`culture-layer inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--ajrak-ivory)] bg-[var(--ajrak-crimson)] border border-[var(--ajrak-ivory)]/40 shadow-xs ${className}`}
    >
      <span className="w-1.5 h-1.5 rotate-45 bg-[var(--ajrak-ivory)]" />
      <span className="tracking-wide">{label}</span>
      <span className="w-1.5 h-1.5 rotate-45 bg-[var(--ajrak-ivory)]" />
    </div>
  )
}

// 6. Subtle Ajrak Tile Overlay for circles/heroes
export const AjrakOverlay: React.FC<{ className?: string; opacity?: number }> = ({
  className = '',
  opacity = 0.08,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`culture-layer absolute inset-0 bg-ajrak-pattern rounded-full pointer-events-none select-none transition-opacity ${className}`}
      style={{ opacity }}
    />
  )
}

// 7. Woven Tag Grade Chip (A/B/C)
export const AjrakGradeTag: React.FC<{ grade: 'A' | 'B' | 'C'; className?: string }> = ({
  grade,
  className = '',
}) => {
  const styles = {
    A: 'border-[var(--ajrak-crimson)] text-[var(--ajrak-crimson)] bg-red-50 dark:bg-red-950/40 dark:text-red-300',
    B: 'border-[var(--ajrak-indigo)] text-[var(--ajrak-indigo)] bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
    C: 'border-[var(--ajrak-turquoise)] text-[var(--ajrak-turquoise)] bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300',
  }[grade]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border border-dashed shadow-2xs relative ${styles} ${className}`}
      title={`Grade ${grade}`}
    >
      <span className="culture-layer w-1 h-1 rounded-full bg-current mr-1 opacity-75" />
      <span>Grade {grade}</span>
    </span>
  )
}

// 8. Rilli Patch Sold Banner
export const RilliSoldBanner: React.FC<{ text?: string; className?: string }> = ({
  text = 'SOLD',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-900 text-white py-2 px-4 shadow-sm flex items-center justify-between ${className}`}
    >
      {/* Decorative Sindhi Rilli pattern underlay */}
      <div
        aria-hidden="true"
        className="culture-layer absolute inset-0 bg-rilli-patch opacity-30 pointer-events-none"
      />
      <div className="relative z-10 flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rotate-45 bg-[var(--ajrak-ivory)]" />
        <span className="font-black text-sm tracking-widest text-[var(--ajrak-ivory)]">
          {text}
        </span>
      </div>
      <span className="relative z-10 text-xs text-gray-300 font-medium">
        Completed Harvest
      </span>
    </div>
  )
}
