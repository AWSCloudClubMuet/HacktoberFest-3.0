import type { Language } from "./types";

export const LANGUAGE_STORAGE_KEY = "reliefhub.language";
export const intlLocales: Record<Language, string> = { en: "en-GB", ur: "ur-PK", sd: "sd-PK" };
export const isLanguage = (value: unknown): value is Language => value === "en" || value === "ur" || value === "sd";

export function readLanguage(): Language {
  try {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

let activeLanguage = readLanguage();
export const getLanguage = () => activeLanguage;
export function activateLanguage(language: Language) { activeLanguage = language; }
