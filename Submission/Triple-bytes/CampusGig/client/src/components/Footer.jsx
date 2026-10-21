import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="wrap footerin">
        <Link className="brand" to="/" style={{ fontSize: 16 }}>
          <span className="mark" style={{ width: 26, height: 26, fontSize: 13 }}>
            <span className="arrow">↗</span>
          </span>
          <span dir="ltr">campusgig.</span>
        </Link>
        <span>{t('footer.tagline')}</span>
        <div className="footerlinks">
          <Link to="/">{t('footer.explore')}</Link>
          <a href="/#how">{t('footer.how')}</a>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            {t('footer.privacy')}
          </a>
        </div>
        <span>{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
