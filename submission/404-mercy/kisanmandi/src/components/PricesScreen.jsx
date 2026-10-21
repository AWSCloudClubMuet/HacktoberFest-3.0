import React, { useState, useEffect, useCallback } from 'react';
import { getCrops, getMarkets, getPrices } from '../services/api';
import TrendsPanel from './TrendsPanel';
import DemoPriceBadge from './DemoPriceBadge';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

function getCropImage(crop) {
  if (crop?.imageUrl) return crop.imageUrl;
  const name = (crop?.name || '').toLowerCase();
  if (name.includes('wheat')) return '/images/crops/wheat.jpg';
  if (name.includes('rice')) return '/images/crops/rice.jpg';
  if (name.includes('cotton')) return '/images/crops/cotton.jpg';
  if (name.includes('sugarcane')) return '/images/crops/sugarcane.png';
  if (name.includes('tomato')) return '/images/crops/tomato.jpg';
  if (name.includes('onion')) return '/images/crops/onion.jpg';
  if (name.includes('potato')) return '/images/crops/potato.jpg';
  if (name.includes('chili')) return '/images/crops/chilies.jpg';
  if (name.includes('mango')) return '/images/crops/mango.jpg';
  if (name.includes('banana')) return '/images/crops/banana.jpg';
  return '/images/crops/wheat.jpg';
}

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
        <div className="price-cards-grid" aria-busy="true" aria-label="Loading crop prices">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.65rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 50, height: 50, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 15, width: '60%', marginBottom: 8, borderRadius: 'var(--radius-xs)' }} />
                  <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 'var(--radius-xs)' }} />
                </div>
                <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 'var(--radius-xs)' }} />
              </div>
              <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 6, borderRadius: 'var(--radius-xs)' }} />
              <div className="skeleton" style={{ height: 36, width: '100%', marginTop: 10, borderRadius: 'var(--radius-sm)' }} />
            </div>
          ))}
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

      {!loading && !error && filteredCrops.length > 0 && (
        <div className="price-cards-grid" role="region" aria-label="Crop price cards">
          {filteredCrops.map(crop => {
            const marketPrices = priceMap[crop.id]?.[selectedMarket] || {};
            const todayPrice   = marketPrices[latestDate];
            const ydayPrice    = previousDate ? marketPrices[previousDate] : null;
            const delta        = calcChange(todayPrice, ydayPrice);

            return (
              <div key={crop.id} className="price-card" role="article" aria-label={`${crop.name} price`}>
                <div className="price-card-body">
                  <div className="price-card-header">
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', minWidth: 0 }}>
                      <img
                        src={getCropImage(crop)}
                        alt={`${crop.name} reference`}
                        className="crop-thumb"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/images/crops/wheat.jpg'; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="crop-name">{crop.name}</div>
                        <div className="crop-category">{crop.category}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '.5rem' }}>
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
                      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
                        <span className={`change-pill ${delta.change > 0 ? 'change-up' : delta.change < 0 ? 'change-down' : 'change-none'}`}>
                          {delta.change > 0 ? '▲ +' : delta.change < 0 ? '▼ ' : '='} ₨{fmt(Math.abs(delta.change))}
                        </span>
                        <span className={`change-pill ${delta.pct > 0 ? 'change-up' : delta.pct < 0 ? 'change-down' : 'change-none'}`}>
                          {delta.pct > 0 ? '+' : ''}{delta.pct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {delta && delta.change === null && (
                      <span className="change-pill change-none" style={{ marginTop: '.3rem' }}>No prev. data</span>
                    )}
                    {delta === null && todayPrice == null && (
                      <span className="change-pill change-none" style={{ marginTop: '.3rem' }}>No data</span>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '.65rem', width: '100%' }}
                  onClick={() => openTrends(crop)}
                  aria-label={`View 14-day trend for ${crop.name}`}
                >
                  📈 14-day Trend & Comparison
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
