import React from 'react'

interface CropIconsRowProps {
  className?: string
  size?: number
}

export const CropIconsRow: React.FC<CropIconsRowProps> = ({
  className = '',
  size = 20,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`culture-layer flex items-center justify-center space-x-3 select-none pointer-events-none text-forest-700 dark:text-forest-300 opacity-80 ${className}`}
    >
      {/* 1. Wheat Stalk */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22L12 14" />
        <path d="M11 15L15 11C16 10 17 9 17 8C17 6.5 15.5 5 14 5C13 5 12 6 11 7L7 11" fill="currentColor" fillOpacity="0.2" />
        <path d="M15 11L19 7C20 6 21 5 21 4C21 2.5 19.5 1 18 1C17 1 16 2 15 3L11 7" fill="currentColor" fillOpacity="0.2" />
        <path d="M7 19L11 15" />
      </svg>

      {/* 2. Sindhri Mango */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 5 6 5 11C5 17 9 22 14 22C19 22 21 17 21 12C21 7 16 2 12 2Z" fill="#F9A825" fillOpacity="0.25" />
        <path d="M12 2V5" />
        <path d="M12 5C14 4 16 4 17 5" />
      </svg>

      {/* 3. Cotton Boll */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="11" r="4.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="15" cy="10" r="4.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="12" cy="15" r="4.5" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 18V22" />
        <path d="M8 17C10 19 14 19 16 17" />
      </svg>

      {/* 4. Banana */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18C8 22 17 21 20 13C22 8 20 4 20 2C18 3 14 4 11 8C7 13 4 15 4 18Z" fill="#DFFF38" fillOpacity="0.25" />
      </svg>

      {/* 5. Onion */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4C8 4 6 9 6 14C6 19 9 22 12 22C15 22 18 19 18 14C18 9 16 4 12 4Z" fill="var(--ajrak-crimson)" fillOpacity="0.2" />
        <path d="M12 1V4" />
        <path d="M10 2L12 4L14 2" />
      </svg>

      {/* 6. Tomato */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" fill="var(--ajrak-crimson)" fillOpacity="0.25" />
        <path d="M12 3V6" />
        <path d="M9 5C11 6 13 6 15 5" />
        <path d="M10 7C11 8 13 8 14 7" />
      </svg>

      {/* 7. Indus River Wave */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12C5 9 8 9 11 12C14 15 17 15 20 12" />
        <path d="M4 17C7 14 10 14 13 17C16 20 19 20 22 17" />
      </svg>
    </div>
  )
}
