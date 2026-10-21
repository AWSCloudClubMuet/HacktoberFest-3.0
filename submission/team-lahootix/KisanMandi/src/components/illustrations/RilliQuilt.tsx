import React from 'react'

interface RilliQuiltProps {
  className?: string
  size?: number
}

export const RilliQuilt: React.FC<RilliQuiltProps> = ({
  className = '',
  size = 110,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Sindhi Rilli Patchwork Quilt with Green Leaf"
      role="img"
    >
      <defs>
        <filter id="quiltShadow" x="0" y="4" width="120" height="116" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Main Quilt Body - tilted / folded slightly */}
      <g filter="url(#quiltShadow)">
        {/* Ivory Base Quilt Square */}
        <rect x="15" y="15" width="90" height="90" rx="8" fill="var(--ajrak-ivory)" stroke="var(--ajrak-black)" strokeWidth="1.5" />

        {/* Outer Ajrak-crimson decorative frame */}
        <rect x="20" y="20" width="80" height="80" rx="4" fill="none" stroke="var(--ajrak-crimson)" strokeWidth="2" strokeDasharray="4 2" />

        {/* Patchwork Grid of 4 main Quadrants */}

        {/* Quadrant 1 (Top Left) */}
        <polygon points="24,24 60,24 24,60" fill="var(--ajrak-crimson)" />
        <polygon points="60,24 60,60 24,60" fill="var(--ajrak-indigo)" />
        <circle cx="42" cy="42" r="3" fill="var(--ajrak-ivory)" />

        {/* Quadrant 2 (Top Right) */}
        <polygon points="60,24 96,24 96,60" fill="var(--ajrak-turquoise)" />
        <polygon points="60,24 60,60 96,60" fill="#E6A11D" />
        <polygon points="78,42 84,36 90,42 84,48" fill="var(--ajrak-ivory)" />

        {/* Quadrant 3 (Bottom Left) */}
        <polygon points="24,60 60,60 60,96" fill="#1C4C33" />
        <polygon points="24,60 24,96 60,96" fill="var(--ajrak-crimson)" />
        <polygon points="42,78 48,72 54,78 48,84" fill="#DFFF38" />

        {/* Quadrant 4 (Bottom Right) */}
        <polygon points="60,60 96,60 60,96" fill="var(--ajrak-indigo)" />
        <polygon points="96,60 96,96 60,96" fill="var(--ajrak-turquoise)" />
        <circle cx="78" cy="78" r="3" fill="var(--ajrak-ivory)" />

        {/* Center Joining Star */}
        <rect x="54" y="54" width="12" height="12" fill="var(--ajrak-ivory)" stroke="var(--ajrak-black)" strokeWidth="1" transform="rotate(45 60 60)" />
        <circle cx="60" cy="60" r="2.5" fill="var(--ajrak-crimson)" />
      </g>

      {/* Sprouting Green Agricultural Leaf resting peacefully on the quilt */}
      <g transform="translate(68, 70) scale(0.95)">
        <path
          d="M0 25 C0 10 18 0 32 0 C32 16 22 30 5 30 Z"
          fill="#3D9E64"
          stroke="#0E2A1B"
          strokeWidth="1.5"
        />
        <path
          d="M0 25 C12 18 20 12 32 0"
          stroke="#DFFF38"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
