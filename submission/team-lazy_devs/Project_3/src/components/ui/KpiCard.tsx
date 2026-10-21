import React from 'react';
import { Skeleton } from './Skeleton.tsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: 'gold' | 'charcoal' | 'teal' | 'emerald' | 'amber' | 'rose' | 'slate';
  badgeText?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'gold',
  badgeText,
  onClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E1D9] p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3.5 w-36" />
      </div>
    );
  }

  const iconBg = {
    gold: 'bg-[#D6A85F]/15 text-[#a87a2a] border-[#D6A85F]/30',
    charcoal: 'bg-[#202B3C]/10 text-[#202B3C] border-[#202B3C]/20',
    teal: 'bg-[#D6A85F]/15 text-[#a87a2a] border-[#D6A85F]/30',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    slate: 'bg-[#F0ECE3] text-[#263242] border-[#E5E1D9]',
  }[accentColor];

  const topStripe = {
    gold: 'border-t-2 border-t-[#D6A85F]',
    charcoal: 'border-t-2 border-t-[#202B3C]',
    teal: 'border-t-2 border-t-[#D6A85F]',
    emerald: 'border-t-2 border-t-emerald-600',
    amber: 'border-t-2 border-t-amber-500',
    rose: 'border-t-2 border-t-rose-500',
    slate: 'border-t-2 border-t-[#697586]',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white rounded-xl border border-[#E5E1D9] ${topStripe} p-5 shadow-xs transition-all duration-200 hover:border-[#D6A85F]/60 hover:shadow-sm ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-[#697586] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg border ${iconBg} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#263242] font-mono tabular-nums">
          {value}
        </span>
        {badgeText && (
          <span className="text-[11px] font-medium text-[#697586]">
            · {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-[#697586] leading-relaxed truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
