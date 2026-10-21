import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SINDH_DISTRICTS, STANDARD_UNITS } from '../../utils/sindhLocations';
import { validateListing } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ListingModal = ({ isOpen, onClose, onSave, editingListing = null, crops = [] }) => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    cropId: '',
    cropName: '',
    category: 'Grains',
    variety: '',
    quantity: '',
    unit: '40kg maund',
    pricePerUnit: '',
    district: currentUser?.district || 'Hyderabad',
    marketLocation: '',
    description: '',
    harvestDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingListing) {
      setFormData({
        cropId: editingListing.cropId || '',
        cropName: editingListing.cropName || '',
        category: editingListing.category || 'Grains',
        variety: editingListing.variety || '',
        quantity: editingListing.quantity || '',
        unit: editingListing.unit || '40kg maund',
        pricePerUnit: editingListing.pricePerUnit || '',
        district: editingListing.district || currentUser?.district || 'Hyderabad',
        marketLocation: editingListing.marketLocation || '',
        description: editingListing.description || '',
        harvestDate: editingListing.harvestDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        cropId: crops[0]?.id || 'crp-wheat',
        cropName: crops[0]?.name || 'Wheat (Gandum)',
        category: crops[0]?.category || 'Grains',
        variety: '',
        quantity: '',
        unit: crops[0]?.unit || '40kg maund',
        pricePerUnit: '',
        district: currentUser?.district || 'Hyderabad',
        marketLocation: '',
        description: '',
        harvestDate: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [editingListing, isOpen, currentUser, crops]);

  const handleCropChange = (cropId) => {
    const selected = crops.find((c) => c.id === cropId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        cropId: selected.id,
        cropName: selected.name,
        category: selected.category,
        unit: selected.unit
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateListing(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        pricePerUnit: Number(formData.pricePerUnit),
        userId: currentUser.id,
        farmerName: currentUser.name,
        farmerPhone: currentUser.phone
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save listing' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingListing ? 'Edit Produce Listing' : 'Post New Harvest to Mandi'}
      subtitle={editingListing ? 'Update price, quantity or batch details' : 'Directly connect with Sindh buyers and commission agents'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        {/* Crop Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Crop</label>
          <select
            value={formData.cropId}
            onChange={(e) => handleCropChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>
        </div>

        {/* Variety / Quality Specifier */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Variety / Grade <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Fakhr-e-Bhakkar, Sindh-1, Nasarpur Red"
            value={formData.variety}
            onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
          />
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Quantity</label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 150"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.quantity ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500`}
            />
            {errors.quantity && <p className="text-rose-500 text-xs mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Measuring Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Asking Price & Harvest Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asking Rate (PKR / unit)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 4100"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.pricePerUnit ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500`}
            />
            {errors.pricePerUnit && <p className="text-rose-500 text-xs mt-1">{errors.pricePerUnit}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Harvest Date</label>
            <input
              type="date"
              value={formData.harvestDate}
              onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
            />
          </div>
        </div>

        {/* District and Farm Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sindh District</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
            >
              {SINDH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch / Farm Point</label>
            <input
              type="text"
              placeholder="e.g. Tando Jam bypass"
              value={formData.marketLocation}
              onChange={(e) => setFormData({ ...formData, marketLocation: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.marketLocation ? 'border-rose-500' : 'border-earth-300'
              } bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500`}
            />
            {errors.marketLocation && <p className="text-rose-500 text-xs mt-1">{errors.marketLocation}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Batch Notes / Condition</label>
          <textarea
            rows="2"
            placeholder="e.g. Sun-dried wheat with minimal moisture, bagged in clean sacks ready for dispatch."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-earth-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white font-semibold rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingListing ? 'Save Changes' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
