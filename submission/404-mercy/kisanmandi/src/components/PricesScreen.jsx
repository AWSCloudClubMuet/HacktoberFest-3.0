import React, { useState, useEffect, useCallback } from 'react';
import { getCrops, getMarkets, getPrices } from '../services/api';
import TrendsPanel from './TrendsPanel';
import DemoPriceBadge from './DemoPriceBadge';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

function calcChange(todayPrice, ydayPrice) {
  if (todayPrice == null) return null;
  if (ydayPrice == null || ydayPrice === 0) {
    return { change: null, pct: null, reason: 'Previous-day price unavailable' };
  }
  const change = todayPrice - ydayPrice;
  const pct = (change / ydayPrice) * 100;
  return { change, pct };
}

export default function PricesScreen({ currentUser, onPricesRefreshed }) {
  const [crops, setCrops]       = useState([]);
  const [markets, setMarkets]   = useState([]);
  const [prices, setPrices]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [selectedMarket, setSelectedMarket] = useState('');
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [showTrends, setShowTrends] = useState(false);
  const [trendCrop, setTrendCrop]   = useState(null);
  const [trendMarket, setTrendMarket] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m, p] = await Promise.all([getCrops(), getMarkets(), getPrices()]);
      setCrops(c);
      setMarkets(m);
      setPrices(p);
      if (!selectedMarket && m.length) setSelectedMarket(m[0].id);

      // Re-evaluate alerts for the logged-in user on price refresh
      if (onPricesRefreshed) {
        onPricesRefreshed(p);
      }
    } catch (err) {
      setError(err.message || 'Failed to load prices. Check API server.');
    } finally {
      setLoading(false);
    }
  }, [selectedMarket, onPricesRefreshed]);

  useEffect(() => { loadData(); }, [loadData]);

  const categories = [...new Set(crops.map(c => c.category))].sort();

  // Find latest dates in the price records for today & yesterday
  const allDates = [...new Set(prices.map(p => p.date))].sort().reverse();
  const latestDate = allDates[0] || new Date().toISOString().split('T')[0];
  const previousDate = allDates[1] || null;

  // Build price lookup: cropId -> marketId -> date -> price
  const priceMap = {};
  prices.forEach(p => {
    if (!priceMap[p.cropId]) priceMap[p.cropId] = {};
    if (!priceMap[p.cropId][p.marketId]) priceMap[p.cropId][p.marketId] = {};
    priceMap[p.cropId][p.marketId][p.date] = p.price;
  });

  const filteredCrops = crops.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || c.category === category;
    return matchSearch && matchCat;
  });

  const openTrends = (crop) => {
    setTrendCrop(crop);
    setTrendMarket(markets.find(m => m.id === selectedMarket) || markets[0]);
    setShowTrends(true);
  };

  if (showTrends && trendCrop) {
    return (
      <TrendsPanel
        crop={trendCrop}
        market={trendMarket}
        markets={markets}
        prices={prices}
        onBack={() => setShowTrends(false)}
      />
    );
  }

  return (
    <div className="screen">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <h2 className="screen-title" style={{ marginBottom: 0 }}>Crop Prices</h2>
          <DemoPriceBadge label="Demo Prices" />
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh prices"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Market Selector */}
      <div className="form-group">
        <label className="form-label" htmlFor="market-sel">Select Market</label>
        <select id="market-sel" className="form-control" value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name} ({m.district})</option>)}
        </select>
      </div>

      {/* Search + Category Filter */}
      <div className="filter-row">
        <div className="search-input">
          <input
            className="form-control"
            type="text"
            placeholder="Search crop name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search crops"
          />
        </div>
        <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 140 }} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {loading && (
        <div className="state-box">
          <div className="spinner" role="status" aria-label="Loading" />
          <p className="state-text">Loading latest mandi rates…</p>
        </div>
      )}

      {error && !loading && (
        <div className="state-box">
          <span className="state-icon">⚠️</span>
          <p className="state-text">{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>Retry</button>
        </div>
      )}

      {!loading && !error && filteredCrops.length === 0 && (
        <div className="state-box">
          <span className="state-icon">🌾</span>
          <p className="state-text">No crops found matching your search.</p>
        </div>
      )}

      {!loading && !error && filteredCrops.map(crop => {
        const marketPrices = priceMap[crop.id]?.[selectedMarket] || {};
        const todayPrice   = marketPrices[latestDate];
        const ydayPrice    = previousDate ? marketPrices[previousDate] : null;
        const delta        = calcChange(todayPrice, ydayPrice);

        return (
          <div key={crop.id} className="price-card" role="article" aria-label={`${crop.name} price`}>
            <div className="price-card-header">
              <div>
                <div className="crop-name">{crop.name}</div>
                <div className="crop-category">{crop.category}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {todayPrice != null ? (
                  <>
                    <span className="price-main">₨{fmt(todayPrice)}</span>
                    <span className="price-unit">/{crop.unit}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>No price today</span>
                )}
              </div>
            </div>

            <div className="price-meta">
              <span className="price-meta-item">
                Yesterday ({previousDate || 'prior'}): {ydayPrice != null ? `₨${fmt(ydayPrice)}` : '—'}
              </span>
              {delta && delta.change !== null && (
                <>
                  <span className={`price-meta-item ${delta.change > 0 ? 'change-up' : delta.change < 0 ? 'change-down' : 'change-none'}`}>
                    {delta.change > 0 ? '▲ +' : delta.change < 0 ? '▼ -' : '='}₨{fmt(Math.abs(delta.change))}
                  </span>
                  <span className={`price-meta-item ${delta.pct > 0 ? 'change-up' : delta.pct < 0 ? 'change-down' : 'change-none'}`}>
                    {delta.pct > 0 ? '+' : ''}{delta.pct.toFixed(1)}%
                  </span>
                </>
              )}
              {delta && delta.change === null && (
                <span className="price-meta-item change-none">Percentage unavailable</span>
              )}
              {delta === null && todayPrice == null && (
                <span className="price-meta-item change-none">No data available</span>
              )}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '.6rem' }}
              onClick={() => openTrends(crop)}
              aria-label={`View 14-day trend for ${crop.name}`}
            >
              📈 14-day Trend & Comparison
            </button>
          </div>
        );
      })}
    </div>
  );
}
