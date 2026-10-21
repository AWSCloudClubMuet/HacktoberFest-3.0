import { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { errorCode } from '../api/client.js';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  const show = useCallback((msg) => {
    setMessage(msg);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  const error = useCallback(
    (err) => {
      const code = errorCode(err);
      show(i18n.exists(`errors.${code}`) ? t(`errors.${code}`) : t('errors.INTERNAL_ERROR'));
    },
    [show, t, i18n],
  );

  const value = useMemo(() => ({ show, error }), [show, error]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
