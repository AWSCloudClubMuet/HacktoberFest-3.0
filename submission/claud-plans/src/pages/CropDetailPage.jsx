import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getCrops, getMarkets, getPrices } from '../api.js';
import { stats14Days, bestMarket } from '../logic.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  MapPin,
  Award,
  Sparkles,
  BarChart3
} from 'lucide-react';

export const CropDetailPage = () => {
  const { cropId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialMarketId = searchParams.get('marketId') || '';

  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState(initialMarketId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [c, m, p] = await Promise.all([getCrops(), getMarkets(), getPrices()]);
        setCrops(c || []);
        setMarkets(m || []);
        setPrices(p || []);

        if (!selectedMarketId && m && m.length > 0) {
          setSelectedMarketId(m[0].id);
        }
      } catch (err) {
        console.error('Failed to load crop detail data:', err);
        setError(err.message || 'Failed to load details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedCrop = useMemo(() => {
    return crops.find((c) => c.id === cropId) || crops[0] || null;
  }, [crops, cropId]);

  // Extract all dates to find "Today" (latest date in data)
  const allDates = useMemo(() => {
    return Array.from(new Set(prices.map((p) => p.date))).sort().reverse();
  }, [prices]);

  const todayDate = allDates[0] || '';

  // Get the 14-day history for selectedCrop in selectedMarketId
  const history14Days = useMemo(() => {
    if (!selectedCrop || !selectedMarketId) return [];
    const list = prices.filter(
      (p) => p.crop_id === selectedCrop.id && p.market_id === selectedMarketId
    );
    // Sort chronological ascending
    list.sort((a, b) => a.date.localeCompare(b.date));
    // Take last 14
    return list.slice(-14).map((item) => ({
      ...item,
      shortDate: item.date.slice(5) // MM-DD
    }));
  }, [prices, selectedCrop, selectedMarketId]);

  // Compute 14-day stats: min, max, avg
  const stats = useMemo(() => {
    return stats14Days(history14Days);
  }, [history14Days]);

  // Compare markets list: today's price of this crop in every market, sorted highest first
  const compareMarketsList = useMemo(() => {
    if (!selectedCrop || !todayDate) return [];

    const entries = markets.map((market) => {
      const priceRecord = prices.find(
        (p) => p.crop_id === selectedCrop.id && p.market_id === market.id && p.date === todayDate
      );
      const price = priceRecord ? Number(priceRecord.price) : 0;
      return {
        market,
        price
      };
    });

    // Sort highest price first
    entries.sort((a, b) => b.price - a.price);
    return entries;
  }, [markets, prices, selectedCrop, todayDate]);

  const bestMarketEntry = compareMarketsList[0];

  const handleMarketChange = (newMarketId) => {
    setSelectedMarketId(newMarketId);
    setSearchParams({ marketId: newMarketId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-8 bg-earth-200 rounded-xl animate-pulse w-1/2"></div>
        <div className="h-48 bg-white rounded-2xl border border-earth-200 animate-pulse"></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-white rounded-xl animate-pulse"></div>
          <div className="h-16 bg-white rounded-xl animate-pulse"></div>
          <div className="h-16 bg-white rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !selectedCrop) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
        <p className="text-xs font-bold text-rose-700">{error || 'Crop not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-xs px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xl"
        >
          Back to Prices
        </button>
      </div>
    );
  }

  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  return (
    <div className="space-y-4">
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="back-to-prices-btn"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rates
        </button>
        <span className="text-[10px] uppercase font-bold text-slate-400">
          Crop Analytics
        </span>
      </div>

      {/* Crop Title & Market Selector */}
      <div className="bg-white rounded-2xl border border-earth-300 p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{selectedCrop.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-earth-100 text-slate-700">
                {selectedCrop.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              14-Day Price Trends & Inter-Mandi Comparison
            </p>
          </div>
        </div>

        {/* Market Selector for 14-Day Chart */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Chart Mandi Location
          </label>
          <select
            id="detail-market-select"
            value={selectedMarketId}
            onChange={(e) => handleMarketChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-earth-300 bg-earth-50 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual Column Layout on Laptop screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 14-day LineChart & Three Stat Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Recharts LineChart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  14-Day Price Trend ({selectedMarket?.name})
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">14 Points</span>
            </div>

            <div className="h-60 w-full pt-2">
              {history14Days.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history14Days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fontSize: 9, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tick={{ fontSize: 9, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <Tooltip
                      formatter={(val) => [`Rs. ${Number(val).toLocaleString()}`, 'Price / 40kg']}
                      labelFormatter={(lbl) => `Date: ${lbl}`}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#FFF',
                        borderRadius: '8px',
                        fontSize: '11px',
                        border: 'none'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#059669', strokeWidth: 1, stroke: '#FFF' }}
                      activeDot={{ r: 5, fill: '#D97706' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No historical price data available.
                </div>
              )}
            </div>
          </div>

          {/* Three Stat Cards: Minimum, Maximum, Average */}
          <div className="grid grid-cols-3 gap-3">
            {/* Minimum */}
            <div
              id="stat-card-min"
              className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-center"
            >
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                Minimum
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800 block mt-0.5">
                Rs. {stats.min.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400">14-Day Low</span>
            </div>

            {/* Average */}
            <div
              id="stat-card-avg"
              className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm text-center"
            >
              <span className="text-[9px] uppercase font-bold text-emerald-800 block tracking-wider">
                Average
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-900 block mt-0.5">
                Rs. {stats.avg.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-700">14-Day Mean</span>
            </div>

            {/* Maximum */}
            <div
              id="stat-card-max"
              className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-center"
            >
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                Maximum
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800 block mt-0.5">
                Rs. {stats.max.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400">14-Day High</span>
            </div>
          </div>
        </div>

        {/* Right Column: Compare Markets Today */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Compare Markets Today
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Ranked by highest price realization
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {todayDate}
                </span>
              </div>

              <div className="space-y-2.5 pt-3">
                {compareMarketsList.map(({ market, price }, index) => {
                  const isBest = index === 0;
                  return (
                    <div
                      key={market.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isBest
                          ? 'border-emerald-300 bg-emerald-50/70 shadow-sm'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{market.name}</span>
                          {isBest && (
                            <span
                              id="best-market-badge"
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider shadow-sm animate-pulse"
                            >
                              <Award className="w-3 h-3" /> Best place to sell today
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          District: {market.district}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-base font-black ${isBest ? 'text-emerald-900' : 'text-slate-800'}`}>
                          Rs. {price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">per 40 kg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100 mt-4">
              Selling in the top-ranked mandi increases net grower realizations across Sindh wholesale centers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetailPage;
