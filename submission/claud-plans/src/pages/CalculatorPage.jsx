import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCrops, getMarkets, getPrices } from '../api.js';
import { profitCalc } from '../logic.js';
import {
  Calculator,
  ArrowLeft,
  Sliders,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const CalculatorPage = () => {
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form selections
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState('');

  // Primary inputs: quantity in 40 kg units, cost of production per unit
  const [quantity, setQuantity] = useState(100);
  const [costPerUnit, setCostPerUnit] = useState(3000);

  // What-if slider from -20% to +20% (step 5)
  const [slider, setSlider] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [c, m, p] = await Promise.all([getCrops(), getMarkets(), getPrices()]);
        setCrops(c || []);
        setMarkets(m || []);
        setPrices(p || []);

        if (c && c.length > 0) setSelectedCropId(c[0].id);
        if (m && m.length > 0) setSelectedMarketId(m[0].id);
      } catch (err) {
        console.error('Failed to load calculator dependencies:', err);
        setError(err.message || 'Failed to load rates');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Determine latest date in prices ("Today")
  const latestDate = useMemo(() => {
    return prices.reduce((max, p) => (p.date > max ? p.date : max), prices[0]?.date || '');
  }, [prices]);

  // Determine selling price = latest price for that pair (PKR per 40 kg)
  const baseSellingPrice = useMemo(() => {
    if (!selectedCropId || !selectedMarketId || !latestDate) return 4000;
    const match = prices.find(
      (p) =>
        p.crop_id === selectedCropId &&
        p.market_id === selectedMarketId &&
        p.date === latestDate
    );
    return match ? Number(match.price) : 4000;
  }, [prices, selectedCropId, selectedMarketId, latestDate]);

  // Calculate profit and margin using src/logic.js profitCalc()
  const calcResult = useMemo(() => {
    return profitCalc(quantity, costPerUnit, baseSellingPrice, slider);
  }, [quantity, costPerUnit, baseSellingPrice, slider]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="calculator-back-btn"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rates
        </button>
        <span className="text-[10px] uppercase font-bold text-slate-400">
          Profit Simulator
        </span>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-earth-300 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              Crop Profit Calculator
            </h1>
            <p className="text-[11px] text-slate-500">
              Calculate projected revenue, cost, and simulate what-if price shifts
            </p>
          </div>
        </div>
      </div>

      {/* Dual Column Layout for Laptop screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Selectors, Inputs & Slider */}
        <div className="lg:col-span-6 space-y-4">
          {/* Selectors: Crop & Market */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Crop Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Crop
                </label>
                <select
                  id="calc-crop-select"
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Market
                </label>
                <select
                  id="calc-market-select"
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Latest Mandi Selling Price Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-semibold">Latest Mandi Rate:</span>
              <span className="font-black text-emerald-900 text-sm">
                Rs. {baseSellingPrice.toLocaleString()} <span className="text-[10px] font-normal text-emerald-700">/ 40 kg</span>
              </span>
            </div>
          </div>

          {/* Inputs: Quantity & Cost of production per unit */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Production Inputs
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Quantity (in 40 kg units) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quantity (40 kg units)
                </label>
                <input
                  type="number"
                  id="calc-quantity-input"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Cost of production per unit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cost per Unit (PKR)
                </label>
                <input
                  type="number"
                  id="calc-cost-input"
                  min="0"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* What-if Slider (-20% to +20%, step 5) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  What-If Price Shift Slider
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span
                  id="slider-shift-label"
                  className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                    slider > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : slider < 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {slider > 0 ? `+${slider}%` : `${slider}%`}
                </span>
                {slider !== 0 && (
                  <button
                    type="button"
                    onClick={() => setSlider(0)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Reset slider to 0%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* The Range Slider */}
            <div className="pt-1">
              <input
                type="range"
                id="what-if-slider"
                min="-20"
                max="20"
                step="5"
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span className="text-rose-600">-20%</span>
                <span>-10%</span>
                <span>0%</span>
                <span>+10%</span>
                <span className="text-emerald-700">+20%</span>
              </div>
            </div>

            {/* Show Adjusted Price live */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">Adjusted Selling Price:</span>
              <span id="adjusted-price-value" className="font-black text-slate-900 text-sm">
                Rs. {calcResult.adjustedPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ 40 kg</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Output Results Board */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div
            id="profit-result-board"
            className={`p-6 rounded-3xl border-2 transition-all space-y-5 h-full flex flex-col justify-between ${
              calcResult.isProfitable
                ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                : 'bg-rose-50/70 border-rose-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div className="flex items-center gap-2">
                  {calcResult.isProfitable ? (
                    <TrendingUp className="w-6 h-6 text-emerald-700" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose-700" />
                  )}
                  <span
                    className={`font-black text-base uppercase tracking-wider ${
                      calcResult.isProfitable ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {calcResult.isProfitable ? 'Projected Net Profit' : 'Projected Net Loss'}
                  </span>
                </div>

                <div
                  id="result-profit"
                  className={`text-2xl sm:text-3xl font-black ${
                    calcResult.isProfitable ? 'text-emerald-800' : 'text-rose-700'
                  }`}
                >
                  Rs. {Math.abs(calcResult.profit).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs pt-4">
                {/* Revenue */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Revenue</span>
                  <span id="result-revenue" className="font-black text-slate-900 text-sm sm:text-base block mt-1">
                    Rs. {calcResult.revenue.toLocaleString()}
                  </span>
                </div>

                {/* Total Cost */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Outlay</span>
                  <span id="result-cost" className="font-black text-slate-900 text-sm sm:text-base block mt-1">
                    Rs. {calcResult.totalCost.toLocaleString()}
                  </span>
                </div>

                {/* Margin % */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Profit Margin</span>
                  <span
                    id="result-margin"
                    className={`font-black text-sm sm:text-base block mt-1 ${
                      calcResult.isProfitable ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {calcResult.margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/80 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Calculation Summary:</div>
              <p className="text-[11px] text-slate-500">
                Formula: Revenue ({quantity} × Rs. {calcResult.adjustedPrice.toLocaleString()}) − Total Cost ({quantity} × Rs. {costPerUnit.toLocaleString()}) = Rs. {calcResult.profit.toLocaleString()} ({calcResult.margin.toFixed(1)}% margin).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
