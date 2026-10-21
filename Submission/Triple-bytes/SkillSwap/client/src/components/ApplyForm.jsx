import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createApplication } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ApplyForm({ gigId, onApplied }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 5 || text.length > 500) {
      setError(t('details.messageInvalid'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const created = await createApplication({ gig_id: gigId, message: text });
      toast.show(t('details.sent'));
      setMessage('');
      onApplied?.(created);
    } catch (err) {
      toast.error(err);
      if (['GIG_NOT_OPEN', 'DUPLICATE_APPLICATION'].includes(err?.apiError?.code)) onApplied?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={`field${error ? ' invalid' : ''}`} style={{ marginTop: 0 }}>
        <label htmlFor="apply-message">{t('details.messageLabel')}</label>
        <textarea
          id="apply-message"
          value={message}
          maxLength={500}
          placeholder={t('details.messagePlaceholder')}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error ? <div className="err">{error}</div> : <div className="hint">{message.length}/500</div>}
      </div>
      <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
        {submitting ? t('details.sending') : t('details.send')}
      </button>
    </form>
  );
}
