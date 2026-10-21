import React from 'react';
import { Market, PriceRecord } from '../types';
import { calculateDailyChange } from '../lib/calculations';
import { formatPKR } from '../lib/formatters';
import { DailyChangeBadge } from './DailyChangeBadge';
import { Award, AlertCircle, MapPin } from 'lucide-react';

interface MarketComparisonTableProps {
  cropName: string;
  cropUnit: string;
  markets: Market[];
  allPrices: PriceRecord[];
  cropId: string;
  onSelectMarket?: (marketId: string) => void;
  selectedMarketId?: string;
}

export const MarketComparisonTable: React.FC<MarketComparisonTableProps> = ({
  cropName,
  cropUnit,
  markets,
  allPrices,
  cropId,
  onSelectMarket,
  selectedMarketId,
}) => {
  // Compute price data for each market
  const marketData = markets.map((market) => {
    const marketCropPrices = allPrices.filter(
      (p) => p.cropId === cropId && p.marketId === market.id
    );
    const dailyChange = calculateDailyChange(marketCropPrices);
    const latestPrice = dailyChange ? dailyChange.latestPrice : 0;

    return {
      market,
      dailyChange,
      latestPrice,
    };
  });

  // Filter only markets with valid price records
  const validMarkets = marketData.filter((m) => m.latestPrice > 0);

  if (validMarkets.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#E8E7DF] text-center text-[#767B70]">
        <p className="text-sm">No market price records available for comparison.</p>
      </div>
    );
  }

  // Find highest and lowest price
  const allLatestPrices = validMarkets.map((m) => m.latestPrice);
  const highestPrice = Math.max(...allLatestPrices);
  const lowestPrice = Math.min(...allLatestPrices);
  const priceSpread = highestPrice - lowestPrice;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5">
        <div>
          <h3 className="font-bold text-lg text-[#2D452B]">
            Inter-Market Comparison
          </h3>
          <p className="text-xs text-[#767B70] mt-0.5">
            Same crop ({cropName}) and standard unit ({cropUnit}) across Sindh mandis
          </p>
        </div>
        <div className="text-xs text-[#767B70]">
          Mandi Spread: <strong className="text-[#2D452B] tabular-nums">{formatPKR(priceSpread)}</strong>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 sm:mx-0">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-[#E8E7DF] text-[#767B70] font-semibold bg-[#FAF9F5]/70">
              <th className="py-2.5 px-4">Market / District</th>
              <th className="py-2.5 px-4 text-right">Latest Sample Price</th>
              <th className="py-2.5 px-4 text-center">Daily Movement</th>
              <th className="py-2.5 px-4 text-right">Spread vs Base</th>
              <th className="py-2.5 px-4 text-center">Indicative Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E7DF]">
            {validMarkets.map(({ market, dailyChange, latestPrice }) => {
              const isHighest = latestPrice === highestPrice && validMarkets.length > 1;
              const isLowest = latestPrice === lowestPrice && validMarkets.length > 1;
              const diffFromLowest = latestPrice - lowestPrice;
              const isSelected = selectedMarketId === market.id;

              return (
                <tr
                  key={market.id}
                  onClick={() => onSelectMarket && onSelectMarket(market.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF2E8]/60 font-medium'
                      : 'hover:bg-[#FAF9F5]'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#4A6B42] shrink-0" />
                      <div>
                        <div className="font-semibold text-[#2F332C]">{market.name}</div>
                        <div className="text-[11px] text-[#767B70]">{market.district}, {market.province}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-sm text-[#2D452B] tabular-nums">
                    {formatPKR(latestPrice)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <DailyChangeBadge change={dailyChange} compact />
                  </td>

                  <td className="py-3 px-4 text-right text-xs tabular-nums">
                    {diffFromLowest > 0 ? (
                      <span className="font-semibold text-[#186F43]">
                        +{formatPKR(diffFromLowest)}
                      </span>
                    ) : (
                      <span className="text-[#767B70]">Lowest baseline</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isHighest ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#186F43] bg-[#EEF5EB] px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3 text-[#186F43]" />
                        Highest Mandi Price
                      </span>
                    ) : isLowest ? (
                      <span className="text-[11px] text-[#767B70] bg-[#FAF9F5] px-2 py-0.5 rounded-md">
                        Baseline Market
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#767B70]">Mid range</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3.5 bg-[#FAF9F5] rounded-xl border border-[#E8E7DF] flex items-start gap-2.5 text-xs text-[#666B60]">
        <AlertCircle className="w-4 h-4 text-[#8A4C07] shrink-0 mt-0.5" />
        <span>
          <strong>Freight & Commission Note:</strong> The highest mandi quotation does not necessarily mean higher net returns. Transport freight (tractor trolley or truck hire), bag offloading labor, and local market commission (arhat) must be evaluated before dispatching produce.
        </span>
      </div>
    </div>
  );
};
