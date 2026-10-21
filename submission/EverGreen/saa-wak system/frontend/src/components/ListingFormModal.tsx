import React, { useState, useEffect } from 'react';
import { Listing, Crop, Market, User } from '../types';
import { Check, AlertCircle } from 'lucide-react';

interface ListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Listing | null;
  crops: Crop[];
  markets: Market[];
  currentUser: User;
}

export const ListingFormModal: React.FC<ListingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  crops,
  markets,
  currentUser,
}) => {
  const isEditing = Boolean(initialData);

  const [cropId, setCropId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [grade, setGrade] = useState<'Grade A' | 'Grade B' | 'Export Quality' | 'Standard'>('Grade A');
  const [askingPricePerUnit, setAskingPricePerUnit] = useState<number | ''>('');
  const [marketId, setMarketId] = useState('');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'available' | 'reserved' | 'sold'>('available');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCropId(initialData.cropId);
      setQuantity(initialData.quantity);
      setGrade(initialData.grade);
      setAskingPricePerUnit(initialData.askingPricePerUnit);
      setMarketId(initialData.marketId);
      setDistrict(initialData.district);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
    } else {
      setCropId(crops[0]?.id || '');
      setQuantity(100);
      setGrade('Grade A');
      setAskingPricePerUnit(4200);
      setMarketId(markets[0]?.id || '');
      setDistrict(markets[0]?.district || 'Hyderabad');
      setDescription('');
      setStatus('available');
    }
    setErrors({});
  }, [initialData, crops, markets, isOpen]);

  const handleMarketChange = (mId: string) => {
    setMarketId(mId);
    const m = markets.find((item) => item.id === mId);
    if (m) {
      setDistrict(m.district);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!cropId) {
      errs.cropId = 'Please select a crop.';
    }
    if (quantity === '' || quantity <= 0) {
      errs.quantity = 'Quantity must be a positive number greater than 0.';
    }
    if (askingPricePerUnit === '' || askingPricePerUnit <= 0) {
      errs.askingPricePerUnit = 'Asking price must be a valid positive amount in PKR.';
    }
    if (!marketId) {
      errs.marketId = 'Please select a destination/reference market.';
    }
    if (!district.trim()) {
      errs.district = 'District location is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        sellerId: initialData?.sellerId || currentUser.id,
        cropId,
        quantity: Number(quantity),
        unit: '40 kg', // Standard canonical mandi unit
        grade,
        askingPricePerUnit: Number(askingPricePerUnit),
        marketId,
        district,
        description: description.trim(),
        contactMethod: currentUser.phone || '0300-1234001',
        status,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit listing:', error);
      setErrors({ form: 'An error occurred while saving the listing. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E8E7DF] relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <h3 className="font-bold text-base text-[#2D452B]">
              {isEditing ? 'Edit Produce Listing' : 'List New Produce for Sale'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#767B70] hover:text-[#2F332C] text-sm p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errors.form && (
          <div className="p-3 mb-4 bg-[#FDE8E8] text-[#B3261E] rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#2F332C]">
          {/* Crop Selector */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Select Crop *
            </label>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#4A6B42] cursor-pointer"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} {c.name} ({c.unit})
                </option>
              ))}
            </select>
            {errors.cropId && <p className="text-xs text-[#B3261E] mt-1">{errors.cropId}</p>}
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Volume (40 kg maunds) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 250"
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs tabular-nums focus:outline-none focus:border-[#4A6B42]"
              />
              {errors.quantity && <p className="text-xs text-[#B3261E] mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Standard Unit
              </label>
              <input
                type="text"
                disabled
                value="40 kg (maund)"
                className="w-full bg-[#EEF2E8] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs text-[#767B70] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Grade & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Quality Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Export Quality">Export Quality</option>
                <option value="Grade B">Grade B (Commercial)</option>
                <option value="Standard">Standard / Desi</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Listing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved / Under Offer</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Asking Price */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Asking Price (PKR per 40 kg) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-[#767B70] font-semibold">
                PKR
              </span>
              <input
                type="number"
                min="1"
                step="10"
                value={askingPricePerUnit}
                onChange={(e) => setAskingPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 4250"
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-12 pr-3 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#4A6B42]"
              />
            </div>
            {errors.askingPricePerUnit && (
              <p className="text-xs text-[#B3261E] mt-1">{errors.askingPricePerUnit}</p>
            )}
          </div>

          {/* Market & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Target / Nearby Mandi *
              </label>
              <select
                value={marketId}
                onChange={(e) => handleMarketChange(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.marketId && <p className="text-xs text-[#B3261E] mt-1">{errors.marketId}</p>}
            </div>

            <div>
              <label className="block font-medium text-[#767B70] mb-1">
                Farm District *
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42]"
              />
              {errors.district && <p className="text-xs text-[#B3261E] mt-1">{errors.district}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Harvest Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clean moisture-checked grain harvested from perennial canal land. Bagged in standard 40kg sacks."
              className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl p-3 text-xs focus:outline-none focus:border-[#4A6B42]"
            />
          </div>

          <div className="text-[11px] text-[#767B70]">
            Posting as: <strong className="text-[#2F332C]">{currentUser.displayName}</strong> ({currentUser.district}) · Demo: {currentUser.phone || '0300-1234001'}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#E8E7DF] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#767B70] hover:text-[#2F332C] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Update Listing' : 'Publish Produce'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
