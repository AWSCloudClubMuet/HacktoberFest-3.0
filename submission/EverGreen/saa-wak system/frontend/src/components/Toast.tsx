import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-[#1B7F4B] shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />,
          info: <Info className="w-4 h-4 text-[#607D52] shrink-0" />,
        };

        const borderStyles = {
          success: 'border-[#C8E6C9] bg-white text-[#30352F]',
          error: 'border-[#F8B4B4] bg-white text-[#30352F]',
          info: 'border-[#DCE8D3] bg-white text-[#30352F]',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-lg flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150 ${borderStyles[toast.type]}`}
          >
            <div className="flex items-center gap-2">
              {icons[toast.type]}
              <span className="font-medium">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#777B72] hover:text-[#30352F] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
