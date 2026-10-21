import { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ur' ? 'ur' : 'en';

  const value = useMemo(
    () => ({
      lang,
      toggle: () => i18n.changeLanguage(lang === 'ur' ? 'en' : 'ur'),
    }),
    [lang, i18n],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
