import React, { useState, useEffect, useCallback } from 'react';
import {
  getListingsBySeller, getCrops, getMarkets, getPrices,
  updateListing, deleteListing, getListing, createListing
} from '../services/api';
import { uploadListingImage } from '../services/supabase';

function fmt(n) { return Number(n).toLocaleString('en-PK'); }

function getCropFallback(cropName) {
  const name = (cropName || '').toLowerCase();
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

const GRADES = ['A', 'B', 'C'];
const DISTRICTS = [
  'Hyderabad','Sukkur','Larkana','Mirpurkhas','Nawabshah',
  'Karachi','Thatta','Badin','Khairpur','Jacobabad',
  'Shikarpur','Dadu','Sanghar','Tharparkar',
];

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

export default function MyListingsScreen({ currentUser }) {
  const [listings, setListings] = useState([]);
  const [crops, setCrops]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({
    cropId: '', quantity: '', askingPrice: '', district: currentUser?.district || '',
    grade: '', availableFrom: todayStr(), contactPhone: currentUser?.phone || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [photoError, setPhotoError]     = useState('');
  const [uploading, setUploading]       = useState(false);
  const [formErrors, setFormErrors]     = useState({});
  const [saving, setSaving]             = useState(false);
  const [formApiError, setFormApiError] = useState('');

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const [l, c] = await Promise.all([
        getListingsBySeller(currentUser.id), getCrops()
      ]);
      setListings(l); setCrops(c);
    } catch (err) {
      setError(err.message || 'Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const getCropName = id => crops.find(c => c.id === id)?.name || id;
  const getCropUnit = id => crops.find(c => c.id === id)?.unit || '';

  const resetForm = () => {
    setForm({ cropId: '', quantity: '', askingPrice: '', district: currentUser?.district || '', grade: '', availableFrom: todayStr(), contactPhone: currentUser?.phone || '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError('');
    setFormErrors({});
    setFormApiError('');
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (listing) => {
    setForm({
      cropId: listing.cropId, quantity: String(listing.quantity), askingPrice: String(listing.askingPrice),
      district: listing.district, grade: listing.grade, availableFrom: listing.availableFrom, contactPhone: listing.contactPhone,
    });
    setSelectedFile(null);
    setPreviewUrl(listing.imageUrl || null);
    setPhotoError('');
    setFormErrors({});
    setFormApiError('');
    setEditId(listing.id);
    setShowForm(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image file size must be less than 5MB.');
      return;
    }
    setSelectedFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateListing(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormApiError('');
    try {
      let finalImageUrl = previewUrl;
      if (selectedFile) {
        setUploading(true);
        try {
          const uploadRes = await uploadListingImage(selectedFile, currentUser.id);
          finalImageUrl = typeof uploadRes === 'string' ? uploadRes : uploadRes?.url || previewUrl;
        } catch (uploadErr) {
          setPhotoError(uploadErr.message || 'Failed to upload photo.');
          setSaving(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      if (editId) {
        const existing = await getListing(editId);
        if (existing.sellerId !== currentUser.id) throw new Error('You do not own this listing.');
        await updateListing(editId, {
          cropId: form.cropId, quantity: Number(form.quantity), askingPrice: Number(form.askingPrice),
          district: form.district.trim(), grade: form.grade, availableFrom: form.availableFrom,
          contactPhone: form.contactPhone.trim(), imageUrl: finalImageUrl,
        });
      } else {
        await createListing({
          sellerId: currentUser.id, cropId: form.cropId, quantity: Number(form.quantity),
          askingPrice: Number(form.askingPrice), district: form.district.trim(), grade: form.grade,
          availableFrom: form.availableFrom, contactPhone: form.contactPhone.trim(),
          imageUrl: finalImageUrl,
          status: 'active', createdAt: new Date().toISOString(),
        });
      }
      setShowForm(false); resetForm(); await loadData();
    } catch (err) {
      setFormApiError(err.message || 'Failed to save listing.');
    } finally { setSaving(false); }
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
    if (!window.confirm('Delete this listing?')) return;
    try {
      const existing = await getListing(id);
      if (existing.sellerId !== currentUser.id) { alert('You do not own this listing.'); return; }
      await deleteListing(id);
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const active = listings.filter(l => l.status === 'active');
  const sold   = listings.filter(l => l.status === 'sold');

  return (
    <div className="screen">
      <div className="section-header">
        <h2 className="screen-title" style={{ marginBottom: 0 }}>My Listings</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Listing
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? 'Edit Listing' : 'New Listing'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="ml-crop">Crop</label>
                <select id="ml-crop" className={`form-control ${formErrors.cropId ? 'error' : ''}`}
                  value={form.cropId} onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}>
                  <option value="">Select crop…</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
                </select>
                {formErrors.cropId && <p className="form-error">{formErrors.cropId}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ml-qty">Quantity</label>
                  <input id="ml-qty" className={`form-control ${formErrors.quantity ? 'error' : ''}`}
                    type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  {formErrors.quantity && <p className="form-error">{formErrors.quantity}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ml-price">Asking Price (₨)</label>
                  <input id="ml-price" className={`form-control ${formErrors.askingPrice ? 'error' : ''}`}
                    type="number" min="1" value={form.askingPrice} onChange={e => setForm(f => ({ ...f, askingPrice: e.target.value }))} />
                  {formErrors.askingPrice && <p className="form-error">{formErrors.askingPrice}</p>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ml-dist">District</label>
                <select id="ml-dist" className={`form-control ${formErrors.district ? 'error' : ''}`}
                  value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {formErrors.district && <p className="form-error">{formErrors.district}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ml-grade">Grade</label>
                  <select id="ml-grade" className={`form-control ${formErrors.grade ? 'error' : ''}`}
                    value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                    <option value="">Grade…</option>
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                  {formErrors.grade && <p className="form-error">{formErrors.grade}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ml-date">Available From</label>
                  <input id="ml-date" className={`form-control ${formErrors.availableFrom ? 'error' : ''}`}
                    type="date" min={todayStr()} value={form.availableFrom}
                    onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))} />
                  {formErrors.availableFrom && <p className="form-error">{formErrors.availableFrom}</p>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ml-phone">Contact Phone</label>
                <input id="ml-phone" className={`form-control ${formErrors.contactPhone ? 'error' : ''}`}
                  type="tel" placeholder="03001234567" value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                {formErrors.contactPhone && <p className="form-error">{formErrors.contactPhone}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Produce Photo (Optional)</label>
                {previewUrl ? (
                  <div className="image-preview-wrap">
                    <img src={previewUrl} alt="Listing preview" className="image-preview-img" />
                    <button type="button" className="image-preview-remove" onClick={handleRemovePhoto} title="Remove image">
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-dropzone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <span style={{ fontSize: '1.4rem' }}>📷</span>
                    <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--green-dark)' }}>
                      Upload photo of your actual produce
                    </span>
                    <span style={{ fontSize: '.72rem', color: 'var(--gray-500)' }}>
                      JPG, PNG or WebP up to 5MB
                    </span>
                  </label>
                )}
                {photoError && <p className="form-error">{photoError}</p>}
              </div>

              {formApiError && (
                <div style={{ background: 'var(--red-pale)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '.5rem .75rem', fontSize: '.8rem', color: 'var(--red)', marginBottom: '.6rem' }}>
                  ⚠️ {formApiError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {uploading ? 'Uploading Photo…' : saving ? 'Saving…' : editId ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="state-box"><div className="spinner" /><p className="state-text">Loading your listings…</p></div>}
      {error && !loading && (
        <div className="state-box">
          <span className="state-icon">⚠️</span>
          <p className="state-text">{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>Retry</button>
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="state-box">
          <span className="state-icon">📋</span>
          <p className="state-text">You have no listings yet.</p>
        </div>
      )}

      {!loading && !error && active.length > 0 && (
        <>
          <h3 className="section-title">Active ({active.length})</h3>
          {active.map(listing => {
            const cropObj = crops.find(c => c.id === listing.cropId);
            const cropName = cropObj?.name || listing.cropId;
            const displayImg = listing.imageUrl || cropObj?.imageUrl || getCropFallback(cropName);
            const hasSellerPhoto = Boolean(listing.imageUrl);
            return (
              <div key={listing.id} className="listing-card" role="article">
                <div className="listing-img-wrap">
                  <img
                    src={displayImg}
                    alt={cropName}
                    className="listing-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = getCropFallback(cropName); }}
                  />
                  {hasSellerPhoto ? (
                    <span className="listing-img-badge badge-seller-photo">📷 Verified Seller Photo</span>
                  ) : (
                    <span className="listing-img-badge badge-reference-photo">🌾 Crop Reference Photo</span>
                  )}
                </div>

                <div className="listing-card-header">
                  <div>
                    <div className="listing-crop">{getCropName(listing.cropId)}</div>
                    <span className="pill pill-green">Grade {listing.grade}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="listing-price">₨{fmt(listing.askingPrice)}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--gray-500)' }}>/{getCropUnit(listing.cropId)}</div>
                  </div>
                </div>
                <div className="listing-meta">
                  <span className="listing-meta-item">📍 {listing.district}</span>
                  <span className="listing-meta-item">📦 {fmt(listing.quantity)} {getCropUnit(listing.cropId)}</span>
                  <span className="listing-meta-item">📅 From {listing.availableFrom}</span>
                </div>
                <div className="listing-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(listing)}>✏️ Edit</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSold(listing.id)}>✅ Mark Sold</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(listing.id)}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {!loading && !error && sold.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: '1rem' }}>Sold ({sold.length})</h3>
          {sold.map(listing => {
            const cropObj = crops.find(c => c.id === listing.cropId);
            const cropName = cropObj?.name || listing.cropId;
            const displayImg = listing.imageUrl || cropObj?.imageUrl || getCropFallback(cropName);
            const hasSellerPhoto = Boolean(listing.imageUrl);
            return (
              <div key={listing.id} className="listing-card" style={{ opacity: .7 }} role="article">
                <div className="listing-img-wrap">
                  <img
                    src={displayImg}
                    alt={cropName}
                    className="listing-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = getCropFallback(cropName); }}
                  />
                  {hasSellerPhoto ? (
                    <span className="listing-img-badge badge-seller-photo">📷 Verified Seller Photo</span>
                  ) : (
                    <span className="listing-img-badge badge-reference-photo">🌾 Crop Reference Photo</span>
                  )}
                </div>

                <div className="listing-card-header">
                  <div>
                    <div className="listing-crop">{getCropName(listing.cropId)}</div>
                    <span className="pill pill-gray">Sold</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-500)' }}>₨{fmt(listing.askingPrice)}</div>
                  </div>
                </div>
                <div className="listing-meta">
                  <span className="listing-meta-item">📦 {fmt(listing.quantity)} {getCropUnit(listing.cropId)}</span>
                  <span className="listing-meta-item">Grade {listing.grade}</span>
                </div>
                <div className="listing-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(listing.id)}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

