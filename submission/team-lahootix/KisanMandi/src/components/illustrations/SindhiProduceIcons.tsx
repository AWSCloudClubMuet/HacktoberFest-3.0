import React from 'react'

interface ProduceIconProps {
  className?: string
  size?: number
}

// 1. Sindhri Mango Line Icon
export const SindhriMangoIcon: React.FC<ProduceIconProps> = ({
  className = '',
  size = 22,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-label="Sindhri Mango"
      role="img"
    >
      <path
        d="M12 2C8 2 4.5 6 4.5 11.5C4.5 17.5 9 22 14.5 22C19.5 22 21.5 17.5 21.5 12.5C21.5 6.5 16.5 2 12 2Z"
        fill="#F9A825"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stem and small mango leaf */}
      <path d="M12 2V5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M12 4C14.5 3 17 3.5 18 5C17.5 6.5 15.5 6.5 12 5"
        fill="#3D9E64"
        fillOpacity="0.6"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

// 2. Cotton Boll Line Icon
export const CottonBollIcon: React.FC<ProduceIconProps> = ({
  className = '',
  size = 22,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-label="Cotton Boll"
      role="img"
    >
      {/* Fluffy cotton lobes */}
      <circle cx="10" cy="11" r="4.5" fill="#FFFFFF" fillOpacity="0.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="10" r="4.5" fill="#FFFFFF" fillOpacity="0.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="15" r="4.5" fill="#FFFFFF" fillOpacity="0.8" stroke="currentColor" strokeWidth="1.5" />
      {/* Sepal calyx cup & stem */}
      <path d="M12 18V22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M7 17C10 20 14 20 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 3. Wheat Stalk Line Icon
export const WheatStalkIcon: React.FC<ProduceIconProps> = ({
  className = '',
  size = 22,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-label="Wheat Stalk"
      role="img"
    >
      <path d="M4 22L12 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M11 15L15 11C16 10 17 9 17 8C17 6.5 15.5 5 14 5C13 5 12 6 11 7L7 11"
        fill="#DFFF38"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 11L19 7C20 6 21 5 21 4C21 2.5 19.5 1 18 1C17 1 16 2 15 3L11 7"
        fill="#DFFF38"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M7 19L11 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 4. Combined Decorative Group of Sindh produce icons
export const SindhProduceIconsBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`culture-layer inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-forest-50/80 dark:bg-forest-900/60 border border-forest-200 dark:border-forest-700/60 text-forest-800 dark:text-forest-200 select-none ${className}`}
    >
      <SindhriMangoIcon size={18} />
      <CottonBollIcon size={18} />
      <WheatStalkIcon size={18} />
    </div>
  )
}
