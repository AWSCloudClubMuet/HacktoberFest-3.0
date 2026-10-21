import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { DailyChange } from '../types';
import { formatSignedPKR, formatPercentage } from '../lib/formatters';

interface DailyChangeBadgeProps {
  change: DailyChange | null;
  compact?: boolean;
}

export const DailyChangeBadge: React.FC<DailyChangeBadgeProps> = ({ change, compact = false }) => {
  if (!change) {
    return (
      <span className="text-[11px] text-[#767B70] tracking-tight">
        No change data
      </span>
    );
  }

  if (change.direction === 'up') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold text-[#186F43] tabular-nums ${
          compact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title={`Increased by ${formatSignedPKR(change.absoluteChange)} (${formatPercentage(change.percentageChange)})`}
      >
        <ArrowUpRight className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{formatSignedPKR(change.absoluteChange)}</span>
        {change.percentageChange !== null && (
          <span className="text-[10px] font-normal opacity-85">({formatPercentage(change.percentageChange)})</span>
        )}
      </span>
    );
  }

  if (change.direction === 'down') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold text-[#B3261E] tabular-nums ${
          compact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
        title={`Decreased by ${formatSignedPKR(change.absoluteChange)} (${formatPercentage(change.percentageChange)})`}
      >
        <ArrowDownRight className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{formatSignedPKR(change.absoluteChange)}</span>
        {change.percentageChange !== null && (
          <span className="text-[10px] font-normal opacity-85">({formatPercentage(change.percentageChange)})</span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium text-[#767B70] tabular-nums ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
    >
      <Minus className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>0.0%</span>
    </span>
  );
};
