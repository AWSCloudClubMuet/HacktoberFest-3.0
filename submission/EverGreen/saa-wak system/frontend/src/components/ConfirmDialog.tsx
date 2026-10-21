import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E8E7DF] relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-[#FDE8E8] text-[#B3261E]' : 'bg-[#EEF2E8] text-[#4A6B42]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#2F332C]">{title}</h3>
        </div>

        <p className="text-xs text-[#767B70] mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#767B70] hover:text-[#2F332C] rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer shadow-xs ${
              isDestructive
                ? 'bg-[#B3261E] hover:bg-[#991B1B]'
                : 'bg-[#2D452B] hover:bg-[#4A6B42]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
