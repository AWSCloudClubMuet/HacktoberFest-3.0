import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="wrap pagemsg">
      <h1>{t('common.notFoundTitle')}</h1>
      <p>{t('common.notFoundBody')}</p>
      <Link className="btn" to="/">
        {t('common.backHome')}
      </Link>
    </div>
  );
}
