import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './ui.jsx';

// Native <dialog>: focus is trapped and Escape closes it for free.
export function Modal({ open, title, description, onClose, children, size = 'md' }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the close button by default; start on the first
      // field instead (or an element marked data-autofocus).
      const target =
        dialog.querySelector('[data-autofocus]') ||
        dialog.querySelector('input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])');
      target?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-xl bg-white p-0 text-slate-900 shadow-2xl`}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog">
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function ModalActions({ children }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">{children}</div>;
}

// Confirmation for destructive or irreversible actions.
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', tone = 'danger', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <div className="text-sm text-slate-600">{children}</div>
      <ModalActions>
        {/* Focus starts on Cancel so Enter never confirms a destructive action by accident. */}
        <Button variant="secondary" onClick={onClose} disabled={busy} data-autofocus>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} busy={busy}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}

// Hook form of ConfirmDialog: `ask({ title, message, confirmLabel, onConfirm })`
// opens it; onConfirm may be async and keeps the dialog busy until it settles.
export function useConfirm() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const ask = useCallback((options) => setState(options), []);
  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title}
      confirmLabel={state?.confirmLabel}
      tone={state?.tone}
      busy={busy}
      onClose={() => !busy && setState(null)}
      onConfirm={async () => {
        setBusy(true);
        try {
          await state.onConfirm();
        } finally {
          setBusy(false);
          setState(null);
        }
      }}
    >
      {state?.message}
    </ConfirmDialog>
  );
  return [dialog, ask];
}
