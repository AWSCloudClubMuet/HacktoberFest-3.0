import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mandiService } from '../api/mandiService';
import { PriceHistoryChart } from '../components/prices/PriceHistoryChart';
import { MarketComparison } from '../components/prices/MarketComparison';
import { ChartSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { LineChart, BarChart2, Layers } from 'lucide-react';

export const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCropId = searchParams.get('cropId');

  const [prices, setPrices] = useState([]);
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCropId, setSelectedCropId] = useState(urlCropId || 'crp-wheat');
  const [selectedMarketId, setSelectedMarketId] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pricesData, cropsData] = await Promise.all([
        mandiService.getMarketPrices(),
        mandiService.getCrops()
      ]);
      setPrices(pricesData);
      setCrops(cropsData);

      if (urlCropId) {
        setSelectedCropId(urlCropId);
      } else if (cropsData.length > 0) {
        setSelectedCropId(cropsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter all market prices for the selected crop
  const cropPricesAcrossMarkets = useMemo(() => {
    return prices.filter((p) => p.cropId === selectedCropId);
  }, [prices, selectedCropId]);

  // Available markets for this crop
  const availableMarketsForCrop = useMemo(() => {
    return cropPricesAcrossMarkets.map((p) => ({
      id: p.marketId,
      name: p.marketName
    }));
  }, [cropPricesAcrossMarkets]);

  // Selected price item for 14-day history chart
  const activePriceRecord = useMemo(() => {
    if (selectedMarketId) {
      const found = cropPricesAcrossMarkets.find((p) => p.marketId === selectedMarketId);
      if (found) return found;
    }
    return cropPricesAcrossMarkets[0] || null;
  }, [cropPricesAcrossMarkets, selectedMarketId]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId);

  const handleCropChange = (cropId) => {
    setSelectedCropId(cropId);
    setSelectedMarketId('');
    setSearchParams({ cropId });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Price Analytics & Market Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Study 14-day Mandi trends and compare wholesale realizations across 3+ Sindh markets
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl border border-earth-300 p-4 shadow-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Crop Selector */}
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Choose Crop
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => handleCropChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>
        </div>

        {/* Market Selector for 14-Day History */}
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Mandi for 14-Day Chart
          </label>
          <select
            value={activePriceRecord?.marketId || ''}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            {availableMarketsForCrop.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: 14-Day Price History Chart */}
          {activePriceRecord ? (
            <PriceHistoryChart
              historyData={activePriceRecord.history14Days}
              cropName={activePriceRecord.cropName}
              marketName={activePriceRecord.marketName}
              unit={activePriceRecord.unit}
            />
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-earth-300 text-center text-slate-500 text-sm">
              No historical price entries found for this crop in the selected market.
            </div>
          )}

          {/* Section 2: 3+ Market Comparison */}
          <MarketComparison
            cropPrices={cropPricesAcrossMarkets}
            selectedCropName={selectedCrop?.name || 'Selected Crop'}
          />
        </div>
      )}
    </div>
  );
};
