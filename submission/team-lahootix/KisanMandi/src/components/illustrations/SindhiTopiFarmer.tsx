import React from 'react'

interface SindhiTopiFarmerProps {
  className?: string
  size?: number
}

export const SindhiTopiFarmer: React.FC<SindhiTopiFarmerProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Sindhi Farmer"
      role="img"
    >
      {/* Soft rounded background badge */}
      <circle cx="24" cy="24" r="22" fill="#EAF5EE" className="dark:fill-forest-800" />

      {/* Outer subtle Ajrak ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="var(--ajrak-crimson)"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.8"
      />

      {/* Sindhi Topi (cylindrical with traditional front arch cutout) */}
      <path
        d="M17 17 C17 9 31 9 31 17 L32 20 C29 18 27 18 24 19 C21 18 19 18 16 20 Z"
        fill="var(--ajrak-crimson)"
      />
      {/* Topi embroidery mirrors / golden stars */}
      <path d="M20 15 L24 12 L28 15" stroke="var(--ajrak-ivory)" strokeWidth="1" fill="none" />
      <circle cx="24" cy="15" r="1.2" fill="var(--ajrak-ivory)" />
      <circle cx="19" cy="17" r="0.9" fill="var(--ajrak-ivory)" />
      <circle cx="29" cy="17" r="0.9" fill="var(--ajrak-ivory)" />

      {/* Face & Neck */}
      <circle cx="24" cy="23" r="6" fill="#143825" />
      <path d="M22 28 H26 V32 H22 Z" fill="#143825" />

      {/* Shoulders / Kurta */}
      <path
        d="M14 34 C14 30 34 30 34 34 L38 45 H10 Z"
        fill="#0E2A1B"
      />
      {/* Ajrak Shawl draped across shoulder */}
      <path
        d="M14 34 Q20 37 26 36 L25 45 H14 Z"
        fill="var(--ajrak-indigo)"
      />
      <circle cx="19" cy="39" r="1" fill="var(--ajrak-ivory)" />
      <circle cx="21" cy="43" r="1" fill="var(--ajrak-ivory)" />
    </svg>
  )
}
