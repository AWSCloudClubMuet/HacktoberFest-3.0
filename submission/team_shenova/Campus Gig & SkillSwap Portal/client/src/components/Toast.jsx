// client/src/components/Toast.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'info' } = toast;

  let bgClasses = 'bg-[#202923] text-white border border-[#202923]';
  let Icon = Info;

  if (type === 'success') {
    bgClasses = 'bg-[#176B52] text-white border border-[#10513F] shadow-sm';
    Icon = CheckCircle2;
  } else if (type === 'error') {
    bgClasses = 'bg-[#B93838] text-white border border-[#962B2B] shadow-sm';
    Icon = AlertCircle;
  } else if (type === 'info') {
    bgClasses = 'bg-[#202923] text-white border border-[#3E4C43] shadow-sm';
    Icon = Info;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-4 duration-180">
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-medium max-w-md shadow-card ${bgClasses}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
