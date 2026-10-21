import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { InventoryItem, DonationType } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { HeartHandshake } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
}

const CASH_CATEGORIES = [
  'General Humanitarian Aid',
  'Medical Relief Fund',
  'Clean Water Initiative',
  'Child Health & Nutrition',
  'Shelter Reconstruction',
  'Emergency Fuel & Logistics',
];

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  inventory,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [type, setType] = useState<DonationType>('Cash');
  const [category, setCategory] = useState(CASH_CATEGORIES[0]);
  const [amountOrQuantity, setAmountOrQuantity] = useState<number>(50000);
  const [itemId, setItemId] = useState<string>(inventory[0]?.id ?? '');
  const [donorName, setDonorName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedItem = inventory.find((i) => i.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amountOrQuantity <= 0) {
      setErrorMsg('Amount or quantity must be greater than zero.');
      return;
    }
    if (type === 'In-Kind' && !itemId) {
      setErrorMsg('Please select the inventory item donated.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = type === 'In-Kind' ? (selectedItem?.category || 'General In-Kind') : category;
      await api.createDonation({
        type,
        category: finalCategory,
        amount_or_quantity: Number(amountOrQuantity),
        item_id: type === 'In-Kind' ? itemId : null,
        donor_name: donorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      notify(
        'success',
        `${type} Donation Recorded`,
        type === 'Cash'
          ? `Recorded PKR ${Number(amountOrQuantity).toLocaleString()} cash donation from ${donorName || 'Anonymous'}.`
          : `Recorded ${amountOrQuantity} ${selectedItem?.unit || 'units'} of ${selectedItem?.name}. Stock updated immediately in warehouse.`
      );
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record donation.');
      notify('error', 'Operation Failed', err.message || 'Could not record donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Humanitarian Relief Donation"
      subtitle="Register monetary funding or physical in-kind supply contributions."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Donation Type Segmented Switcher */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Donation Type *
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('Cash');
                setCategory(CASH_CATEGORIES[0]);
                setAmountOrQuantity(50000);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'Cash'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash Donation (PKR)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('In-Kind');
                setAmountOrQuantity(50);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'In-Kind'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In-Kind Goods (Warehouse Stock)
            </button>
          </div>
        </div>

        {/* Dynamic Fields for Cash */}
        {type === 'Cash' ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monetary Amount (PKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                  PKR
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amountOrQuantity}
                  onChange={(e) => setAmountOrQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-12 pr-3 py-2 text-xs font-mono font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Note: Cash donations are logged to the financial ledger and do not increase inventory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fund Allocation Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                {CASH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          /* Dynamic Fields for In-Kind */
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Donated Inventory Item *
              </label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category}) — Currently {item.stock} {item.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Donated Quantity {selectedItem ? `(${selectedItem.unit})` : ''} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amountOrQuantity}
                onChange={(e) => setAmountOrQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <div className="mt-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                Incoming goods will automatically increment available stock of <strong>{selectedItem?.name}</strong> from <strong>{selectedItem?.stock}</strong> to <strong>{(selectedItem?.stock || 0) + (amountOrQuantity || 0)} {selectedItem?.unit}</strong>.
              </div>
            </div>
          </>
        )}

        {/* Common Optional Fields */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Donor / Philanthropist Name (Optional)
          </label>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="e.g. Al-Khidmat Foundation / Edhi Trust / Individual Donor"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Operational Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received at Sukkur central depot, batch inspection passed."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <HeartHandshake className="w-3.5 h-3.5" />
            )}
            <span>Record Donation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
