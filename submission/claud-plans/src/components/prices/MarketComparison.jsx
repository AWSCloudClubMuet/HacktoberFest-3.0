import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { formatPKR } from '../../utils/formatters';
import { TrendBadge } from '../common/Badge';
import { Sparkles, MapPin, Award, ArrowRight } from 'lucide-react';

const BAR_COLORS = ['#0f4726', '#15803d', '#22c55e', '#f59e0b', '#0284c7'];

export const MarketComparison = ({ cropPrices, selectedCropName }) => {
  if (!cropPrices || cropPrices.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-earth-300 p-6 text-center text-slate-500 text-sm">
        Insufficient market data to perform 3+ market comparison for {selectedCropName}.
      </div>
    );
  }

  // Find highest & lowest paying mandi
  const sorted = useMemo(() => {
    return [...cropPrices].sort((a, b) => b.modalPrice - a.modalPrice);
  }, [cropPrices]);

  const highestMarket = sorted[0];
  const lowestMarket = sorted[sorted.length - 1];
  const priceSpread = highestMarket.modalPrice - lowestMarket.modalPrice;

  // Chart data
  const chartData = sorted.map((item) => ({
    name: item.marketName.replace(' Wholesale Mandi', '').replace(' Central Grain & Cotton Mandi', '').replace(' Agricultural Market', '').replace(' New Sabzi Mandi (Super Highway)', ''),
    fullName: item.marketName,
    price: item.modalPrice,
    min: item.minPrice,
    max: item.maxPrice,
    change: item.dailyChangePercent,
    unit: item.unit
  }));

  return (
    <div className="bg-white rounded-2xl border border-earth-300 p-4 sm:p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Sindh Inter-Mandi Price Comparison
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-harvest-100 text-harvest-800 border border-harvest-200">
              {cropPrices.length} Markets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare wholesale rates for <strong className="text-slate-800">{selectedCropName}</strong> across Sindh trading hubs
          </p>
        </div>
      </div>

      {/* Arbitrage Opportunity Callout */}
      {priceSpread > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-agri-50 to-harvest-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Award className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                Highest Mandi Realization
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                <span className="text-emerald-700 font-bold">{highestMarket.marketName}</span> pays{' '}
                <span className="text-emerald-800 font-extrabold">{formatPKR(priceSpread)} more</span> per {highestMarket.unit} than {lowestMarket.marketName}.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-medium text-slate-500 block">Maximum Mandi Spread</span>
            <span className="text-base font-extrabold text-emerald-700">+{formatPKR(priceSpread)}</span>
          </div>
        </div>
      )}

      {/* Side-by-Side Market Comparison Bar Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Wholesale Rate Comparison ({highestMarket.unit})
        </h4>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd4c0' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 200', 'dataMax + 200']}
                tickFormatter={(v) => `Rs.${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-200">{d.fullName}</p>
                        <p className="text-emerald-400 font-extrabold text-sm">
                          {formatPKR(d.price)} <span className="text-[10px] text-slate-300">/ {d.unit}</span>
                        </p>
                        <p className="text-slate-400">
                          Range: {formatPKR(d.min)} - {formatPKR(d.max)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Structured Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-earth-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-earth-100 text-slate-700 font-semibold border-b border-earth-200">
            <tr>
              <th className="py-2.5 px-3">Mandi / Market</th>
              <th className="py-2.5 px-3 text-right">Modal Price</th>
              <th className="py-2.5 px-3 text-right">Mandi Range (Low - High)</th>
              <th className="py-2.5 px-3 text-center">24h Fluctuation</th>
              <th className="py-2.5 px-3 text-right">Diff vs Peak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-200">
            {sorted.map((item, idx) => {
              const diffFromPeak = item.modalPrice - highestMarket.modalPrice;
              return (
                <tr key={item.id} className={idx === 0 ? 'bg-emerald-50/50 font-medium' : 'hover:bg-slate-50'}>
                  <td className="py-2.5 px-3 text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {idx === 0 && <Award className="w-4 h-4 text-emerald-600 shrink-0" />}
                      <span className="font-semibold">{item.marketName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                    {formatPKR(item.modalPrice)} <span className="text-[10px] text-slate-500 font-normal">/ {item.unit}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {formatPKR(item.minPrice)} – {formatPKR(item.maxPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <TrendBadge percent={item.dailyChangePercent} />
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {diffFromPeak === 0 ? (
                      <span className="text-emerald-700 text-[11px] font-bold">Top Mandi</span>
                    ) : (
                      <span className="text-rose-600">-{formatPKR(Math.abs(diffFromPeak))}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
