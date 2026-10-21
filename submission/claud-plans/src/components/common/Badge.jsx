import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const TrendBadge = ({ percent }) => {
  const num = Number(percent);
  if (isNaN(num) || num === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        <Minus className="w-3 h-3" /> 0.00%
      </span>
    );
  }

  if (num > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <TrendingUp className="w-3 h-3 text-emerald-600" /> +{num.toFixed(2)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
      <TrendingDown className="w-3 h-3 text-rose-600" /> {num.toFixed(2)}%
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const getStyle = () => {
    switch (category?.toLowerCase()) {
      case 'grains':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cash crops':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vegetables':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fruits':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'spices':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStyle()}`}>
      {category || 'General'}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
      Sold Out
    </span>
  );
};
