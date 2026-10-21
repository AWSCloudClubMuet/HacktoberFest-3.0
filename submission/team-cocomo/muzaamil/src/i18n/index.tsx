import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { activateLanguage, getLanguage, intlLocales, isLanguage, LANGUAGE_STORAGE_KEY } from "./language";
import { translate } from "./translate";
import type { Language, TranslationParams } from "./types";

type I18n = {
  language: Language;
  locale: string;
  dir: "ltr" | "rtl";
  isRtl: boolean;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
};
const Context = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(getLanguage);
  const setLanguage = useCallback((next: Language) => {
    if (!isLanguage(next)) return;
    activateLanguage(next);
    updateLanguage(next);
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* The switch still works without storage. */ }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
    document.title = `ReliefHub · ${translate(language, "Sindh flood response")}`;
    const sync = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && isLanguage(event.newValue)) {
        activateLanguage(event.newValue);
        updateLanguage(event.newValue);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [language]);

  const value = useMemo<I18n>(() => ({
    language,
    locale: intlLocales[language],
    dir: language === "en" ? "ltr" : "rtl",
    isRtl: language !== "en",
    setLanguage,
    t: (key, params) => translate(language, key, params),
  }), [language, setLanguage]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export { translate, tr } from "./translate";
export { getLanguage, intlLocales } from "./language";
export type { Language, TranslationCatalog, TranslationParams } from "./types";
