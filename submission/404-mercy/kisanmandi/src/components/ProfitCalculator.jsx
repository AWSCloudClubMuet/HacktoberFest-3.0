import React, { useState, useEffect, useCallback } from 'react';
import { getCrops, getMarkets, getPrices } from '../services/api';

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function ProfitCalculator({ currentUser }) {
  const [crops, setCrops]     = useState([]);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [cropId, setCropId]           = useState('');
  const [marketId, setMarketId]       = useState('');
  const [quantity, setQuantity]       = useState('100');
  const [costPerUnit, setCostPerUnit] = useState('1000');
  const [adjustment, setAdjustment]   = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m, p] = await Promise.all([getCrops(), getMarkets(), getPrices()]);
      setCrops(c); setMarkets(m); setPrices(p);
      if (c.length) setCropId(c[0].id);
      if (m.length) setMarketId(m[0].id);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Get latest price for selected crop + market
  const getLatestPrice = () => {
    if (!cropId || !marketId) return null;
    const relevant = prices
      .filter(p => p.cropId === cropId && p.marketId === marketId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return relevant[0]?.price ?? null;
  };

  const currentPrice = getLatestPrice();
  const cropObj      = crops.find(c => c.id === cropId);
  const cropUnit     = cropObj?.unit || '';
  const cropName     = cropObj?.name || '';

  // Validation
  const qtyNum  = parseFloat(quantity);
  const costNum = parseFloat(costPerUnit);

  let qtyError = '';
  if (quantity === '' || isNaN(qtyNum) || qtyNum <= 0) {
    qtyError = 'Quantity must be positive (> 0)';
  }

  let costError = '';
  if (costPerUnit === '' || isNaN(costNum) || costNum < 0) {
    costError = 'Cost must be non-negative (≥ 0)';
  }

  const isValid = !qtyError && !costError && currentPrice != null;

  // Immediate calculations as inputs or slider change
  const adjustedPrice       = currentPrice != null ? currentPrice * (1 + adjustment / 100) : null;
  const revenue             = (isValid && adjustedPrice != null) ? qtyNum * adjustedPrice : null;
  const totalCost           = isValid ? qtyNum * costNum : null;
  const profitLoss          = (revenue != null && totalCost != null) ? revenue - totalCost : null;
  const profitMarginPercent = (revenue != null && revenue !== 0 && profitLoss != null)
    ? (profitLoss / revenue) * 100
    : null;
  const isProfit            = profitLoss != null && profitLoss >= 0;

  return (
    <div className="screen">
      <h2 className="screen-title">Profit Calculator</h2>
      <div className="data-notice">⚠️ Fictional sample data — not live mandi prices.</div>

      {loading && <div className="state-box"><div className="spinner" /><p className="state-text">Loading…</p></div>}
      {error && !loading && (
        <div className="state-box">
          <span className="state-icon">⚠️</span>
          <p className="state-text">{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pc-crop">Crop</label>
              <select id="pc-crop" className="form-control"
                value={cropId} onChange={e => setCropId(e.target.value)}>
                {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pc-mkt">Market</label>
              <select id="pc-mkt" className="form-control"
                value={marketId} onChange={e => setMarketId(e.target.value)}>
                {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Current market price display */}
          <div className="card" style={{ marginBottom: '.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--gray-600)' }}>Current Market Price ({cropName})</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-dark)' }}>
              {currentPrice != null ? `₨${fmt(currentPrice)}/${cropUnit}` : <span style={{ color: 'var(--gray-400)', fontSize: '.85rem' }}>No price data</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pc-qty">Quantity ({cropUnit || 'unit'})</label>
              <input id="pc-qty" className={`form-control ${qtyError ? 'error' : ''}`}
                type="number" min="1" step="any" placeholder="e.g. 100"
                value={quantity} onChange={e => setQuantity(e.target.value)} />
              {qtyError && <p className="form-error">{qtyError}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pc-cost">Cost per {cropUnit || 'unit'} (₨)</label>
              <input id="pc-cost" className={`form-control ${costError ? 'error' : ''}`}
                type="number" min="0" step="any" placeholder="e.g. 1000"
                value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} />
              {costError && <p className="form-error">{costError}</p>}
            </div>
          </div>

          {/* Interactive Slider */}
          <div className="card" style={{ marginBottom: '.85rem' }}>
            <div className="slider-wrap">
              <div className="slider-label">
                <span>Price Adjustment (What-If Analysis)</span>
                <strong style={{ color: adjustment > 0 ? 'var(--green)' : adjustment < 0 ? 'var(--red)' : 'var(--gray-700)' }}>
                  {adjustment > 0 ? '+' : ''}{adjustment}%
                </strong>
              </div>
              <input
                type="range" min="-20" max="20" step="1"
                value={adjustment}
                onChange={e => setAdjustment(Number(e.target.value))}
                aria-label="Price adjustment slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--gray-400)', marginTop: '.25rem' }}>
                <span>-20%</span><span>0%</span><span>+20%</span>
              </div>
            </div>
            {adjustedPrice != null && (
              <div style={{ fontSize: '.82rem', color: 'var(--gray-600)', textAlign: 'center' }}>
                Adjusted selling price: <strong style={{ color: 'var(--green-dark)' }}>₨{fmt(adjustedPrice)}/{cropUnit}</strong>
              </div>
            )}
          </div>

          {/* Real-time Calculation Results */}
          {isValid && (
            <div className={`calc-result ${isProfit ? '' : 'loss'}`}>
              <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.5rem', color: isProfit ? 'var(--green-dark)' : 'var(--red)' }}>
                {isProfit ? '✅ Profit Estimate' : '⚠️ Projected Loss'} — {cropName}
              </h3>
              <div className="calc-row">
                <span className="calc-row-label">Quantity</span>
                <span className="calc-row-value">{fmt(qtyNum)} {cropUnit}</span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Adjusted Price per {cropUnit}</span>
                <span className="calc-row-value">₨{fmt(adjustedPrice)}</span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Expected Revenue</span>
                <span className="calc-row-value">₨{fmt(revenue)}</span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Total Production Cost</span>
                <span className="calc-row-value">₨{fmt(totalCost)}</span>
              </div>
              <div className="calc-row" style={{ borderTop: '2px solid rgba(0,0,0,.1)', marginTop: '.2rem', paddingTop: '.35rem' }}>
                <span className="calc-row-label" style={{ fontWeight: 700 }}>{isProfit ? 'Net Profit' : 'Net Loss'}</span>
                <span className={`calc-row-value ${isProfit ? 'profit' : 'loss'}`}>
                  {isProfit ? '+' : '-'}₨{fmt(Math.abs(profitLoss))}
                </span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Profit Margin (Profit ÷ Revenue)</span>
                <span className={`calc-row-value ${isProfit ? 'profit' : 'loss'}`}>
                  {revenue === 0 ? 'Unavailable (zero revenue)' : profitMarginPercent != null ? `${profitMarginPercent.toFixed(1)}%` : 'Unavailable'}
                </span>
              </div>
            </div>
          )}

          {!isValid && currentPrice != null && (
            <div className="state-box" style={{ background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <p className="state-text">Enter a valid positive quantity and non-negative cost to see the live profit calculation.</p>
            </div>
          )}

          {currentPrice == null && (
            <div className="state-box" style={{ marginTop: '.75rem', background: 'var(--amber-pale)', borderRadius: 'var(--radius)', border: '1px solid #fde68a' }}>
              <span className="state-icon">📊</span>
              <p className="state-text">No price data available for this crop and market combination.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
