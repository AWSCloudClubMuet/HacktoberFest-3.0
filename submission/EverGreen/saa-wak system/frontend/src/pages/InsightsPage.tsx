import React, { useState, useEffect } from 'react';
import { Crop, Market, PriceRecord, User } from '../types';
import { PriceChart } from '../components/PriceChart';
import { MarketComparisonTable } from '../components/MarketComparisonTable';
import { Bell } from 'lucide-react';

interface InsightsPageProps {
  crops: Crop[];
  markets: Market[];
  allPrices: PriceRecord[];
  currentUser: User;
  initialCropId?: string;
  initialMarketId?: string;
  onOpenAlertModal?: (cropId: string, marketId: string) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  crops,
  markets,
  allPrices,
  currentUser,
  initialCropId,
  initialMarketId,
  onOpenAlertModal,
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>(
    initialCropId || crops[0]?.id || 'crop-wheat'
  );
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    initialMarketId || markets[0]?.id || 'market-hyd'
  );

  useEffect(() => {
    if (initialCropId) setSelectedCropId(initialCropId);
    if (initialMarketId) setSelectedMarketId(initialMarketId);
  }, [initialCropId, initialMarketId]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];
  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  // Price history for chart (14 ordered days)
  const chartRecords = allPrices.filter(
    (p) => p.cropId === selectedCropId && p.marketId === selectedMarketId
  );

  return (
    <div className="space-y-6">
      {/* Selector Controls Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{selectedCrop?.symbol || '🌾'}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
                {selectedCrop?.name || 'Crop Insights'}
              </h2>
            </div>
            <p className="text-xs text-[#767B70]">
              14-day chronological price trend and multi-market comparison across Sindh
            </p>
          </div>

          {/* Crop & Market Pickers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                Crop
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#2D452B] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                Chart Mandi
              </label>
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

            {currentUser.role === 'farmer' && onOpenAlertModal && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={() => onOpenAlertModal(selectedCropId, selectedMarketId)}
                  className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Set Price Alert</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 14-Day Price Chart */}
      <PriceChart
        records={chartRecords}
        cropName={selectedCrop?.name || 'Crop'}
        marketName={selectedMarket?.name || 'Market'}
        unit={selectedCrop?.unit || 'PKR per 40 kg'}
      />

      {/* Inter-Market Comparison Table */}
      <MarketComparisonTable
        cropName={selectedCrop?.name || 'Crop'}
        cropUnit={selectedCrop?.unit || 'PKR per 40 kg'}
        markets={markets}
        allPrices={allPrices}
        cropId={selectedCropId}
        selectedMarketId={selectedMarketId}
        onSelectMarket={(mId) => setSelectedMarketId(mId)}
      />
    </div>
  );
};
