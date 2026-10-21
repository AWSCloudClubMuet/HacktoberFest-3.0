import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatPKR } from '../../utils/formatters';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const PriceHistoryChart = ({ historyData, cropName, marketName, unit }) => {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No historical price data recorded for this crop.
      </div>
    );
  }

  // Calculate 14-day statistics
  const prices = historyData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const netChange = lastPrice - firstPrice;
  const netChangePercent = ((netChange / firstPrice) * 100).toFixed(2);
  const isPositive = netChange >= 0;

  return (
    <div className="bg-white rounded-2xl border border-earth-300 p-4 sm:p-6 shadow-card space-y-5">
      {/* Title & Stats Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              14-Day Price Trajectory
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-agri-100 text-agri-800 font-medium">
              {marketName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily modal rate fluctuation for <span className="font-semibold text-slate-700">{cropName}</span>
          </p>
        </div>

        {/* 14-Day Net Change Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}
            <span>14d: {netChange >= 0 ? `+${formatPKR(netChange)}` : formatPKR(netChange)} ({netChangePercent}%)</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 rounded-xl bg-earth-50 border border-earth-200 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            14-Day Low
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800">
            {formatPKR(minPrice)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            14-Day Average
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800">
            {formatPKR(avgPrice)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            14-Day High
          </span>
          <span className="text-sm sm:text-base font-extrabold text-slate-800">
            {formatPKR(maxPrice)}
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9de" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd4c0' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `Rs.${v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                      <p className="font-semibold text-slate-300">{data.day} ({data.date})</p>
                      <p className="text-sm font-extrabold text-emerald-400">
                        {formatPKR(data.price)} <span className="text-[10px] text-slate-400">/ {unit}</span>
                      </p>
                      {data.volume && (
                        <p className="text-[11px] text-slate-400">
                          Daily Volume: <span className="text-slate-200 font-medium">{data.volume.toLocaleString()} maunds</span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#15803d"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
