import React from 'react'

interface SteppedBarsProps {
  className?: string
  width?: number
  height?: number
}

export const SteppedBars: React.FC<SteppedBarsProps> = ({
  className = '',
  width = 160,
  height = 90,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Background Dotted Grid */}
      <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="10" y1="55" x2="150" y2="55" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="10" y1="30" x2="150" y2="30" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 3" />

      {/* Bar 1 */}
      <rect x="20" y="50" width="18" height="30" rx="9" fill="#1C4C33" />
      <rect x="20" y="44" width="18" height="14" rx="7" fill="#DFFF38" fillOpacity="0.85" />

      {/* Bar 2 */}
      <rect x="46" y="36" width="18" height="44" rx="9" fill="#143825" />
      <rect x="46" y="28" width="18" height="18" rx="9" fill="#DFFF38" />

      {/* Bar 3 */}
      <rect x="72" y="22" width="18" height="58" rx="9" fill="#0E2A1B" />
      <rect x="72" y="14" width="18" height="20" rx="9" fill="#DFFF38" />

      {/* Bar 4 */}
      <rect x="98" y="32" width="18" height="48" rx="9" fill="#143825" />
      <rect x="98" y="24" width="18" height="16" rx="8" fill="#DFFF38" fillOpacity="0.9" />

      {/* Bar 5 */}
      <rect x="124" y="42" width="18" height="38" rx="9" fill="#1C4C33" />
      <rect x="124" y="36" width="18" height="14" rx="7" fill="#DFFF38" fillOpacity="0.8" />

      {/* Little accent dot */}
      <circle cx="81" cy="7" r="3" fill="#DFFF38" />
    </svg>
  )
}
