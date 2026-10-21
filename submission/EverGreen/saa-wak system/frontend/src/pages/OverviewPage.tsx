import React from 'react';
import { Crop, Market, PriceRecord, Listing, Alert, User } from '../types';
import { calculateDailyChange } from '../lib/calculations';
import { formatPKR, formatDate } from '../lib/formatters';
import { DailyChangeBadge } from '../components/DailyChangeBadge';
import { NavTab } from '../components/AppShell';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Store,
  Calculator,
  Bell,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface OverviewPageProps {
  crops: Crop[];
  markets: Market[];
  allPrices: PriceRecord[];
  listings: Listing[];
  alerts: Alert[];
  currentUser: User;
  onNavigate: (tab: NavTab, meta?: { cropId?: string; marketId?: string }) => void;
  onOpenListingModal?: () => void;
  onOpenAlertModal?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  crops,
  markets,
  allPrices,
  listings,
  alerts,
  currentUser,
  onNavigate,
  onOpenListingModal,
  onOpenAlertModal,
}) => {
  const isFarmer = currentUser.role === 'farmer';

  // Primary market for overview: Hyderabad Mandi (baseline)
  const defaultMarket = markets[0] || { id: 'market-hyd', name: 'Hyderabad Mandi', district: 'Hyderabad' };

  // Calculate daily changes for all crops at default market
  const cropMovements = crops.map((crop) => {
    const records = allPrices.filter(
      (p) => p.cropId === crop.id && p.marketId === defaultMarket.id
    );
    const change = calculateDailyChange(records);
    return {
      crop,
      change,
      latestPrice: change ? change.latestPrice : 0,
      percent: change?.percentageChange ?? 0,
    };
  });

  // Identify top gainer & top decliner
  const sortedByPercent = [...cropMovements].sort((a, b) => b.percent - a.percent);
  const topGainer = sortedByPercent[0];
  const topDecliner = sortedByPercent[sortedByPercent.length - 1];

  // Latest date in price records
  const latestDate = allPrices.map((p) => p.date).sort().reverse()[0] || '2026-10-21';

  // Available listings count
  const availableListings = listings.filter((l) => l.status === 'available');

  // Triggered alerts for current user
  const userAlerts = alerts.filter((a) => a.userId === currentUser.id && a.isEnabled);
  const triggeredAlerts = userAlerts.filter((a) => {
    if (!a.lastEvaluatedPrice) return false;
    return (
      (a.condition === 'above' && a.lastEvaluatedPrice >= a.targetPrice) ||
      (a.condition === 'below' && a.lastEvaluatedPrice <= a.targetPrice)
    );
  });

  return (
    <div className="space-y-8">
      {/* Editorial Welcome Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E7DF]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#767B70] mb-2 font-medium">
              <span>Sindh Mandi Intelligence</span>
              <span className="text-[#C5C4BA]" aria-hidden="true">·</span>
              <span>{defaultMarket.name}</span>
              <span className="text-[#C5C4BA]" aria-hidden="true">·</span>
              <span className="tabular-nums">{formatDate(latestDate)}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D452B]">
              Bhallay Kare Aaya, {currentUser.displayName}
            </h2>
            <p className="text-xs sm:text-sm text-[#666B60] mt-2 leading-relaxed">
              Indicative price intelligence, multi-mandi spreads, and produce discovery for agricultural communities across Sindh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isFarmer ? (
              <>
                {onOpenListingModal && (
                  <button
                    type="button"
                    onClick={onOpenListingModal}
                    className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>List Produce</span>
                  </button>
                )}
                {onOpenAlertModal && (
                  <button
                    type="button"
                    onClick={onOpenAlertModal}
                    className="bg-[#EEF2E8] hover:bg-[#E3EAD9] text-[#2D452B] border border-[#DCE8D3] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-[#4A6B42]" />
                    <span>Set Alert</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Explore Produce ({availableListings.length} Active)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Triggered Alerts Banner (Quiet & Editorial) */}
      {isFarmer && triggeredAlerts.length > 0 && (
        <div className="bg-[#FAF7EE] border border-[#EFE5C6] rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#8A4C07] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#6D3800]">
                {triggeredAlerts.length} Price Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered
              </span>
              <span className="text-xs text-[#8A4C07] ml-2 hidden sm:inline">
                Current mandi prices have crossed your set target thresholds.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="text-xs font-semibold text-[#8A4C07] hover:underline cursor-pointer shrink-0"
          >
            Review Alerts →
          </button>
        </div>
      )}

      {/* High-Density Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E7DF]">
          <div className="text-[11px] font-medium text-[#767B70] uppercase tracking-wider">Crops Tracked</div>
          <div className="text-2xl font-bold text-[#2D452B] mt-1 tabular-nums">
            {crops.length} Staples
          </div>
          <div className="text-[11px] text-[#767B70] mt-1">
            Grains, Cash Crops, Veg & Fruits
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E7DF]">
          <div className="text-[11px] font-medium text-[#767B70] uppercase tracking-wider">Baseline Mandi</div>
          <div className="text-2xl font-bold text-[#2F332C] mt-1 truncate">
            Hyderabad
          </div>
          <div className="text-[11px] text-[#767B70] mt-1">
            Standard 40 kg canonical unit
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E7DF]">
          <div className="text-[11px] font-medium text-[#767B70] uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#186F43]" />
            Top Daily Gainer
          </div>
          <div className="text-xl font-bold text-[#186F43] mt-1 truncate tabular-nums">
            {topGainer?.crop.name.split(' ')[0] || 'Wheat'}
          </div>
          <div className="text-[11px] text-[#767B70] mt-1 tabular-nums">
            +{topGainer?.percent.toFixed(1)}% · {formatPKR(topGainer?.latestPrice || 0)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E7DF]">
          <div className="text-[11px] font-medium text-[#767B70] uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-[#B3261E]" />
            Top Daily Decliner
          </div>
          <div className="text-xl font-bold text-[#B3261E] mt-1 truncate tabular-nums">
            {topDecliner?.crop.name.split(' ')[0] || 'Onion'}
          </div>
          <div className="text-[11px] text-[#767B70] mt-1 tabular-nums">
            {topDecliner?.percent.toFixed(1)}% · {formatPKR(topDecliner?.latestPrice || 0)}
          </div>
        </div>
      </div>

      {/* Today's Mandi Quotations Grid */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-lg text-[#2D452B]">
              Today's Quotations — Hyderabad Mandi
            </h3>
            <p className="text-xs text-[#767B70] mt-0.5">
              Standardized unit: PKR per 40 kg (canonical mandi maund)
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('prices')}
            className="text-xs font-semibold text-[#4A6B42] hover:text-[#2D452B] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Browse All 8 Crops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cropMovements.slice(0, 8).map(({ crop, change, latestPrice }) => (
            <div
              key={crop.id}
              onClick={() => onNavigate('insights', { cropId: crop.id, marketId: defaultMarket.id })}
              className="p-5 rounded-xl border border-[#E8E7DF] bg-white hover:border-[#4A6B42] hover:bg-[#FAF9F5] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-2xl group-hover:scale-105 transition-transform">
                    {crop.symbol}
                  </span>
                  <DailyChangeBadge change={change} compact />
                </div>

                <div className="font-semibold text-sm text-[#2F332C] group-hover:text-[#4A6B42] transition-colors">
                  {crop.name}
                </div>
                <div className="text-[11px] text-[#767B70] mt-0.5">
                  {crop.category} · 40 kg
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E8E7DF] flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-bold text-[#2D452B] tabular-nums">
                    {formatPKR(latestPrice)}
                  </div>
                </div>

                <span className="text-[11px] text-[#4A6B42] font-semibold flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                  Trend <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Access Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('insights')}
          className="bg-white p-6 rounded-2xl border border-[#E8E7DF] hover:border-[#4A6B42] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <h4 className="font-bold text-sm text-[#2D452B] group-hover:text-[#4A6B42] transition-colors">
              14-Day Price Charts
            </h4>
          </div>
          <p className="text-xs text-[#767B70] leading-relaxed mb-4">
            Chronological daily charts and multi-mandi spread analysis across Hyderabad, Sukkur, and Mirpur Khas.
          </p>
          <span className="text-xs font-semibold text-[#4A6B42] flex items-center gap-1">
            Compare Markets →
          </span>
        </div>

        <div
          onClick={() => onNavigate('marketplace')}
          className="bg-white p-6 rounded-2xl border border-[#E8E7DF] hover:border-[#4A6B42] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏪</span>
            <h4 className="font-bold text-sm text-[#2D452B] group-hover:text-[#4A6B42] transition-colors">
              Produce Marketplace
            </h4>
          </div>
          <p className="text-xs text-[#767B70] leading-relaxed mb-4">
            Direct farmer offers with market-position badges indicating fair market valuations.
          </p>
          <span className="text-xs font-semibold text-[#4A6B42] flex items-center gap-1">
            Browse {availableListings.length} Listings →
          </span>
        </div>

        <div
          onClick={() => onNavigate('calculator')}
          className="bg-white p-6 rounded-2xl border border-[#E8E7DF] hover:border-[#4A6B42] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧮</span>
            <h4 className="font-bold text-sm text-[#2D452B] group-hover:text-[#4A6B42] transition-colors">
              Profit Estimator
            </h4>
          </div>
          <p className="text-xs text-[#767B70] leading-relaxed mb-4">
            Calculate gross harvest revenue, total production expenses, and simulate ±20% price fluctuations.
          </p>
          <span className="text-xs font-semibold text-[#4A6B42] flex items-center gap-1">
            Calculate Returns →
          </span>
        </div>
      </div>
    </div>
  );
};
