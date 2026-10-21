import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Bell, ChevronRight, Scale } from 'lucide-react';
import { formatPKR } from '../../utils/formatters';
import { TrendBadge, CategoryBadge } from '../common/Badge';

export const PriceCard = ({ priceItem, onSetAlert }) => {
  const {
    cropName,
    category,
    marketName,
    modalPrice,
    minPrice,
    maxPrice,
    dailyChangePercent,
    unit,
    cropId
  } = priceItem;

  return (
    <div className="bg-white rounded-2xl border border-earth-300/80 p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                {cropName}
              </h3>
              <CategoryBadge category={category} />
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <MapPin className="w-3.5 h-3.5 text-earth-500 shrink-0" />
              <span className="font-medium text-slate-600 truncate">{marketName}</span>
            </div>
          </div>
          <TrendBadge percent={dailyChangePercent} />
        </div>

        {/* Modal Rate Display */}
        <div className="mt-3.5 p-3 rounded-xl bg-earth-50 border border-earth-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Today's Modal Rate
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-agri-900">
              {formatPKR(modalPrice)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {unit}</span>
          </div>

          {/* Min & Max Range */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-earth-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Mandi Low</span>
              <span className="font-semibold text-slate-700">{formatPKR(minPrice)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase">Mandi High</span>
              <span className="font-semibold text-slate-700">{formatPKR(maxPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-earth-200 text-xs">
        <Link
          to={`/analytics?cropId=${cropId}`}
          className="inline-flex items-center gap-1 font-semibold text-agri-700 hover:text-agri-900 transition-colors"
        >
          14-Day Trend <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        {onSetAlert && (
          <button
            onClick={() => onSetAlert(priceItem)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-harvest-700 bg-harvest-50 hover:bg-harvest-100 border border-harvest-200 transition-colors"
            title="Create Price Alert"
          >
            <Bell className="w-3.5 h-3.5 text-harvest-600" /> Set Alert
          </button>
        )}
      </div>
    </div>
  );
};
