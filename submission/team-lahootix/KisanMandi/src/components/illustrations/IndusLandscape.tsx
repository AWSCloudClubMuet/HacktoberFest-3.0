import React from 'react'

interface IndusLandscapeProps {
  className?: string
  size?: number
}

export const IndusLandscape: React.FC<IndusLandscapeProps> = ({
  className = '',
  size = 320,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Sindh Indus River Landscape with Farmer and Crops"
      role="img"
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="160" cy="160" r="150" />
        </clipPath>
        <linearGradient id="skyGrad" x1="160" y1="10" x2="160" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5FAF6" stopOpacity="0.8" />
          <stop offset="0.6" stopColor="#E3F4EA" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C4E9D2" />
        </linearGradient>
        <linearGradient id="riverGrad" x1="160" y1="210" x2="160" y2="310" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1F8A9E" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#1B7183" stopOpacity="0.85" />
          <stop offset="1" stopColor="#134E5B" />
        </linearGradient>
      </defs>

      {/* Outer Faint Outlined Circle (like reference image) */}
      <circle
        cx="160"
        cy="160"
        r="156"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <circle
        cx="160"
        cy="160"
        r="150"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />

      <g clipPath="url(#circleClip)">
        {/* Soft Background Fill */}
        <rect width="320" height="320" fill="url(#skyGrad)" />

        {/* Golden Sun over Indus horizon */}
        <circle cx="210" cy="110" r="32" fill="#DFFF38" fillOpacity="0.85" />
        <circle cx="210" cy="110" r="44" stroke="#DFFF38" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="3 4" />

        {/* Distant Riverbanks / Alluvial Low Hills */}
        <path
          d="M0 190 Q80 170 160 185 T320 175 V240 H0 Z"
          fill="#1C4C33"
          fillOpacity="0.35"
        />
        <path
          d="M0 205 Q90 195 180 205 T320 195 V260 H0 Z"
          fill="#143825"
          fillOpacity="0.5"
        />

        {/* Indus River Waves */}
        <path
          d="M0 220 Q70 212 160 222 T320 216 V320 H0 Z"
          fill="url(#riverGrad)"
        />
        <path
          d="M20 238 Q90 232 170 238 T300 234"
          stroke="#F6EEDC"
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M50 258 Q130 252 210 258 T310 255"
          stroke="#F6EEDC"
          strokeOpacity="0.3"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Rural Indus Wooden Boat on river */}
        <g transform="translate(190, 222) scale(0.65)">
          {/* Hull */}
          <path d="M0 16 Q30 26 60 16 L50 22 Q30 28 10 22 Z" fill="#4A2E18" />
          <path d="M10 16 L50 16 L44 21 L16 21 Z" fill="#6B4423" />
          {/* Mast and Triangular Sail with Crimson Accent */}
          <line x1="30" y1="2" x2="30" y2="16" stroke="#2B1A0D" strokeWidth="1.5" />
          <path d="M30 3 L48 14 H30 Z" fill="#F6EEDC" opacity="0.9" />
          <path d="M30 4 L14 14 H30 Z" fill="var(--ajrak-crimson)" opacity="0.75" />
        </g>

        {/* Foreground Fertile Field Bank */}
        <path
          d="M-20 260 Q80 240 180 255 T340 250 V340 H-20 Z"
          fill="#0E2A1B"
        />

        {/* Wheat and Cotton Stalks on Right */}
        <g transform="translate(230, 215) scale(0.75)">
          {/* Wheat Stalk 1 */}
          <path d="M20 70 Q24 35 22 5" stroke="#DFFF38" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="20" cy="10" rx="3.5" ry="7" fill="#DFFF38" transform="rotate(-20 20 10)" />
          <ellipse cx="26" cy="18" rx="3.5" ry="7" fill="#DFFF38" transform="rotate(25 26 18)" />
          <ellipse cx="19" cy="24" rx="3.5" ry="7" fill="#DFFF38" transform="rotate(-20 19 24)" />
          <ellipse cx="25" cy="32" rx="3.5" ry="7" fill="#DFFF38" transform="rotate(25 25 32)" />

          {/* Cotton Boll Stalk 2 */}
          <path d="M50 70 Q45 40 40 15" stroke="#C6F5D5" strokeWidth="2.5" strokeLinecap="round" />
          {/* Fluffy Cotton head */}
          <circle cx="38" cy="14" r="6" fill="#FFFFFF" />
          <circle cx="44" cy="16" r="5" fill="#FFFFFF" />
          <circle cx="34" cy="18" r="5" fill="#FFFFFF" />
          <path d="M32 21 Q40 25 46 20" stroke="#1C4C33" strokeWidth="2" fill="#1C4C33" />
        </g>

        {/* Farmer Silhouette with Sindhi Topi on Left */}
        <g transform="translate(48, 175) scale(0.85)">
          {/* Sindhi Topi (Crown arc cutout) */}
          <path
            d="M38 30 C38 20 54 20 54 30 L55 33 C51 30 41 30 37 33 Z"
            fill="var(--ajrak-crimson)"
          />
          {/* Topi Geometric Motif */}
          <path d="M41 27 L46 23 L51 27" stroke="var(--ajrak-ivory)" strokeWidth="1" fill="none" />
          <circle cx="46" cy="27" r="1" fill="var(--ajrak-ivory)" />

          {/* Head & Neck silhouette */}
          <circle cx="46" cy="38" r="8" fill="#1C4C33" />
          <path d="M43 45 H49 V52 H43 Z" fill="#1C4C33" />

          {/* Shoulders & Kurta (Ajrak Ajrak-hued border) */}
          <path
            d="M30 52 C30 48 62 48 62 52 L68 95 H24 Z"
            fill="#143825"
          />
          {/* Ajrak Shawl draped over shoulder */}
          <path
            d="M30 52 Q38 56 46 54 L44 95 H32 Z"
            fill="var(--ajrak-indigo)"
          />
          <line x1="38" y1="55" x2="38" y2="95" stroke="var(--ajrak-crimson)" strokeWidth="2" />
          <circle cx="38" cy="65" r="1.5" fill="var(--ajrak-ivory)" />
          <circle cx="38" cy="78" r="1.5" fill="var(--ajrak-ivory)" />

          {/* Farmer's walking staff / agricultural tool */}
          <line x1="68" y1="36" x2="66" y2="95" stroke="#DFFF38" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
