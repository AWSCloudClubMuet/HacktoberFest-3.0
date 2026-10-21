// client/src/components/PaymentBadge.jsx
import React from 'react';
import { DollarSign, ArrowLeftRight, Gift } from 'lucide-react';

export default function PaymentBadge({ paymentType, budget }) {
  if (paymentType === 'Paid') {
    return (
      <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EEF5F1] text-[#176B52] border border-[#DCEBE3]">
        <DollarSign className="w-3 h-3 -mr-0.5 text-[#176B52]" />
        {budget !== undefined && budget !== null ? `$${budget}` : 'Paid'}
      </span>
    );
  }

  if (paymentType === 'SkillSwap') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FEF8EE] text-[#C48D35] border border-[#E5AD52]/30">
        <ArrowLeftRight className="w-3 h-3 text-[#C48D35]" />
        SkillSwap
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#F2F6F3] text-[#68746D] border border-[#E3E9E4]">
      <Gift className="w-3 h-3 text-[#68746D]" />
      Free
    </span>
  );
}
