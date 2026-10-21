import React, { useState, useEffect } from 'react';
import { Alert, Crop, Market, User, PriceRecord } from '../types';
import { formatPKR } from '../lib/formatters';
import { Bell, ArrowUpRight, ArrowDownRight, Info, Check, AlertCircle } from 'lucide-react';

interface AlertFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alertData: Omit<Alert, 'id' | 'createdAt' | 'lastEvaluatedPrice' | 'lastTriggeredAt'>) => Promise<void>;
  crops: Crop[];
  markets: Market[];
  currentUser: User;
  allPrices: PriceRecord[];
  initialCropId?: string;
  initialMarketId?: string;
}

export const AlertFormModal: React.FC<AlertFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  crops,
  markets,
  currentUser,
  allPrices,
  initialCropId,
  initialMarketId,
}) => {
  const [cropId, setCropId] = useState('');
  const [marketId, setMarketId] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCropId(initialCropId || crops[0]?.id || '');
    setMarketId(initialMarketId || markets[0]?.id || '');
    setCondition('above');
    setErrors({});
  }, [initialCropId, initialMarketId, crops, markets, isOpen]);

  // Find latest price for currently selected crop & market
  const latestMatchingPrice = allPrices
    .filter((p) => p.cropId === cropId && p.marketId === marketId)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.price;

  // Set default target price near current price
  useEffect(() => {
    if (latestMatchingPrice && (targetPrice === '' || targetPrice === 0)) {
      setTargetPrice(condition === 'above' ? latestMatchingPrice + 100 : latestMatchingPrice - 100);
    }
  }, [latestMatchingPrice, condition]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!cropId) errs.cropId = 'Please select a crop.';
    if (!marketId) errs.marketId = 'Please select a market.';
    if (targetPrice === '' || targetPrice <= 0) {
      errs.targetPrice = 'Target price must be a positive number greater than 0.';
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
        userId: currentUser.id,
        cropId,
        marketId,
        condition,
        targetPrice: Number(targetPrice),
        isEnabled: true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create alert:', err);
      setErrors({ form: 'Failed to create alert. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-[#E8E7DF] relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[#2D452B]">Set Price Threshold Alert</h3>
            <p className="text-xs text-[#767B70]">Monitor when mandi quotations cross your selling target</p>
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
          {/* Crop select */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Crop *
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

          {/* Market select */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Mandi Market *
            </label>
            <select
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#4A6B42] cursor-pointer"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.district})
                </option>
              ))}
            </select>
            {errors.marketId && <p className="text-xs text-[#B3261E] mt-1">{errors.marketId}</p>}
          </div>

          {/* Current mandi price indicator */}
          {latestMatchingPrice && (
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E7DF] flex items-center justify-between">
              <span className="text-[#767B70]">Current Mandi Quotation:</span>
              <span className="font-bold text-[#2D452B] tabular-nums">{formatPKR(latestMatchingPrice)}</span>
            </div>
          )}

          {/* Condition: Above vs Below */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Trigger Condition *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('above')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  condition === 'above'
                    ? 'border-[#4A6B42] bg-[#EEF2E8] text-[#2D452B]'
                    : 'border-[#E8E7DF] bg-[#FAF9F5] text-[#767B70] hover:bg-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#186F43]" />
                <span>Rises Above (≥)</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('below')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  condition === 'below'
                    ? 'border-[#4A6B42] bg-[#EEF2E8] text-[#2D452B]'
                    : 'border-[#E8E7DF] bg-[#FAF9F5] text-[#767B70] hover:bg-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-[#B3261E]" />
                <span>Drops Below (≤)</span>
              </button>
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="block font-medium text-[#767B70] mb-1">
              Target Threshold (PKR per 40 kg) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-[#767B70] font-semibold">
                PKR
              </span>
              <input
                type="number"
                min="1"
                step="10"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 4300"
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-12 pr-3 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#4A6B42]"
              />
            </div>
            {errors.targetPrice && <p className="text-xs text-[#B3261E] mt-1">{errors.targetPrice}</p>}
          </div>

          <div className="p-3 bg-[#EEF2E8]/60 rounded-xl border border-[#DCE8D3] flex items-start gap-2 text-[11px] text-[#666B60]">
            <Info className="w-4 h-4 text-[#4A6B42] shrink-0 mt-0.5" />
            <span>
              Alerts evaluate against latest loaded market prices on refresh. No external push/SMS notifications are sent.
            </span>
          </div>

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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Alert...' : 'Create Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
