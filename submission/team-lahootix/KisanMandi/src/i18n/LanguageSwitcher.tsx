import React from 'react'
import { useTranslation } from './LanguageContext'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'pills' | 'compact'
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'pills',
}) => {
  const { language, setLanguage, supportedLanguages } = useTranslation()

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center rounded-lg bg-gray-100 dark:bg-forest-900/80 p-0.5 border border-gray-200 dark:border-forest-700/60 ${className}`}>
        {supportedLanguages.map((lang) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                isActive
                  ? 'bg-neon text-neon-dark shadow-2xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              aria-pressed={isActive}
            >
              {lang.nativeName}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-xl bg-gray-100/90 dark:bg-forest-950/70 p-1 border border-gray-200/80 dark:border-forest-700/60 shadow-2xs ${className}`}
    >
      {supportedLanguages.map((lang) => {
        const isActive = language === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
              isActive
                ? 'bg-neon text-neon-dark shadow-xs font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={isActive}
          >
            <span>{lang.nativeName}</span>
          </button>
        )
      })}
    </div>
  )
}
