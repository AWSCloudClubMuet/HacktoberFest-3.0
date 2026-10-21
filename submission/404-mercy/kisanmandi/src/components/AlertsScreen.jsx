import React, { useState, useEffect, useCallback } from 'react';
import {
  getAlertsByUser, getCrops, getMarkets, getPrices,
  createAlert, updateAlert, deleteAlert
} from '../services/api';
import { evaluateUserAlerts } from '../services/alertService';
import DemoPriceBadge from './DemoPriceBadge';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

function validateAlert(form) {
  const errs = {};
  if (!form.cropId)   errs.cropId = 'Select a crop';
  if (!form.marketId) errs.marketId = 'Select a market';
  if (!form.condition) errs.condition = 'Select condition';
  const target = Number(form.targetPrice);
  if (!form.targetPrice || isNaN(target) || target <= 0) {
    errs.targetPrice = 'Target price must be positive (> 0)';
  }
  return errs;
}

export default function AlertsScreen({ currentUser, onTriggeredCountChange }) {
  const [alerts, setAlerts]   = useState([]);
  const [crops, setCrops]     = useState([]);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ cropId: '', marketId: '', condition: 'above', targetPrice: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]     = useState(false);
  const [formApiError, setFormApiError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m, p] = await Promise.all([
        getCrops(), getMarkets(), getPrices()
      ]);
      setCrops(c); setMarkets(m); setPrices(p);

      // Re-evaluate user alerts against current prices and persist
      await evaluateUserAlerts(currentUser.id, p);

      // Fetch the updated alerts from API
      const userAlerts = await getAlertsByUser(currentUser.id);
      setAlerts(userAlerts);

      const activeTriggeredCount = userAlerts.filter(a => a.active && a.triggered).length;
      if (onTriggeredCountChange) {
        onTriggeredCountChange(activeTriggeredCount);
      }
    } catch (err) {
      setError(err.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, onTriggeredCountChange]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getCropName   = id => crops.find(c => c.id === id)?.name   || id;
  const getMarketName = id => markets.find(m => m.id === id)?.name  || id;
  const getCropUnit   = id => crops.find(c => c.id === id)?.unit    || '';

  const resetForm = () => {
    setForm({ cropId: '', marketId: '', condition: 'above', targetPrice: '' });
    setFormErrors({}); setFormApiError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = validateAlert(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormApiError('');
    try {
      await createAlert({
        userId: currentUser.id,
        cropId: form.cropId,
        marketId: form.marketId,
        condition: form.condition,
        targetPrice: Number(form.targetPrice),
        active: true,
        triggered: false,
      });
      setShowForm(false);
      resetForm();
      await loadAll();
    } catch (err) {
      setFormApiError(err.message || 'Failed to create alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (alert) => {
    try {
      const newActive = !alert.active;
      // Inactive alerts never trigger; clear triggered if deactivating
      const newTriggered = newActive ? alert.triggered : false;
      await updateAlert(alert.id, { active: newActive, triggered: newTriggered });
      await loadAll();
    } catch (err) { alert(`Error updating alert: ${err.message}`); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await deleteAlert(id);
      await loadAll();
    } catch (err) { alert(err.message); }
  };

  // Get latest price for display
  const getLatestPrice = (cropId, marketId) => {
    const p = prices
      .filter(p => p.cropId === cropId && p.marketId === marketId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return p ? p.price : null;
  };

  const triggeredAlerts = alerts.filter(a => a.triggered && a.active);

  return (
    <div className="screen">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <h2 className="screen-title" style={{ marginBottom: 0 }}>
            Price Alerts
            {triggeredAlerts.length > 0 && (
              <span className="pill pill-amber" style={{ marginLeft: '.5rem', verticalAlign: 'middle' }}>
                {triggeredAlerts.length} triggered
              </span>
            )}
          </h2>
          <DemoPriceBadge label="Demo Rates" />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Alert
        </button>
      </div>

      {/* Create Alert Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Price Alert</h2>
            <form onSubmit={handleCreate} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="al-crop">Crop</label>
                <select id="al-crop" className={`form-control ${formErrors.cropId ? 'error' : ''}`}
                  value={form.cropId} onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}>
                  <option value="">Select crop…</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.cropId && <p className="form-error">{formErrors.cropId}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="al-mkt">Market</label>
                <select id="al-mkt" className={`form-control ${formErrors.marketId ? 'error' : ''}`}
                  value={form.marketId} onChange={e => setForm(f => ({ ...f, marketId: e.target.value }))}>
                  <option value="">Select market…</option>
                  {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {formErrors.marketId && <p className="form-error">{formErrors.marketId}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="al-cond">Trigger Rule</label>
                  <select id="al-cond" className={`form-control ${formErrors.condition ? 'error' : ''}`}
                    value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    <option value="above">Above (Price ≥ Target)</option>
                    <option value="below">Below (Price ≤ Target)</option>
                  </select>
                  {formErrors.condition && <p className="form-error">{formErrors.condition}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="al-price">Target Price (₨)</label>
                  <input id="al-price" className={`form-control ${formErrors.targetPrice ? 'error' : ''}`}
                    type="number" min="1" placeholder="e.g. 2000"
                    value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} />
                  {formErrors.targetPrice && <p className="form-error">{formErrors.targetPrice}</p>}
                </div>
              </div>

              {formApiError && (
                <div style={{ background: 'var(--red-pale)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '.5rem .75rem', fontSize: '.8rem', color: 'var(--red)', marginBottom: '.6rem' }}>
                  ⚠️ {formApiError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="state-box"><div className="spinner" /><p className="state-text">Checking price alerts…</p></div>}
      {error && !loading && (
        <div className="state-box">
          <span className="state-icon">⚠️</span>
          <p className="state-text">{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadAll}>Retry</button>
        </div>
      )}
      {!loading && !error && alerts.length === 0 && (
        <div className="state-box">
          <span className="state-icon">🔔</span>
          <p className="state-text">No alerts configured. Set an alert to be notified when rates cross your target price.</p>
        </div>
      )}

      {!loading && !error && alerts.map(alert => {
        const latestPrice = getLatestPrice(alert.cropId, alert.marketId);
        const cropUnit    = getCropUnit(alert.cropId);
        return (
          <div key={alert.id} className={`alert-card ${alert.triggered && alert.active ? 'triggered' : ''}`} role="article">
            <div className="alert-header">
              <span className="alert-title">
                {getCropName(alert.cropId)} @ {getMarketName(alert.marketId)}
              </span>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                {alert.triggered && alert.active && (
                  <span className="pill pill-amber">🔔 Triggered</span>
                )}
                <label className="toggle-switch" title={alert.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                  <input
                    type="checkbox"
                    checked={alert.active}
                    onChange={() => handleToggleActive(alert)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
            <div className="alert-body">
              <div>
                Condition: Price {alert.condition === 'above' ? '≥' : '≤'} <strong>₨{fmt(alert.targetPrice)}/{cropUnit}</strong>
              </div>
              <div style={{ marginTop: '.25rem' }}>
                Latest Price in Mandi:{' '}
                {latestPrice != null ? (
                  <strong>₨{fmt(latestPrice)}/{cropUnit}</strong>
                ) : (
                  <span style={{ color: 'var(--gray-400)' }}>No recent data</span>
                )}
              </div>
              <div style={{ marginTop: '.25rem', fontSize: '.75rem', color: alert.active ? 'var(--green)' : 'var(--gray-400)' }}>
                Status: {alert.active ? '● Active' : '○ Inactive (will not trigger)'}
              </div>
            </div>
            <div className="alert-actions">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(alert.id)} aria-label="Delete alert">
                🗑️ Delete Alert
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
