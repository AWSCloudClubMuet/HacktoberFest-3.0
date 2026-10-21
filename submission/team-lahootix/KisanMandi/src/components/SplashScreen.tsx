import React, { useState, useEffect } from 'react'
import { useTranslation } from '../i18n'

export const SplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => {
    try {
      // Skip if already seen in current session
      if (sessionStorage.getItem('km_splash_seen')) {
        return false
      }
      // Skip if user prefers reduced motion
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false
      }
    } catch {
      // ignore
    }
    return true
  })

  useEffect(() => {
    if (!visible) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem('km_splash_seen', 'true')
      } catch {
        // ignore
      }
      setVisible(false)
      onComplete?.()
    }, 1100) // <= 1.2s

    return () => clearTimeout(timer)
  }, [visible, onComplete])

  if (!visible) return null

  return (
    <div
      aria-label="Loading KisanMandi"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-forest-950 text-white transition-opacity duration-300"
    >
      <div className="relative flex flex-col items-center p-8">
        {/* Animated Drawing Ajrak Border */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-5">
          <svg
            className="absolute inset-0 w-full h-full select-none"
            viewBox="0 0 112 112"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background subtle ring */}
            <circle cx="56" cy="56" r="50" stroke="#1C4C33" strokeWidth="3" />
            {/* Animated drawing Ajrak border */}
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="#DFFF38"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-draw-border"
            />
            {/* Ajrak diamond accents along ring */}
            <rect x="53" y="3" width="6" height="6" fill="var(--ajrak-crimson)" transform="rotate(45 56 6)" />
            <rect x="53" y="103" width="6" height="6" fill="var(--ajrak-crimson)" transform="rotate(45 56 106)" />
            <rect x="3" y="53" width="6" height="6" fill="var(--ajrak-crimson)" transform="rotate(45 6 56)" />
            <rect x="103" y="53" width="6" height="6" fill="var(--ajrak-crimson)" transform="rotate(45 106 56)" />
          </svg>

          {/* Golden Leaf Logo */}
          <div className="text-4xl select-none animate-pulse">
            🌾
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
          <span>{t('app.name')}</span>
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#DFFF38] font-bold mt-1">
          {t('splash.tagline')}
        </p>
      </div>
    </div>
  )
}
