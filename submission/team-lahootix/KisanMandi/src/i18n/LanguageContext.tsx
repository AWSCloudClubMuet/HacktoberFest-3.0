import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, STORAGE_KEY_LANG, LanguageConfig } from './config'
import enTranslations from './locales/en.json'
import urTranslations from './locales/ur.json'

type LocaleData = Record<string, any>

const translationsMap: Record<string, LocaleData> = {
  en: enTranslations,
  ur: urTranslations,
}

interface LanguageContextType {
  language: string
  config: LanguageConfig
  dir: 'ltr' | 'rtl'
  isRTL: boolean
  setLanguage: (lang: string) => void
  supportedLanguages: LanguageConfig[]
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG)
      if (saved && SUPPORTED_LANGUAGES[saved]) {
        return saved
      }
    } catch {
      // ignore
    }
    return DEFAULT_LANGUAGE
  })

  const config = useMemo(() => {
    return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
  }, [language])

  const dir = config.dir
  const isRTL = dir === 'rtl'

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language)
    } catch {
      // ignore
    }
    // Update document HTML element lang & dir
    document.documentElement.lang = language
    document.documentElement.dir = dir
    if (isRTL) {
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.classList.remove('rtl')
    }
  }, [language, dir, isRTL])

  const setLanguage = (lang: string) => {
    if (SUPPORTED_LANGUAGES[lang]) {
      setLanguageState(lang)
    }
  }

  const supportedLanguages = useMemo(() => {
    return Object.values(SUPPORTED_LANGUAGES)
  }, [])

  // Nested translation lookup
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let current: any = translationsMap[language]

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        current = undefined
        break
      }
    }

    // Fallback to English if missing
    if (current === undefined && language !== 'en') {
      let fallback: any = translationsMap['en']
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = fallback[k]
        } else {
          fallback = undefined
          break
        }
      }
      current = fallback
    }

    if (current === undefined || typeof current !== 'string') {
      return key
    }

    let text = current
    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal))
      }
    }

    return text
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        config,
        dir,
        isRTL,
        setLanguage,
        supportedLanguages,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
