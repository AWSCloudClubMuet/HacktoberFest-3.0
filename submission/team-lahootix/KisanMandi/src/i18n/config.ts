/**
 * Extensible Language Configuration for KisanMandi
 *
 * Supported languages: English (en) and Urdu (ur, RTL).
 * To add a new language later:
 * 1. Create a new locale JSON file in `src/i18n/locales/<code&gt;.json`
 * 2. Add an entry to SUPPORTED_LANGUAGES below with code, native name, dir, and font stack.
 */

export interface LanguageConfig {
  code: string
  nativeName: string
  dir: 'ltr' | 'rtl'
  fontFamily: string
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    nativeName: 'English',
    dir: 'ltr',
    fontFamily: 'font-sans',
  },
  ur: {
    code: 'ur',
    nativeName: 'اردو',
    dir: 'rtl',
    fontFamily: 'font-urdu',
  },
}

export const DEFAULT_LANGUAGE = 'en'
export const STORAGE_KEY_LANG = 'km_lang'
