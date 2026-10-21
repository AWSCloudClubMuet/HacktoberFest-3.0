import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarkets, getCrops, getPrices } from '../api.js';
import { priceChange } from '../logic.js';
import { useAlerts } from '../context/AlertContext';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calculator,
  ChevronRight,
  MapPin,
  AlertCircle
} from 'lucide-react';

export const PricesPage = () => {
  const navigate = useNavigate();
  const { refreshAlerts } = useAlerts();

  const [markets, setMarkets] = useState([]);
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pull to refresh touch gesture state
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [marketsData, cropsData, pricesData] = await Promise.all([
        getMarkets(),
        getCrops(),
        getPrices()
      ]);

      setMarkets(marketsData || []);
      setCrops(cropsData || []);
      setPrices(pricesData || []);

      if (marketsData && marketsData.length > 0 && !selectedMarketId) {
        setSelectedMarketId(marketsData[0].id);
      }

      // Re-evaluate alerts every time prices are refreshed as required by Milestone 3
      if (refreshAlerts) {
        await refreshAlerts();
      }
    } catch (err) {
      console.error('Failed to load prices data:', err);
      setError(err.message || 'Could not connect to API server on port 3001');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [selectedMarketId, refreshAlerts]);

  useEffect(() => {
    loadData();
  }, []);

  // Pull to refresh gesture handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0 || (containerRef.current && containerRef.current.scrollTop === 0)) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartY.current || isRefreshing || isLoading) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    if (distance > 0) {
      // Apply rubberband friction
      setPullDistance(Math.min(distance * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50 && !isRefreshing && !isLoading) {
      loadData(true);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  // Extract distinct dates to find "Today" (latest date in data) and "Yesterday"
  const allDates = Array.from(new Set(prices.map((p) => p.date))).sort().reverse();
  const todayDate = allDates[0] || '';
  const yesterdayDate = allDates[1] || '';

  // Extract crop categories
  const categories = ['All', ...Array.from(new Set(crops.map((c) => c.category).filter(Boolean)))];

  // Build price entries for the selected market
  const marketCropPrices = crops.map((crop) => {
    const todayRecord = prices.find(
      (p) => p.crop_id === crop.id && p.market_id === selectedMarketId && p.date === todayDate
    );
    const yesterdayRecord = prices.find(
      (p) => p.crop_id === crop.id && p.market_id === selectedMarketId && p.date === yesterdayDate
    );

    const todayPrice = todayRecord ? Number(todayRecord.price) : 0;
    const yesterdayPrice = yesterdayRecord ? Number(yesterdayRecord.price) : todayPrice;
    const change = priceChange(todayPrice, yesterdayPrice);

    return {
      crop,
      todayPrice,
      yesterdayPrice,
      change
    };
  });

  // Filter by category and search box
  const filteredPrices = marketCropPrices.filter(({ crop }) => {
    const matchesCategory =
      selectedCategory === 'All' || crop.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || crop.name.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-4"
    >
      {/* Pull-To-Refresh Visual Indicator */}
      {pullDistance > 0 && (
        <div
          style={{ height: `${pullDistance}px` }}
          className="flex items-center justify-center overflow-hidden transition-all text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-xl"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${pullDistance > 50 ? 'animate-spin text-emerald-700' : ''}`}
          />
          {pullDistance > 50 ? 'Release to refresh rates' : 'Pull down to refresh'}
        </div>
      )}

      {/* Header Bar with Date & Visible Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Wholesale Rates</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Mandi
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {todayDate ? `Rates for ${todayDate} (PKR / 40 kg)` : 'Loading rates...'}
          </p>
        </div>

        {/* Visible Refresh Button */}
        <button
          type="button"
          id="refresh-prices-btn"
          onClick={() => loadData(true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-earth-300 text-slate-700 hover:bg-earth-50 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          title="Refresh prices from API"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Profit Calculator Access Banner (Available to all roles) */}
      <button
        type="button"
        id="open-profit-calculator-btn"
        onClick={() => navigate('/calculator')}
        className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-md flex items-center justify-between hover:from-emerald-700 hover:to-emerald-800 transition-all text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight">Profit & Margin Calculator</div>
            <div className="text-[10px] text-emerald-200">
              What-if slider (-20% to +20%) & cultivation cost simulator
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
      </button>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">API Connection Error</p>
            <p className="mt-0.5 text-[11px]">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] hover:bg-rose-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Market Dropdown (from /markets) */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Select Mandi Market
        </label>
        <div className="relative">
          <select
            id="market-select"
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-bold text-slate-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.district})
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Search box by crop name */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          id="crop-search-input"
          placeholder="Search crop name (Wheat, Cotton, Onion...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Category Chips (All + categories from /crops) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-earth-300 hover:bg-earth-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Crops Prices List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filteredPrices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          <p className="font-semibold">No crop rates found matching your query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-2 text-emerald-700 font-bold underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrices.map(({ crop, todayPrice, change }) => {
            const isUp = change.amount >= 0;
            return (
              <div
                key={crop.id}
                id={`crop-card-${crop.id}`}
                onClick={() => navigate(`/crop/${crop.id}?marketId=${selectedMarketId}`)}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Crop & Category */}
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <h3 className="font-black text-slate-900 text-base">{crop.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {crop.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedMarket?.name || 'Mandi'} • 40 kg
                  </div>
                </div>

                {/* Today's Rate & Daily Change */}
                <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    Rs. {todayPrice.toLocaleString()}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold ${
                      isUp ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isUp ? '+' : ''}
                      {change.amount} ({isUp ? '+' : ''}
                      {change.percent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PricesPage;
