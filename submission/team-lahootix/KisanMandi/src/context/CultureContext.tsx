import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CultureContextType {
  cultureEnabled: boolean
  setCultureEnabled: (val: boolean) => void
  toggleCulture: () => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
}

const STORAGE_KEY_CULTURE = 'km_culture'
const STORAGE_KEY_THEME = 'km_theme'

const CultureContext = createContext<CultureContextType | undefined>(undefined)

export const CultureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cultureEnabled, setCultureState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CULTURE)
      if (saved !== null) {
        return saved === 'true'
      }
    } catch {
      // ignore
    }
    return true // On by default
  })

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME)
      if (saved === 'dark' || saved === 'light') {
        return saved
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CULTURE, String(cultureEnabled))
    } catch {
      // ignore
    }

    if (cultureEnabled) {
      document.documentElement.classList.remove('culture-off')
      document.documentElement.classList.add('culture-on')
    } else {
      document.documentElement.classList.remove('culture-on')
      document.documentElement.classList.add('culture-off')
    }
  }, [cultureEnabled])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme)
    } catch {
      // ignore
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleCulture = () => {
    setCultureState((prev) => !prev)
  }

  const setCultureEnabled = (val: boolean) => {
    setCultureState(val)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t)
  }

  return (
    <CultureContext.Provider
      value={{
        cultureEnabled,
        setCultureEnabled,
        toggleCulture,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </CultureContext.Provider>
  )
}

export const useCulture = (): CultureContextType => {
  const context = useContext(CultureContext)
  if (!context) {
    throw new Error('useCulture must be used within a CultureProvider')
  }
  return context
}
