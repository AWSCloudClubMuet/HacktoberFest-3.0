import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateGigStatus } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

export default function GigStatusControls({ gig, onChanged }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const action =
    gig.status === 'Open'
      ? { to: 'Cancelled', label: t('controls.cancel'), confirm: t('controls.confirmCancel'), done: t('controls.cancelled'), light: true }
      : gig.status === 'In Progress'
        ? { to: 'Completed', label: t('controls.complete'), confirm: t('controls.confirmComplete'), done: t('controls.completed'), light: false }
        : null;

  if (!action) return null;

  async function run() {
    if (!window.confirm(action.confirm)) return;
    setBusy(true);
    try {
      const updated = await updateGigStatus(gig.id, action.to);
      toast.show(action.done);
      setBusy(false);
      onChanged?.(updated);
    } catch (err) {
      toast.error(err);
      setBusy(false);
      onChanged?.();
    }
  }

  return (
    <button type="button" className={`btn small${action.light ? ' light' : ''}`} disabled={busy} onClick={run}>
      {action.label}
    </button>
  );
}
