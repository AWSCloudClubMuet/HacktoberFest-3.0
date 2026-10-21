import React from 'react'

interface BullockCartProps {
  className?: string
  size?: number
}

export const BullockCart: React.FC<BullockCartProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Sindhi Bullock Cart Wheel"
      role="img"
    >
      {/* Traditional Wooden Spoked Wheel */}
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="32" cy="32" r="8" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="3" fill="#DFFF38" />

      {/* 8 Wooden Spokes radiating from hub */}
      <line x1="32" y1="4" x2="32" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="40" x2="32" y2="60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="26" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="38" x2="52" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="12" x2="38" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="38" x2="12" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
