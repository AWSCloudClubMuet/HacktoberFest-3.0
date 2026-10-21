import React from 'react';
import { TrendingDown, TrendingUp, CheckCircle2, HelpCircle } from 'lucide-react';
import { PricePosition } from '../types';

interface MarketPositionBadgeProps {
  position: PricePosition;
  label: string;
  percentDiff?: number | null;
}

export const MarketPositionBadge: React.FC<MarketPositionBadgeProps> = ({
  position,
  label,
}) => {
  if (position === 'below') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#186F43] bg-[#EEF5EB] px-2 py-0.5 rounded-md"
        title="Asking price is >5% below current mandi market average"
      >
        <TrendingDown className="w-3 h-3 text-[#186F43]" />
        <span>{label}</span>
      </span>
    );
  }

  if (position === 'above') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A4C07] bg-[#FDF5E6] px-2 py-0.5 rounded-md"
        title="Asking price is >5% above current mandi market average"
      >
        <TrendingUp className="w-3 h-3 text-[#8A4C07]" />
        <span>{label}</span>
      </span>
    );
  }

  if (position === 'near') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D452B] bg-[#EEF2E8] px-2 py-0.5 rounded-md"
        title="Asking price is within +/- 5% of today's mandi average"
      >
        <CheckCircle2 className="w-3 h-3 text-[#4A6B42]" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] text-[#767B70] bg-[#FAF9F5] px-2 py-0.5 rounded-md"
      title="No comparable market price found for today"
    >
      <HelpCircle className="w-3 h-3 text-[#767B70]" />
      <span>Comparison unavailable</span>
    </span>
  );
};
