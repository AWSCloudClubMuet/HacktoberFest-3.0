import React, { useState } from 'react';
import { Crop, Market, PriceRecord, User } from '../types';
import { calculateDailyChange } from '../lib/calculations';
import { formatPKR } from '../lib/formatters';
import { DailyChangeBadge } from '../components/DailyChangeBadge';
import { NavTab } from '../components/AppShell';
import { Search, ArrowUpDown, GitCompare, Bell, MapPin } from 'lucide-react';

interface PricesPageProps {
  crops: Crop[];
  markets: Market[];
  allPrices: PriceRecord[];
  currentUser: User;
  onNavigate: (tab: NavTab, meta?: { cropId?: string; marketId?: string }) => void;
  onOpenAlertModal?: (cropId: string, marketId: string) => void;
}

export const PricesPage: React.FC<PricesPageProps> = ({
  crops,
  markets,
  allPrices,
  currentUser,
  onNavigate,
  onOpenAlertModal,
}) => {
  const [selectedMarketId, setSelectedMarketId] = useState<string>(markets[0]?.id || 'market-hyd');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price-desc' | 'price-asc' | 'change-desc'>('name');

  const categories = ['All', 'Grains', 'Cash Crops', 'Vegetables', 'Fruits', 'Spices'];

  // Current market info
  const currentMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  // Prepare price records with daily change for each crop at current market
  const cropPriceItems = crops.map((crop) => {
    const records = allPrices.filter(
      (p) => p.cropId === crop.id && p.marketId === selectedMarketId
    );
    const change = calculateDailyChange(records);
    const latestPrice = change ? change.latestPrice : 0;
    const absoluteChange = change ? change.absoluteChange : 0;
    const percentChange = change?.percentageChange ?? 0;

    return {
      crop,
      change,
      latestPrice,
      absoluteChange,
      percentChange,
    };
  });

  // Filter
  const filtered = cropPriceItems.filter(({ crop }) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || crop.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.crop.name.localeCompare(b.crop.name);
    if (sortBy === 'price-desc') return b.latestPrice - a.latestPrice;
    if (sortBy === 'price-asc') return a.latestPrice - b.latestPrice;
    if (sortBy === 'change-desc') return b.percentChange - a.percentChange;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Filtering Controls */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
              Daily Mandi Rates
            </h2>
            <p className="text-xs text-[#767B70] mt-0.5">
              Indicative commodity prices per 40 kg canonical maund across Sindh
            </p>
          </div>

          {/* Market Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#767B70] shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#4A6B42]" />
              Market Hub:
            </span>
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              className="bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#2D452B] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E8E7DF]">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#767B70] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop name (Wheat, Onion, Cotton...)"
              className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-[#767B70] text-xs hover:text-[#2F332C]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#767B70]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2.5 py-1.5 text-xs text-[#2F332C] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="price-desc">Price: Highest First</option>
              <option value="price-asc">Price: Lowest First</option>
              <option value="change-desc">Highest Daily Gain</option>
            </select>
          </div>
        </div>

        {/* Segmented Category Filter */}
        <div className="flex items-center gap-1 mt-4 p-1 bg-[#FAF9F5] rounded-xl border border-[#E8E7DF] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-[#2D452B] shadow-xs font-semibold'
                  : 'text-[#666B60] hover:text-[#2F332C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Crop Cards Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E8E7DF] text-center text-[#767B70]">
          <p className="text-sm font-medium">No crops match your search or filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-3 text-xs text-[#4A6B42] font-semibold underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map(({ crop, change, latestPrice }) => (
            <div
              key={crop.id}
              className="bg-white rounded-2xl p-5 border border-[#E8E7DF] hover:border-[#4A6B42] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-2xl group-hover:scale-105 transition-transform">
                    {crop.symbol}
                  </span>
                  <DailyChangeBadge change={change} compact />
                </div>

                <h3 className="font-bold text-base text-[#2F332C] group-hover:text-[#4A6B42] transition-colors">
                  {crop.name}
                </h3>
                <div className="text-xs text-[#767B70] mt-0.5">
                  {crop.category} · {currentMarket.name}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E7DF]">
                  <div className="text-2xl font-bold text-[#2D452B] tabular-nums">
                    {formatPKR(latestPrice)}
                  </div>
                  <div className="text-[11px] text-[#767B70] mt-0.5">
                    Unit: {crop.unit}
                  </div>
                </div>

                {crop.description && (
                  <p className="text-xs text-[#666B60] mt-3 line-clamp-2 leading-relaxed">
                    {crop.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 mt-4 border-t border-[#E8E7DF]">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate('insights', {
                      cropId: crop.id,
                      marketId: selectedMarketId,
                    })
                  }
                  className="w-full bg-[#EEF2E8] hover:bg-[#E3EAD9] text-[#2D452B] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <GitCompare className="w-3.5 h-3.5 text-[#4A6B42]" />
                  <span>14-Day Trend & Comparison</span>
                </button>

                {currentUser.role === 'farmer' && onOpenAlertModal && (
                  <button
                    type="button"
                    onClick={() => onOpenAlertModal(crop.id, selectedMarketId)}
                    className="w-full bg-white hover:bg-[#FAF9F5] border border-[#E8E7DF] text-[#666B60] hover:text-[#2F332C] py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3 h-3 text-[#4A6B42]" />
                    <span>Set Price Alert</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
