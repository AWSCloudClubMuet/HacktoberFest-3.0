import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ur from './ur.json';

const STORAGE_KEY = 'campusgig_lang';

export function applyDirection(lng) {
  const isUrdu = lng === 'ur';
  document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
  document.documentElement.lang = isUrdu ? 'ur' : 'en';
}

const saved = localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

applyDirection(saved);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDirection(lng);
});

export default i18n;
