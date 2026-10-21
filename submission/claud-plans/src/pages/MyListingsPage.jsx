import React, { useState, useEffect, useCallback } from 'react';
import { getListings, getCrops, createListing, updateListing, deleteListing } from '../api.js';
import { validateListing, validateOwnership } from '../logic.js';
import { useAuth } from '../context/AuthContext';
import { SINDH_DISTRICTS } from '../utils/sindhLocations';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Calendar,
  AlertCircle,
  Tag,
  ShieldAlert
} from 'lucide-react';

export const MyListingsPage = () => {
  const { currentUser, isFarmer } = useAuth();

  const [listings, setListings] = useState([]);
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    crop_id: '',
    quantity: '',
    asking_price: '',
    district: currentUser?.district || 'Hyderabad',
    grade: 'A',
    available_from: todayStr,
    phone: currentUser?.phone || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [allListings, allCrops] = await Promise.all([
        getListings({ user_id: currentUser.id }),
        getCrops()
      ]);
      setListings(allListings || []);
      setCrops(allCrops || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setError(err.message || 'Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingListing(null);
    setFormData({
      crop_id: crops[0]?.id || '',
      quantity: '',
      asking_price: '',
      district: currentUser?.district || 'Hyderabad',
      grade: 'A',
      available_from: todayStr,
      phone: currentUser?.phone || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (listing) => {
    // Ownership safeguard check
    if (!validateOwnership(listing, currentUser?.id)) {
      alert('Security violation: You can only edit your own listings.');
      return;
    }
    setEditingListing(listing);
    setFormData({
      crop_id: listing.crop_id,
      quantity: String(listing.quantity),
      asking_price: String(listing.asking_price),
      district: listing.district,
      grade: listing.grade || 'A',
      available_from: listing.available_from,
      phone: listing.phone || currentUser?.phone || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Submit Listing Form (POST or PATCH)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict validation using src/logic.js validateListing
    const { isValid, errors: validationErrors } = validateListing(formData, todayStr);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (editingListing) {
        // Ownership Safeguard
        if (!validateOwnership(editingListing, currentUser.id)) {
          throw new Error('Ownership verification failed: listing does not belong to you.');
        }

        const payload = {
          crop_id: formData.crop_id,
          quantity: Number(formData.quantity),
          asking_price: Number(formData.asking_price),
          district: formData.district,
          grade: formData.grade,
          available_from: formData.available_from,
          phone: formData.phone
        };

        const updated = await updateListing(editingListing.id, payload);
        setListings((prev) =>
          prev.map((l) => (l.id === editingListing.id ? { ...l, ...payload } : l))
        );
      } else {
        // Create new listing
        const payload = {
          id: `lst-${Date.now()}`,
          user_id: currentUser.id,
          crop_id: formData.crop_id,
          quantity: Number(formData.quantity),
          asking_price: Number(formData.asking_price),
          district: formData.district,
          grade: formData.grade,
          available_from: formData.available_from,
          status: 'Active',
          phone: formData.phone
        };

        const created = await createListing(payload);
        setListings((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save listing' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark as Sold (PATCH status to Sold)
  const handleToggleSold = async (listing) => {
    // Ownership safeguard
    if (!validateOwnership(listing, currentUser?.id)) {
      alert('Security violation: You can only alter your own listings.');
      return;
    }

    const nextStatus = listing.status === 'Active' ? 'Sold' : 'Active';
    try {
      await updateListing(listing.id, { status: nextStatus });
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus } : l))
      );
    } catch (err) {
      alert(`Failed to update listing: ${err.message}`);
    }
  };

  // Delete Listing
  const handleDelete = async (listing) => {
    // Ownership safeguard
    if (!validateOwnership(listing, currentUser?.id)) {
      alert('Security violation: You can only delete your own listings.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await deleteListing(listing.id);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      alert(`Failed to delete listing: ${err.message}`);
    }
  };

  if (!isFarmer) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-earth-300 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Farmer-Only Area</h2>
        <p className="text-xs text-slate-500">
          Listing farm produce for sale is available to registered Sindh farmers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">My Listings</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {listings.length} Listed
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Post and manage your farm batches with live market price validation
          </p>
        </div>

        <button
          type="button"
          id="post-listing-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Listing</span>
        </button>
      </div>

      {/* Listings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">No Produce Listed Yet</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish your first crop listing to make it available to wholesale buyers on the Marketplace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Post Your First Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const crop = crops.find((c) => c.id === listing.crop_id);
            const isSold = listing.status === 'Sold';

            return (
              <div
                key={listing.id}
                id={`my-listing-${listing.id}`}
                className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                  isSold
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-white border-earth-300 shadow-sm'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-slate-900 text-sm">
                        {crop?.name || 'Produce'}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Grade {listing.grade}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                          isSold ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      Quantity: <strong className="text-slate-800">{listing.quantity}</strong> units (40 kg maunds)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-emerald-900 leading-tight">
                      Rs. {Number(listing.asking_price).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">per 40 kg</div>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-earth-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>From: {listing.available_from}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{listing.phone || currentUser?.phone}</span>
                  </div>
                </div>

                {/* Owner Actions: Mark Sold, Edit, Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-earth-200 text-xs">
                  <button
                    type="button"
                    id={`mark-sold-${listing.id}`}
                    onClick={() => handleToggleSold(listing)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      isSold
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSold ? 'Relist as Active' : 'Mark Sold'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id={`edit-listing-${listing.id}`}
                      onClick={() => handleOpenEdit(listing)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-earth-100"
                      title="Edit listing"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-listing-${listing.id}`}
                      onClick={() => handleDelete(listing)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                      title="Delete listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Form Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-[420px] bg-white rounded-3xl p-5 shadow-2xl border border-earth-300 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                {editingListing ? 'Edit Produce Listing' : 'Post New Produce Listing'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-earth-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errors.form && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Crop selection */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Crop</label>
                <select
                  id="listing-crop-select"
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
                {errors.crop_id && <p className="text-rose-500 text-[10px] mt-0.5">{errors.crop_id}</p>}
              </div>

              {/* Quantity (in 40 kg units) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Quantity (in 40 kg units) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="listing-quantity-input"
                  min="1"
                  placeholder="e.g. 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.quantity ? 'border-rose-500' : 'border-earth-300'
                  } bg-white font-bold text-slate-800`}
                />
                {errors.quantity && <p className="text-rose-500 text-[10px] mt-0.5">{errors.quantity}</p>}
              </div>

              {/* Asking Price */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Asking Price (PKR per 40 kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="listing-price-input"
                  min="1"
                  placeholder="e.g. 4200"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.asking_price ? 'border-rose-500' : 'border-earth-300'
                  } bg-white font-bold text-slate-800`}
                />
                {errors.asking_price && <p className="text-rose-500 text-[10px] mt-0.5">{errors.asking_price}</p>}
              </div>

              {/* Grade (A/B/C) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Crop Grade (A / B / C) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['A', 'B', 'C'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      id={`grade-btn-${g}`}
                      onClick={() => setFormData({ ...formData, grade: g })}
                      className={`py-2 rounded-xl border font-black text-center transition-all ${
                        formData.grade === g
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      Grade {g}
                    </button>
                  ))}
                </div>
                {errors.grade && <p className="text-rose-500 text-[10px] mt-0.5">{errors.grade}</p>}
              </div>

              {/* Available From (Date) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Available From (Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="listing-date-input"
                  value={formData.available_from}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.available_from ? 'border-rose-500' : 'border-earth-300'
                  } bg-white font-semibold text-slate-800`}
                />
                {errors.available_from && (
                  <p className="text-rose-500 text-[10px] mt-0.5">{errors.available_from}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">District</label>
                <select
                  id="listing-district-select"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800"
                >
                  {SINDH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && <p className="text-rose-500 text-[10px] mt-0.5">{errors.district}</p>}
              </div>

              {/* Contact Phone (prefilled from user) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  id="listing-phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0300-1234501"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.phone ? 'border-rose-500' : 'border-earth-300'
                  } bg-white font-semibold text-slate-800`}
                />
                {errors.phone && <p className="text-rose-500 text-[10px] mt-0.5">{errors.phone}</p>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="listing-submit-btn"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingListing ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
