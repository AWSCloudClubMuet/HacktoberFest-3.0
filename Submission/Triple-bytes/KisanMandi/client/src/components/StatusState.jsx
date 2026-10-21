import { useTranslation } from 'react-i18next';

export function LoadingState() {
  const { t } = useTranslation();
  return <div className="status-state"><span className="loader" /><p>{t('common.loading')}</p></div>;
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return <div className="status-state error-state"><span>!</span><p>{message}</p>{onRetry && <button className="btn btn-small" onClick={onRetry}>{t('common.retry')}</button>}</div>;
}

export function EmptyState({ message }) {
  return <div className="status-state"><span className="empty-icon">⌕</span><p>{message}</p></div>;
}
