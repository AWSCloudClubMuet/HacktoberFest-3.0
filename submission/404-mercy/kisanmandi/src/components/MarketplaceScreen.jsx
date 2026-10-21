import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCrops, getMarkets, getActiveListings, getPrices,
  createListing, updateListing, deleteListing, getListing
} from '../services/api';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

const GRADES = ['A', 'B', 'C'];

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  if (digits.startsWith('92')) return digits;
  return '92' + digits;
}

function calcPriceLabel(askingPrice, avgMarketPrice) {
  if (!avgMarketPrice || avgMarketPrice === 0) return { label: 'Market comparison unavailable', cls: 'gray' };
  const pct = ((askingPrice - avgMarketPrice) / avgMarketPrice) * 100;
  if (pct < -5) return { label: `Below Market (${pct.toFixed(1)}%)`, cls: 'green' };
  if (pct > 5)  return { label: `Above Market (+${pct.toFixed(1)}%)`, cls: 'red' };
  return { label: `At Market (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`, cls: 'amber' };
}

function todayStr() {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().split('T')[0];
}

function validateListing(form) {
  const errs = {};
  if (!form.cropId) errs.cropId = 'Select a crop';
  if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Quantity must be > 0';
  if (!form.askingPrice || Number(form.askingPrice) <= 0) errs.askingPrice = 'Price must be > 0';
  if (!form.district.trim()) errs.district = 'Enter district';
  if (!form.grade) errs.grade = 'Select grade';
  if (!form.availableFrom) errs.availableFrom = 'Select date';
  else if (form.availableFrom < todayStr()) errs.availableFrom = 'Date must be today or later';
  if (!form.contactPhone.trim()) errs.contactPhone = 'Enter phone';
  else if (!/^03[0-9]{9}$/.test(form.contactPhone.trim())) errs.contactPhone = 'Valid Pakistani mobile (e.g. 03001234567)';
  return errs;
}

const DISTRICTS = [
  'Hyderabad','Sukkur','Larkana','Mirpurkhas','Nawabshah',
  'Karachi','Thatta','Badin','Khairpur','Jacobabad',
  'Shikarpur','Dadu','Sanghar','Tharparkar',
];

export default function MarketplaceScreen({ currentUser }) {
  const [crops, setCrops]         = useState([]);
  const [markets, setMarkets]     = useState([]);
  const [listings, setListings]   = useState([]);
  const [prices, setPrices]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [search, setSearch]       = useState('');
  const [filterCrop, setFilterCrop]   = useState('');
  const [filterDist, setFilterDist]   = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [sortMode, setSortMode]   = useState('newest');

  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({
    cropId: '', quantity: '', askingPrice: '', district: '',
    grade: '', availableFrom: todayStr(), contactPhone: currentUser.phone || '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]       = useState(false);
  const [formApiError, setFormApiError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m, l, p] = await Promise.all([
        getCrops(), getMarkets(), getActiveListings(), getPrices()
      ]);
      setCrops(c); setMarkets(m); setListings(l); setPrices(p);
    } catch (err) {
      setError(err.message || 'Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build avg market price per crop (across all markets, latest date)
  const avgMarketPrices = useCallback(() => {
    const map = {};
    crops.forEach(crop => {
      const cropPrices = prices.filter(p => p.cropId === crop.id);
      if (!cropPrices.length) { map[crop.id] = null; return; }
      // Get latest date per market
      const byMarket = {};
      cropPrices.forEach(p => {
        if (!byMarket[p.marketId] || p.date > byMarket[p.marketId].date) byMarket[p.marketId] = p;
      });
      const vals = Object.values(byMarket).map(p => p.price).filter(Boolean);
      map[crop.id] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    });
    return map;
  }, [crops, prices]);

  const avgMap = avgMarketPrices();

  const getCropName = (id) => crops.find(c => c.id === id)?.name || id;
  const getCropUnit = (id) => crops.find(c => c.id === id)?.unit || '';

  let filtered = listings.filter(l => {
    const name = getCropName(l.cropId);
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchCrop  = !filterCrop  || l.cropId    === filterCrop;
    const matchDist  = !filterDist  || l.district  === filterDist;
    const matchGrade = !filterGrade || l.grade      === filterGrade;
    return matchSearch && matchCrop && matchDist && matchGrade;
  });

  if (sortMode === 'newest') {
    filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    filtered = [...filtered].sort((a, b) => a.askingPrice - b.askingPrice);
  }

  const resetForm = () => {
    setForm({ cropId: '', quantity: '', askingPrice: '', district: '', grade: '', availableFrom: todayStr(), contactPhone: currentUser.phone || '' });
    setFormErrors({});
    setFormApiError('');
    setEditId(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (listing) => {
    setForm({
      cropId: listing.cropId,
      quantity: String(listing.quantity),
      askingPrice: String(listing.askingPrice),
      district: listing.district,
      grade: listing.grade,
      availableFrom: listing.availableFrom,
      contactPhone: listing.contactPhone,
    });
    setFormErrors({});
    setFormApiError('');
    setEditId(listing.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateListing(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormApiError('');
    try {
      if (editId) {
        // Revalidate ownership before write
        const existing = await getListing(editId);
        if (existing.sellerId !== currentUser.id) throw new Error('You do not own this listing.');
        await updateListing(editId, {
          cropId: form.cropId,
          quantity: Number(form.quantity),
          askingPrice: Number(form.askingPrice),
          district: form.district.trim(),
          grade: form.grade,
          availableFrom: form.availableFrom,
          contactPhone: form.contactPhone.trim(),
        });
      } else {
        await createListing({
          sellerId: currentUser.id,
          cropId: form.cropId,
          quantity: Number(form.quantity),
          askingPrice: Number(form.askingPrice),
          district: form.district.trim(),
          grade: form.grade,
          availableFrom: form.availableFrom,
          contactPhone: form.contactPhone.trim(),
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
      setShowForm(false);
      resetForm();
      await loadData();
    } catch (err) {
      setFormApiError(err.message || 'Failed to save listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleSold = async (id) => {
    if (!window.confirm('Mark this listing as Sold?')) return;
    try {
      const existing = await getListing(id);
      if (existing.sellerId !== currentUser.id) { alert('You do not own this listing.'); return; }
      await updateListing(id, { status: 'sold' });
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      const existing = await getListing(id);
      if (existing.sellerId !== currentUser.id) { alert('You do not own this listing.'); return; }
      await deleteListing(id);
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const isFarmer = currentUser.role === 'farmer';

  return (
    <div className="screen">
      <div className="section-header">
        <h2 className="screen-title" style={{ marginBottom: 0 }}>Marketplace</h2>
        {isFarmer && (
          <button className="btn btn-primary btn-sm" onClick={openCreate} aria-label="List produce">
            + List Produce
          </button>
        )}
      </div>

      {/* Listing Form Modal */}
      {showForm && isFarmer && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? 'Edit Listing' : 'List Produce'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="lc-crop">Crop</label>
                <select id="lc-crop" className={`form-control ${formErrors.cropId ? 'error' : ''}`}
                  value={form.cropId} onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}>
                  <option value="">Select crop…</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
                </select>
                {formErrors.cropId && <p className="form-error">{formErrors.cropId}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="lc-qty">Quantity</label>
                  <input id="lc-qty" className={`form-control ${formErrors.quantity ? 'error' : ''}`}
                    type="number" min="1" placeholder="e.g. 100"
                    value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  {formErrors.quantity && <p className="form-error">{formErrors.quantity}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lc-price">Asking Price (₨)</label>
                  <input id="lc-price" className={`form-control ${formErrors.askingPrice ? 'error' : ''}`}
                    type="number" min="1" placeholder="e.g. 1800"
                    value={form.askingPrice} onChange={e => setForm(f => ({ ...f, askingPrice: e.target.value }))} />
                  {formErrors.askingPrice && <p className="form-error">{formErrors.askingPrice}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lc-dist">District</label>
                <select id="lc-dist" className={`form-control ${formErrors.district ? 'error' : ''}`}
                  value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {formErrors.district && <p className="form-error">{formErrors.district}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="lc-grade">Grade</label>
                  <select id="lc-grade" className={`form-control ${formErrors.grade ? 'error' : ''}`}
                    value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                    <option value="">Grade…</option>
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                  {formErrors.grade && <p className="form-error">{formErrors.grade}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lc-date">Available From</label>
                  <input id="lc-date" className={`form-control ${formErrors.availableFrom ? 'error' : ''}`}
                    type="date" min={todayStr()}
                    value={form.availableFrom} onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))} />
                  {formErrors.availableFrom && <p className="form-error">{formErrors.availableFrom}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lc-phone">Contact Phone</label>
                <input id="lc-phone" className={`form-control ${formErrors.contactPhone ? 'error' : ''}`}
                  type="tel" placeholder="03001234567"
                  value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                {formErrors.contactPhone && <p className="form-error">{formErrors.contactPhone}</p>}
              </div>

              {formApiError && (
                <div style={{ background: 'var(--red-pale)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '.5rem .75rem', fontSize: '.8rem', color: 'var(--red)', marginBottom: '.75rem' }}>
                  ⚠️ {formApiError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update Listing' : 'Submit Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <div className="search-input" style={{ flex: 2, minWidth: 130 }}>
          <input className="form-control" type="text" placeholder="Search crop…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search listings" />
        </div>
        <select className="form-control" value={filterCrop} onChange={e => setFilterCrop(e.target.value)} aria-label="Filter by crop">
          <option value="">All crops</option>
          {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <select className="form-control" value={filterDist} onChange={e => setFilterDist(e.target.value)} aria-label="Filter by district">
          <option value="">All districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-control" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} aria-label="Filter by grade">
          <option value="">All grades</option>
          {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <select className="form-control" value={sortMode} onChange={e => setSortMode(e.target.value)} aria-label="Sort listings">
          <option value="newest">Newest first</option>
          <option value="price">Price ↑</option>
        </select>
      </div>

      {loading && (
        <div className="state-box"><div className="spinner" /><p className="state-text">Loading listings…</p></div>
      )}
      {error && !loading && (
        <div className="state-box">
          <span className="state-icon">⚠️</span>
          <p className="state-text">{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>Retry</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="state-box">
          <span className="state-icon">🛒</span>
          <p className="state-text">No active listings found.</p>
        </div>
      )}

      {!loading && !error && filtered.map(listing => {
        const cropName = getCropName(listing.cropId);
        const cropUnit = getCropUnit(listing.cropId);
        const avg = avgMap[listing.cropId];
        const label = calcPriceLabel(listing.askingPrice, avg);
        const isOwner = listing.sellerId === currentUser.id;

        return (
          <div key={listing.id} className="listing-card" role="article" aria-label={`Listing: ${cropName}`}>
            <div className="listing-card-header">
              <div>
                <div className="listing-crop">{cropName}</div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.2rem' }}>
                  <span className="pill pill-green">Grade {listing.grade}</span>
                  <span className={`pill pill-${label.cls}`}>{label.label}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="listing-price">₨{fmt(listing.askingPrice)}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--gray-500)' }}>per {cropUnit}</div>
              </div>
            </div>

            <div className="listing-meta">
              <span className="listing-meta-item">📍 {listing.district}</span>
              <span className="listing-meta-item">📦 {fmt(listing.quantity)} {cropUnit}</span>
              <span className="listing-meta-item">📅 From {listing.availableFrom}</span>
              <span className="listing-meta-item">📞 {listing.contactPhone}</span>
            </div>

            <div className="listing-actions">
              <a className="btn btn-secondary btn-sm" href={`tel:${listing.contactPhone}`} aria-label={`Call ${listing.contactPhone}`}>
                📞 Call
              </a>
              <a
                className="btn btn-secondary btn-sm"
                href={`https://wa.me/${normalizePhone(listing.contactPhone)}`}
                target="_blank" rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
              >
                💬 WhatsApp
              </a>
              {isFarmer && isOwner && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(listing)} aria-label="Edit listing">✏️ Edit</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSold(listing.id)} aria-label="Mark as sold">✅ Sold</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(listing.id)} aria-label="Delete listing">🗑️ Delete</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

