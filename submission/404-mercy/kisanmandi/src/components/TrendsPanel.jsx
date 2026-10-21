import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import DemoPriceBadge from './DemoPriceBadge';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

function getCropImage(crop) {
  if (crop?.imageUrl) return crop.imageUrl;
  const name = (crop?.name || '').toLowerCase();
  if (name.includes('wheat')) return '/images/crops/wheat.jpg';
  if (name.includes('rice')) return '/images/crops/rice.jpg';
  if (name.includes('cotton')) return '/images/crops/cotton.jpg';
  if (name.includes('sugarcane')) return '/images/crops/sugarcane.jpg';
  if (name.includes('tomato')) return '/images/crops/tomato.jpg';
  if (name.includes('onion')) return '/images/crops/onion.jpg';
  if (name.includes('potato')) return '/images/crops/potato.jpg';
  if (name.includes('chili')) return '/images/crops/chilies.jpg';
  if (name.includes('mango')) return '/images/crops/mango.jpg';
  if (name.includes('banana')) return '/images/crops/banana.jpg';
  return '/images/crops/wheat.jpg';
}

export default function TrendsPanel({ crop, market, markets, prices, onBack }) {
  // Filter 14-day history for selected crop+market (chronological)
  const history = useMemo(() => {
    return prices
      .filter(p => p.cropId === crop.id && p.marketId === market.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(p => ({ date: p.date.slice(5), price: p.price, fullDate: p.date }));
  }, [prices, crop.id, market.id]);

  // Statistics using only the selected crop and market's history
  const validPrices = history.map(h => h.price).filter(p => p != null);
  const minPrice = validPrices.length ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : null;
  const avgPrice = validPrices.length
    ? Math.round(validPrices.reduce((s, v) => s + v, 0) / validPrices.length)
    : null;

  // Market comparison: latest available price for THIS crop across all 3 markets
  const comparisons = useMemo(() => {
    return markets.map(m => {
      const marketPrices = prices
        .filter(p => p.cropId === crop.id && p.marketId === m.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const latest = marketPrices[0];
      return { market: m, price: latest?.price ?? null, date: latest?.date ?? null };
    }).filter(c => c.price != null)
      .sort((a, b) => b.price - a.price); // Sorted highest to lowest
  }, [markets, prices, crop.id]);

  // Check if dates differ across markets
  const distinctDates = [...new Set(comparisons.map(c => c.date).filter(Boolean))];
  const hasDateDifference = distinctDates.length > 1;

  return (
    <div className="screen">
      <div className="section-header" style={{ marginBottom: '.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} aria-label="Back to prices">← Back to Prices</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <img
            src={getCropImage(crop)}
            alt={`${crop.name} reference`}
            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--gray-200)', flexShrink: 0 }}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/images/crops/wheat.jpg'; }}
          />
          <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--green-dark)' }}>
            {crop.name} — {market.name}
          </span>
          <DemoPriceBadge label="Demo Data" />
        </div>
      </div>

      {/* 14-day chronological chart */}
      <div className="chart-wrap">
        <h3 style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '.75rem' }}>
          14-Day Price Trend (₨/{crop.unit})
        </h3>
        {history.length === 0 ? (
          <div className="state-box" style={{ padding: '1.5rem' }}>
            <span className="state-icon">📉</span>
            <p className="state-text">No price history available for {crop.name} at {market.name}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                width={65}
                tickFormatter={v => `₨${(v/1000).toFixed(1)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(v) => [`₨${fmt(v)} per ${crop.unit}`, 'Price']}
                labelFormatter={(l) => `Date: ${l}`}
                contentStyle={{ fontSize: '.8rem', borderRadius: 8, borderColor: '#e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2e7d32"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2e7d32' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Statistics */}
      {validPrices.length > 0 && (
        <div className="chart-stats" style={{ marginBottom: '.75rem' }}>
          <div className="stat-box">
            <div className="stat-label">Min Price</div>
            <div className="stat-value">₨{fmt(minPrice)}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Average Price</div>
            <div className="stat-value">₨{fmt(avgPrice)}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Max Price</div>
            <div className="stat-value">₨{fmt(maxPrice)}</div>
          </div>
        </div>
      )}

      {/* Market Comparison for this crop */}
      <div className="card" style={{ marginBottom: '.75rem' }}>
        <h3 style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '.3rem' }}>
          Market Comparison — {crop.name}
        </h3>
        <p style={{ fontSize: '.72rem', color: 'var(--gray-500)', marginBottom: '.6rem' }}>
          Latest available price per market, sorted from highest to lowest. Highest market is highlighted.
        </p>

        {hasDateDifference && (
          <div style={{ background: 'var(--amber-pale)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '.4rem .6rem', fontSize: '.72rem', color: '#92400e', marginBottom: '.6rem' }}>
            ℹ️ Note: Latest available dates vary across markets. Individual record dates are indicated below.
          </div>
        )}

        {comparisons.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontSize: '.85rem' }}>No comparison data available.</p>
        ) : (
          comparisons.map((c, i) => (
            <div
              key={c.market.id}
              className={`market-comp-row ${i === 0 ? 'highest' : ''}`}
              aria-label={`${c.market.name}: ₨${fmt(c.price)}${i === 0 ? ' (Highest Price Market)' : ''}`}
            >
              <div className="market-comp-info">
                <div className="market-comp-name">
                  {i === 0 && <span title="Highest-priced market">🏆 </span>}
                  {c.market.name}
                  {i === 0 && <span className="pill pill-green" style={{ marginLeft: '.4rem', fontSize: '.65rem' }}>Highest</span>}
                </div>
                <div className="market-comp-district">
                  {c.market.district} {c.date && `• Date: ${c.date}`}
                </div>
              </div>
              <div className="market-comp-price">
                ₨{fmt(c.price)}
                <span style={{ fontSize: '.72rem', color: 'var(--gray-500)', fontWeight: 400 }}>/{crop.unit}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
