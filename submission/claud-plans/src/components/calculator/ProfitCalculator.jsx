import React, { useState, useMemo } from 'react';
import { formatPKR, formatPercent } from '../../utils/formatters';
import {
  Calculator,
  Sliders,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const ProfitCalculator = ({ crops = [], marketPrices = [] }) => {
  // Farm & Production Inputs
  const [selectedCropId, setSelectedCropId] = useState(crops[0]?.id || 'crp-wheat');
  const [acres, setAcres] = useState(10);
  const [yieldPerAcre, setYieldPerAcre] = useState(35); // maunds/acre for wheat

  // Cost items per acre in PKR
  const [costs, setCosts] = useState({
    landPrep: 8000,       // Tractor plowing, leveling
    seed: 6500,           // Certified seed bags
    fertilizer: 22000,    // DAP & Urea
    irrigation: 9500,     // Canal water / Tubewell fuel
    pesticide: 7000,      // Spray & weed management
    harvestLabor: 12000,  // Harvesting & threshing
    transportMandi: 6000  // Truck fare to Mandi
  });

  // Price adjustment slider (-20% to +20%)
  const [priceAdjustmentPercent, setPriceAdjustmentPercent] = useState(0);

  // Determine baseline modal price from marketPrices
  const baselinePrice = useMemo(() => {
    const priceRecords = marketPrices.filter((p) => p.cropId === selectedCropId);
    if (priceRecords.length > 0) {
      // average modal price across mandis
      const sum = priceRecords.reduce((acc, p) => acc + p.modalPrice, 0);
      return Math.round(sum / priceRecords.length);
    }
    return 4000;
  }, [selectedCropId, marketPrices]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  // Calculations
  const adjustedPricePerUnit = Math.round(baselinePrice * (1 + priceAdjustmentPercent / 100));
  const totalProductionUnits = acres * yieldPerAcre;
  
  // Total cost per acre
  const totalCostPerAcre = Object.values(costs).reduce((a, b) => Number(a) + Number(b), 0);
  const totalExpenditure = totalCostPerAcre * acres;

  // Gross Revenue & Profit
  const grossRevenue = totalProductionUnits * adjustedPricePerUnit;
  const netProfit = grossRevenue - totalExpenditure;
  const profitPerAcre = acres > 0 ? Math.round(netProfit / acres) : 0;
  const roiPercent = totalExpenditure > 0 ? ((netProfit / totalExpenditure) * 100).toFixed(1) : 0;

  const isProfitable = netProfit >= 0;

  const handleCostChange = (key, value) => {
    setCosts((prev) => ({
      ...prev,
      [key]: Math.max(0, Number(value) || 0)
    }));
  };

  return (
    <div className="bg-white rounded-3xl border border-earth-300 shadow-card p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-agri-800">
          <Calculator className="w-6 h-6 text-agri-700" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sindh Crop Profitability Simulator
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Estimate cultivation costs, simulate market rate swings with the <span className="font-semibold text-slate-700">-20% to +20%</span> slider, and project your net harvest margins.
        </p>
      </div>

      {/* Primary Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-earth-50 border border-earth-200">
        {/* Crop Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Cultivated Crop
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-earth-300 bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 shadow-sm"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.unit})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Baseline Mandi Rate: <strong className="text-slate-700">{formatPKR(baselinePrice)}</strong>
          </span>
        </div>

        {/* Acreage */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Farm Size (Acres)
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={acres}
            onChange={(e) => setAcres(Math.max(1, Number(e.target.value) || 1))}
            className="w-full px-3 py-2.5 rounded-xl border border-earth-300 bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 shadow-sm"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Total area under cultivation
          </span>
        </div>

        {/* Expected Yield */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Est. Yield / Acre ({selectedCrop?.unit || 'maunds'})
          </label>
          <input
            type="number"
            min="1"
            value={yieldPerAcre}
            onChange={(e) => setYieldPerAcre(Math.max(1, Number(e.target.value) || 1))}
            className="w-full px-3 py-2.5 rounded-xl border border-earth-300 bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-agri-500 shadow-sm"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Total Batch: <strong className="text-slate-700">{totalProductionUnits.toLocaleString()}</strong> units
          </span>
        </div>
      </div>

      {/* PRICE ADJUSTMENT SLIDER (-20% to +20%) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-earth-100 via-white to-earth-50 border-2 border-agri-600/30 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-agri-700" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Mandi Price Sensitivity Adjustment
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate price drops (-20%) or price peaks (+20%) during peak mandi arrivals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-base sm:text-lg font-black px-3 py-1 rounded-xl border ${
              priceAdjustmentPercent > 0
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : priceAdjustmentPercent < 0
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              {priceAdjustmentPercent > 0 ? `+${priceAdjustmentPercent}%` : `${priceAdjustmentPercent}%`}
            </span>
            <button
              onClick={() => setPriceAdjustmentPercent(0)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-earth-200 transition-colors"
              title="Reset to 0% adjustment"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Slider */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={priceAdjustmentPercent}
            onChange={(e) => setPriceAdjustmentPercent(Number(e.target.value))}
            className="w-full h-3 bg-earth-300 rounded-lg appearance-none cursor-pointer accent-agri-700"
          />
          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span className="text-rose-600">-20% (Market Slump)</span>
            <span className="text-slate-600">0% (Baseline Rate: {formatPKR(baselinePrice)})</span>
            <span className="text-emerald-700">+20% (High Demand)</span>
          </div>
        </div>

        {/* Dynamic Adjusted Selling Rate Callout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-earth-200/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Baseline Rate</span>
            <span className="font-bold text-slate-700">{formatPKR(baselinePrice)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Adjusted Rate</span>
            <span className="font-black text-agri-800 text-sm">{formatPKR(adjustedPricePerUnit)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Harvest</span>
            <span className="font-bold text-slate-700">{totalProductionUnits.toLocaleString()} {selectedCrop?.unit}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Revenue</span>
            <span className="font-black text-slate-900 text-sm">{formatPKR(grossRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Production Costs Breakdown (Sindh Realistic Input Costs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Cost of Production Breakdown (per Acre)
          </h4>
          <span className="text-xs font-extrabold text-slate-700">
            Total per Acre: {formatPKR(totalCostPerAcre)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Tractor & Land Prep</label>
            <input
              type="number"
              value={costs.landPrep}
              onChange={(e) => handleCostChange('landPrep', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Seed / Nursery</label>
            <input
              type="number"
              value={costs.seed}
              onChange={(e) => handleCostChange('seed', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Fertilizer (DAP + Urea)</label>
            <input
              type="number"
              value={costs.fertilizer}
              onChange={(e) => handleCostChange('fertilizer', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Irrigation / Tubewell</label>
            <input
              type="number"
              value={costs.irrigation}
              onChange={(e) => handleCostChange('irrigation', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Pesticides & Sprays</label>
            <input
              type="number"
              value={costs.pesticide}
              onChange={(e) => handleCostChange('pesticide', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Harvesting Labor</label>
            <input
              type="number"
              value={costs.harvestLabor}
              onChange={(e) => handleCostChange('harvestLabor', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
            <label className="text-[11px] text-slate-500 font-medium block">Mandi Transport / Arhat</label>
            <input
              type="number"
              value={costs.transportMandi}
              onChange={(e) => handleCostChange('transportMandi', e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-earth-300 font-bold text-slate-800 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-earth-200 border border-earth-300 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Overall Crop Cost</span>
            <span className="font-extrabold text-slate-900 text-sm">{formatPKR(totalExpenditure)}</span>
          </div>
        </div>
      </div>

      {/* FINAL PROFIT & LOSS RESULT BOARD */}
      <div className={`p-6 rounded-3xl border-2 transition-all ${
        isProfitable
          ? 'bg-gradient-to-br from-emerald-50 via-agri-50 to-white border-emerald-500/40'
          : 'bg-gradient-to-br from-rose-50 via-rose-100/40 to-white border-rose-500/40'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Profit */}
          <div className="p-4 rounded-2xl bg-white/90 border border-earth-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Net Projected Profit
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {isProfitable ? (
                <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <span className={`text-2xl font-black ${isProfitable ? 'text-emerald-800' : 'text-rose-700'}`}>
                {formatPKR(netProfit)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Across {acres} acres of {selectedCrop?.name}
            </span>
          </div>

          {/* Profit Per Acre */}
          <div className="p-4 rounded-2xl bg-white/90 border border-earth-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Margin per Acre
            </span>
            <div className="mt-1">
              <span className={`text-2xl font-black ${isProfitable ? 'text-emerald-800' : 'text-rose-700'}`}>
                {formatPKR(profitPerAcre)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              After deducting all input costs
            </span>
          </div>

          {/* Return on Investment */}
          <div className="p-4 rounded-2xl bg-white/90 border border-earth-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Farmer ROI (%)
            </span>
            <div className="mt-1">
              <span className={`text-2xl font-black ${isProfitable ? 'text-emerald-800' : 'text-rose-700'}`}>
                {roiPercent}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Return on total capital outlay
            </span>
          </div>

          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-white/90 border border-earth-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Sales Turnover
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">
                {formatPKR(grossRevenue)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              At {formatPKR(adjustedPricePerUnit)} / {selectedCrop?.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
