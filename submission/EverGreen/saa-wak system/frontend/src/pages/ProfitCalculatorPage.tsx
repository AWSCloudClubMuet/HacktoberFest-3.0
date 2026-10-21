import React, { useState } from 'react';
import { Crop, PriceRecord } from '../types';
import { calculateProfit } from '../lib/calculations';
import { formatPKR, formatPercentage, formatSignedPKR } from '../lib/formatters';
import { Calculator, Sliders, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ProfitCalculatorPageProps {
  crops: Crop[];
  allPrices: PriceRecord[];
}

export const ProfitCalculatorPage: React.FC<ProfitCalculatorPageProps> = ({
  crops,
  allPrices,
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>(crops[0]?.id || 'crop-wheat');
  const [quantity, setQuantity] = useState<number | ''>(200);
  const [baselineSellingPrice, setBaselineSellingPrice] = useState<number | ''>(4200);
  const [costPerUnit, setCostPerUnit] = useState<number | ''>(2800);
  const [adjustmentPercent, setAdjustmentPercent] = useState<number>(0);

  // When crop changes, update baseline price to latest sample price for Hyderabad
  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    const recs = allPrices
      .filter((p) => p.cropId === cropId && p.marketId === 'market-hyd')
      .sort((a, b) => b.date.localeCompare(a.date));
    if (recs.length > 0) {
      setBaselineSellingPrice(recs[0].price);
      // Realistic estimated production cost around 65% of selling price
      setCostPerUnit(Math.round(recs[0].price * 0.65));
    }
  };

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  const calculation = calculateProfit({
    cropId: selectedCropId,
    quantity: Number(quantity) || 0,
    baselineSellingPrice: Number(baselineSellingPrice) || 0,
    costPerUnit: Number(costPerUnit) || 0,
    adjustmentPercent,
  });

  // Sensitivity scenarios (-20%, -10%, 0%, +10%, +20%)
  const scenarios = [-20, -10, 0, 10, 20].map((pct) => {
    const calc = calculateProfit({
      quantity: Number(quantity) || 0,
      baselineSellingPrice: Number(baselineSellingPrice) || 0,
      costPerUnit: Number(costPerUnit) || 0,
      adjustmentPercent: pct,
    });
    return {
      pct,
      price: calc.adjustedPrice,
      revenue: calc.adjustedRevenue,
      profit: calc.adjustedProfit,
      margin: calc.marginPercent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
            Harvest Profit & Scenario Estimator
          </h2>
        </div>
        <p className="text-xs text-[#767B70] mt-0.5">
          Estimate harvest revenue, entered input costs, net margins, and simulate ±20% mandi price variations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#E8E7DF] space-y-4 text-xs">
            <h3 className="font-bold text-xs text-[#2D452B] uppercase tracking-wider mb-2">
              Parameters & Input Costs
            </h3>

            {/* Crop Select */}
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Crop Reference
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => handleCropChange(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D452B] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Harvest Volume (40 kg maunds) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#4A6B42]"
              />
              <span className="text-[11px] text-[#767B70] mt-1 block">
                Total weight: {(Number(quantity) || 0) * 40} kg (~{(((Number(quantity) || 0) * 40) / 1000).toFixed(1)} metric tons)
              </span>
            </div>

            {/* Baseline Expected Selling Price */}
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Baseline Selling Price (PKR per 40 kg) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#767B70] font-semibold text-xs">PKR</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={baselineSellingPrice}
                  onChange={(e) => setBaselineSellingPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-11 pr-3 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#4A6B42]"
                />
              </div>
            </div>

            {/* Cost Per Unit */}
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Estimated Production Cost (PKR per 40 kg) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#767B70] font-semibold text-xs">PKR</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-11 pr-3 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#4A6B42]"
                />
              </div>
              <span className="text-[11px] text-[#767B70] mt-1 block">
                Includes seed, canal/tube-well water, fertilizer, diesel, and harvesting labor.
              </span>
            </div>

            {/* Interactive Scenario Slider (-20% to +20%) */}
            <div className="pt-4 border-t border-[#E8E7DF]">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-[#2D452B] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#4A6B42]" />
                  <span>Price Scenario Range</span>
                </label>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                    adjustmentPercent > 0
                      ? 'bg-[#EEF5EB] text-[#186F43]'
                      : adjustmentPercent < 0
                      ? 'bg-[#FDE8E8] text-[#B3261E]'
                      : 'bg-[#FAF9F5] text-[#2F332C]'
                  }`}
                >
                  {adjustmentPercent > 0 ? `+${adjustmentPercent}%` : `${adjustmentPercent}%`}
                </span>
              </div>

              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={adjustmentPercent}
                onChange={(e) => setAdjustmentPercent(Number(e.target.value))}
                className="w-full accent-[#4A6B42] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-[#767B70] mt-1 font-medium">
                <span>-20% (Bearish)</span>
                <button
                  type="button"
                  onClick={() => setAdjustmentPercent(0)}
                  className="text-[#4A6B42] hover:underline cursor-pointer"
                >
                  Reset (0%)
                </button>
                <span>+20% (Bullish)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Profit Outcome Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#767B70]">
                Net Outcome Projection
              </span>
              <span className="text-xs text-[#4A6B42] font-semibold bg-[#EEF2E8] px-2.5 py-1 rounded-md">
                {adjustmentPercent === 0
                  ? 'Baseline Selling Rate'
                  : `Simulated at ${formatPercentage(adjustmentPercent)}`}
              </span>
            </div>

            {/* Big Net Profit Display */}
            <div
              className={`p-6 rounded-2xl border mb-5 ${
                calculation.adjustedProfit >= 0
                  ? 'bg-[#FAFDF9] border-[#D4ECD0]'
                  : 'bg-[#FEFAF9] border-[#F8D2D0]'
              }`}
            >
              <div className="text-xs text-[#767B70] mb-1">
                Estimated Net Outcome ({calculation.adjustedProfit >= 0 ? 'Profit' : 'Loss'})
              </div>
              <div
                className={`text-3xl sm:text-4xl font-extrabold tabular-nums ${
                  calculation.adjustedProfit >= 0 ? 'text-[#186F43]' : 'text-[#B3261E]'
                }`}
              >
                {formatPKR(calculation.adjustedProfit)}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className="font-semibold text-[#2F332C]">
                  Profit Margin:{' '}
                  {calculation.marginPercent !== null
                    ? `${calculation.marginPercent.toFixed(1)}%`
                    : 'Not available'}
                </span>

                {adjustmentPercent !== 0 && (
                  <span
                    className={`font-semibold flex items-center gap-0.5 tabular-nums ${
                      calculation.differenceOutcome >= 0 ? 'text-[#186F43]' : 'text-[#B3261E]'
                    }`}
                  >
                    {calculation.differenceOutcome >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {formatSignedPKR(calculation.differenceOutcome)} vs Baseline
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
                <div className="text-[#767B70] mb-0.5">Selling Price</div>
                <div className="font-bold text-sm text-[#2D452B] tabular-nums">
                  {formatPKR(calculation.adjustedPrice)}
                </div>
                <div className="text-[10px] text-[#767B70]">per 40 kg</div>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
                <div className="text-[#767B70] mb-0.5">Estimated Revenue</div>
                <div className="font-bold text-sm text-[#2F332C] tabular-nums">
                  {formatPKR(calculation.adjustedRevenue)}
                </div>
                <div className="text-[10px] text-[#767B70]">{quantity || 0} maunds</div>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
                <div className="text-[#767B70] mb-0.5">Total Entered Cost</div>
                <div className="font-bold text-sm text-[#767B70] tabular-nums">
                  {formatPKR(calculation.totalCost)}
                </div>
                <div className="text-[10px] text-[#767B70]">@ {formatPKR(Number(costPerUnit) || 0)}/unit</div>
              </div>
            </div>

            {/* Sensitivity Table */}
            <div>
              <h4 className="font-bold text-xs text-[#2D452B] mb-2">
                Scenario Sensitivity Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E7DF] text-[#767B70] font-semibold bg-[#FAF9F5]/70">
                      <th className="py-2 px-3">Price Scenario</th>
                      <th className="py-2 px-3 text-right">Selling Rate</th>
                      <th className="py-2 px-3 text-right">Gross Revenue</th>
                      <th className="py-2 px-3 text-right">Net Return</th>
                      <th className="py-2 px-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E7DF]">
                    {scenarios.map((sc) => {
                      const isCurrent = sc.pct === adjustmentPercent;
                      return (
                        <tr
                          key={sc.pct}
                          className={isCurrent ? 'bg-[#EEF2E8]/60 font-semibold' : 'hover:bg-[#FAF9F5]'}
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                                sc.pct > 0
                                  ? 'text-[#186F43]'
                                  : sc.pct < 0
                                  ? 'text-[#B3261E]'
                                  : 'text-[#2F332C]'
                              }`}
                            >
                              {sc.pct === 0 ? 'Baseline (0%)' : `${sc.pct > 0 ? '+' : ''}${sc.pct}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                            {formatPKR(sc.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {formatPKR(sc.revenue)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                              sc.profit >= 0 ? 'text-[#186F43]' : 'text-[#B3261E]'
                            }`}
                          >
                            {formatPKR(sc.profit)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#767B70] tabular-nums">
                            {sc.margin !== null ? `${sc.margin.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Excluded Costs Disclaimer per PRD FR-06 */}
          <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E8E7DF] flex items-start gap-2.5 text-xs text-[#666B60]">
            <AlertCircle className="w-4 h-4 text-[#8A4C07] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#2F332C]">Cost Exclusions:</strong> Estimates are derived from your entered baseline numbers. Transport trolley hire, loading labor, mandi commission (arhat), and storage charges are excluded until entered.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
