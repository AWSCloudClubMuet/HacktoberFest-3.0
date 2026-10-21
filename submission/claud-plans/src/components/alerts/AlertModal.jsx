import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { validateAlert } from '../../utils/validators';
import { Loader2, BellRing } from 'lucide-react';

export const AlertModal = ({ isOpen, onClose, onSave, crops = [], markets = [] }) => {
  const [formData, setFormData] = useState({
    cropId: crops[0]?.id || 'crp-wheat',
    cropName: crops[0]?.name || 'Wheat (Gandum)',
    marketId: markets[0]?.id || 'mkt-hyd',
    marketName: markets[0]?.shortName || 'Hyderabad Mandi',
    condition: 'above',
    targetPrice: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCropChange = (cropId) => {
    const selected = crops.find((c) => c.id === cropId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        cropId: selected.id,
        cropName: selected.name
      }));
    }
  };

  const handleMarketChange = (marketId) => {
    const selected = markets.find((m) => m.id === marketId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        marketId: selected.id,
        marketName: selected.shortName || selected.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateAlert(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        targetPrice: Number(formData.targetPrice)
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create alert' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Price Alert"
      subtitle="Receive real-time notifications when market prices hit your target"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        {/* Crop Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Crop</label>
          <select
            value={formData.cropId}
            onChange={(e) => handleCropChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mandi Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Mandi / Market</label>
          <select
            value={formData.marketId}
            onChange={(e) => handleMarketChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Condition */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Trigger Condition</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, condition: 'above' })}
              className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                formData.condition === 'above'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-earth-300 bg-white text-slate-600 hover:bg-earth-50'
              }`}
            >
              📈 Price Rises Above
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, condition: 'below' })}
              className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                formData.condition === 'below'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm'
                  : 'border-earth-300 bg-white text-slate-600 hover:bg-earth-50'
              }`}
            >
              📉 Price Drops Below
            </button>
          </div>
        </div>

        {/* Target Price */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Price (PKR)</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 4200"
            value={formData.targetPrice}
            onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.targetPrice ? 'border-rose-500' : 'border-earth-300'
            } bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-500`}
          />
          {errors.targetPrice && <p className="text-rose-500 text-xs mt-1">{errors.targetPrice}</p>}
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
            Set Alert Rule
          </button>
        </div>
      </form>
    </Modal>
  );
};
