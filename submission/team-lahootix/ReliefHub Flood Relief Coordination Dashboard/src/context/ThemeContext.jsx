import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  const resolved = mode === 'system' ? getSystemPreference() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-resolved-theme', resolved);
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('reliefhub_theme') || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const saved = localStorage.getItem('reliefhub_theme') || 'system';
    return saved === 'system' ? getSystemPreference() : saved;
  });

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('reliefhub_theme', newMode);
    const resolved = newMode === 'system' ? getSystemPreference() : newMode;
    setResolvedTheme(resolved);
    applyTheme(newMode);
  };

  // Apply on mount and listen to system changes
  useEffect(() => {
    applyTheme(mode);
    const resolved = mode === 'system' ? getSystemPreference() : mode;
    setResolvedTheme(resolved);

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        applyTheme('system');
        setResolvedTheme(getSystemPreference());
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
