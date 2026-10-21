import { useTranslation } from 'react-i18next';

export default function LanguageButton() {
  const { t, i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === 'ur' ? 'en' : 'ur');
  return <button className="language" type="button" onClick={toggle} aria-label="Switch language">{t('language')}</button>;
}
