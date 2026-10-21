import React from 'react'

interface SindhiArchIconProps {
  className?: string
  size?: number
}

/**
 * Small doorway / arch icon inspired by Sindhi architectural heritage (cusped multi-foil arch)
 * for Mandi / Market selector chips.
 */
export const SindhiArchIcon: React.FC<SindhiArchIconProps> = ({
  className = '',
  size = 14,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-hidden="true"
    >
      {/* Cusped multi-foil Sindhi Mandi Arch */}
      <path
        d="M2 15 V9 C2 7 3.5 5 5 4.5 C6.5 4 8 2 8 2 C8 2 9.5 4 11 4.5 C12.5 5 14 7 14 9 V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner doorway outline */}
      <path
        d="M5 15 V10 C5 8.5 6 7 8 6 C10 7 11 8.5 11 10 V15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Keystone apex dot */}
      <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  )
}
