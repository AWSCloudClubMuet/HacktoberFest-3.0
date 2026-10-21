import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PriceRecord } from '../types';
import { formatPKR, formatShortDate, formatPercentage, formatSignedPKR } from '../lib/formatters';
import { TrendingUp, TrendingDown, Calendar, Maximize2, Minimize2 } from 'lucide-react';

interface PriceChartProps {
  records: PriceRecord[];
  cropName: string;
  marketName: string;
  unit: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  records,
  cropName,
  marketName,
  unit,
}) => {
  // Sort 14 days ascending
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-[#E8E7DF] text-center text-[#767B70]">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-[#4A6B42] opacity-50" />
        <p className="text-sm font-medium">No 14-day price history available for this selection.</p>
      </div>
    );
  }

  const chartData = sorted.map((r) => ({
    date: r.date,
    displayDate: formatShortDate(r.date),
    price: r.price,
  }));

  const prices = sorted.map((r) => r.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const startPrice = sorted[0].price;
  const latestPrice = sorted[sorted.length - 1].price;
  const periodChange = latestPrice - startPrice;
  const periodPercent = startPrice !== 0 ? (periodChange / startPrice) * 100 : null;

  // Compute nice Y-domain
  const yPadding = Math.max(20, Math.round((maxPrice - minPrice) * 0.15) || 50);
  const yMin = Math.max(0, minPrice - yPadding);
  const yMax = maxPrice + yPadding;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-[#2D452B]">
              14-Day Price Trajectory
            </h3>
            <span className="text-xs text-[#767B70]">· 14 Ordered Days</span>
          </div>
          <p className="text-xs text-[#767B70] mt-0.5">
            {cropName} · {marketName} ({unit})
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-[#767B70]">Current Mandi Quotation</div>
          <div className="text-xl font-bold text-[#2D452B] tabular-nums">{formatPKR(latestPrice)}</div>
        </div>
      </div>

      {/* Summary stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
          <div className="text-[11px] text-[#767B70]">14-Day Movement</div>
          <div className="flex items-center gap-1 font-bold text-sm text-[#2F332C] mt-1 tabular-nums">
            {periodChange > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#186F43]" />
            ) : periodChange < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-[#B3261E]" />
            ) : null}
            <span
              className={
                periodChange > 0
                  ? 'text-[#186F43]'
                  : periodChange < 0
                  ? 'text-[#B3261E]'
                  : 'text-[#767B70]'
              }
            >
              {formatSignedPKR(periodChange)} ({formatPercentage(periodPercent)})
            </span>
          </div>
        </div>

        <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
          <div className="text-[11px] text-[#767B70] flex items-center gap-1">
            <Minimize2 className="w-3 h-3 text-[#4A6B42]" />
            14-Day Minimum
          </div>
          <div className="font-bold text-sm text-[#2F332C] mt-1 tabular-nums">
            {formatPKR(minPrice)}
          </div>
        </div>

        <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
          <div className="text-[11px] text-[#767B70] flex items-center gap-1">
            <Maximize2 className="w-3 h-3 text-[#4A6B42]" />
            14-Day Maximum
          </div>
          <div className="font-bold text-sm text-[#2F332C] mt-1 tabular-nums">
            {formatPKR(maxPrice)}
          </div>
        </div>

        <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
          <div className="text-[11px] text-[#767B70]">Day 1 Baseline</div>
          <div className="font-bold text-sm text-[#2F332C] mt-1 tabular-nums">
            {formatPKR(startPrice)}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEA" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#8B9185"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E8E7DF' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              stroke="#8B9185"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-[#E8E7DF] text-xs">
                      <div className="font-semibold text-[#2D452B] mb-0.5">{data.date}</div>
                      <div className="text-[#767B70]">{cropName} · {marketName}</div>
                      <div className="font-bold text-sm text-[#4A6B42] mt-1 tabular-nums">
                        {formatPKR(data.price)} <span className="text-[11px] font-normal text-[#767B70]">/ {unit}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4A6B42"
              strokeWidth={2.5}
              dot={{ fill: '#FAF9F5', stroke: '#4A6B42', strokeWidth: 2, r: 3.5 }}
              activeDot={{ fill: '#2D452B', stroke: '#FFFFFF', strokeWidth: 2, r: 5.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#767B70]">
        <span>Range: {sorted[0].date} to {sorted[sorted.length - 1].date}</span>
        <span>Mandi quotation sample series (14 points)</span>
      </div>
    </div>
  );
};
