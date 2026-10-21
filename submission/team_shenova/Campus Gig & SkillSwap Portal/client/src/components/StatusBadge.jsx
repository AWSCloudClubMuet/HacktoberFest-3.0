// client/src/components/StatusBadge.jsx
import React from 'react';
import { CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'sm' }) {
  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1 text-xs font-semibold' 
    : 'px-2.5 py-0.5 text-[11px] font-medium';

  switch (status) {
    case 'Open':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#DCEBE3] text-[#176B52] border border-[#176B52]/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#176B52]"></span>
          Open
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF8EE] text-[#C48D35] border border-[#E5AD52]/40 ${sizeClasses}`}>
          <PlayCircle className="w-3 h-3 text-[#C48D35]" />
          In Progress
        </span>
      );
    case 'Completed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#EAF4EE] text-[#287653] border border-[#287653]/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-[#287653]" />
          Completed
        </span>
      );
    case 'Expired':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F2F6F3] text-[#68746D] border border-[#E3E9E4] ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-[#68746D]" />
          Expired
        </span>
      );
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FDF1F1] text-[#B93838] border border-[#B93838]/20 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 text-[#B93838]" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F2F6F3] text-[#68746D] border border-[#E3E9E4] ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}
