import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Camp, CampNeed, InventoryItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  camps: Camp[];
  needs: CampNeed[];
  inventory: InventoryItem[];
  preselectedNeedId?: string | null;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  camps,
  needs,
  inventory,
  preselectedNeedId,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [selectedCampId, setSelectedCampId] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Camp filter for needs
  const availableCamps = useMemo(() => {
    return camps.filter((c) => c.status !== 'Closed');
  }, [camps]);

  // Needs belonging to selected camp
  const campNeeds = useMemo(() => {
    if (!selectedCampId) return [];
    return needs.filter((n) => n.camp_id === selectedCampId);
  }, [selectedCampId, needs]);

  // Pre-fill when opened or preselected
  useEffect(() => {
    if (isOpen) {
      if (preselectedNeedId) {
        const targetNeed = needs.find((n) => n.id === preselectedNeedId);
        if (targetNeed) {
          setSelectedCampId(targetNeed.camp_id);
          setSelectedNeedId(targetNeed.id);
          return;
        }
      }

      if (availableCamps.length > 0) {
        const firstCamp = availableCamps[0];
        setSelectedCampId(firstCamp.id);
        const firstNeed = needs.find((n) => n.camp_id === firstCamp.id);
        if (firstNeed) {
          setSelectedNeedId(firstNeed.id);
        } else {
          setSelectedNeedId('');
        }
      }
    }
    setErrorMsg('');
  }, [isOpen, preselectedNeedId, availableCamps, needs]);

  // When camp changes, pick first need
  const handleCampChange = (newCampId: string) => {
    setSelectedCampId(newCampId);
    const firstNeed = needs.find((n) => n.camp_id === newCampId);
    setSelectedNeedId(firstNeed ? firstNeed.id : '');
    setQuantity(1);
    setErrorMsg('');
  };

  const activeNeed = useMemo(() => {
    return needs.find((n) => n.id === selectedNeedId);
  }, [selectedNeedId, needs]);

  const activeItem = useMemo(() => {
    if (!activeNeed) return null;
    return inventory.find((i) => i.id === activeNeed.inventory_item_id);
  }, [activeNeed, inventory]);

  // Core reservation metrics
  const activeReserved = activeNeed?.active_reserved_quantity ?? 0;
  const fulfilled = activeNeed?.fulfilled_quantity ?? 0;
  const required = activeNeed?.required_quantity ?? 0;
  const remainingUnreserved = Math.max(0, required - fulfilled - activeReserved);
  const availableStock = activeItem?.stock ?? 0;

  // Max allocatable right now
  const maxAllocatable = Math.max(0, Math.min(availableStock, remainingUnreserved));

  // Validation checks
  const isZeroMax = maxAllocatable === 0;
  const exceedsStock = quantity > availableStock;
  const exceedsNeed = quantity > remainingUnreserved;
  const isValidQuantity = quantity > 0 && !exceedsStock && !exceedsNeed;

  const handleMaxClick = () => {
    setQuantity(maxAllocatable);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCampId) {
      setErrorMsg('Please select a destination camp.');
      return;
    }
    if (!selectedNeedId || !activeNeed) {
      setErrorMsg('Please select a valid camp need to dispatch aid against.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Dispatch quantity must be greater than zero.');
      return;
    }
    if (exceedsStock) {
      setErrorMsg(`Requested quantity (${quantity}) exceeds available warehouse stock (${availableStock} ${activeItem?.unit}).`);
      return;
    }
    if (exceedsNeed) {
      setErrorMsg(`Requested quantity (${quantity}) exceeds remaining unreserved need (${remainingUnreserved} ${activeItem?.unit}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const dispatch = await api.createDispatch({
        camp_id: selectedCampId,
        need_id: selectedNeedId,
        quantity: Number(quantity),
      });

      notify(
        'success',
        'Dispatch Created & Stock Reserved',
        `Dispatched ${dispatch.quantity} ${activeItem?.unit || 'units'} of ${activeItem?.name} for ${dispatch.camp_name}. Stock deducted immediately.`
      );
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create dispatch.');
      notify('error', 'Dispatch Rejected', err.message || 'Validation failed on server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Relief Dispatch & Reserve Stock"
      subtitle="Allocates physical warehouse inventory and reserves stock against camp shortage."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Destination Camp */}
        <div>
          <label className="block text-xs font-semibold text-[#263242] mb-1">
            1. Select Destination Camp *
          </label>
          <select
            value={selectedCampId}
            onChange={(e) => handleCampChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            {availableCamps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.district} ({c.current_families}/{c.capacity} families)
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Camp Need */}
        <div>
          <label className="block text-xs font-semibold text-[#263242] mb-1">
            2. Select Camp Need Requirement *
          </label>
          {campNeeds.length === 0 ? (
            <div className="p-3 bg-[#F0ECE3] border border-[#E5E1D9] rounded-lg text-xs text-[#697586]">
              No registered needs found for this camp. Please create a need first on the Camp Needs page.
            </div>
          ) : (
            <select
              value={selectedNeedId}
              onChange={(e) => {
                setSelectedNeedId(e.target.value);
                setQuantity(1);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
            >
              {campNeeds.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.item_name} [{n.priority} Priority] — {n.fulfilled_quantity}/{n.required_quantity} {n.item_unit} fulfilled
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3: Stock & Reservation Live Calculator Matrix */}
        {activeNeed && activeItem && (
          <div className="p-4 bg-[#F0ECE3]/50 border border-[#E5E1D9] rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E1D9] pb-2">
              <div>
                <span className="text-xs font-bold text-[#263242]">{activeItem.name}</span>
                <span className="text-xs text-[#697586] ml-2">({activeItem.category})</span>
              </div>
              <span className="text-xs font-mono font-semibold text-[#263242]">
                Unit: {activeItem.unit}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-[#E5E1D9]">
                <span className="text-[11px] text-[#697586] block">Required Need:</span>
                <span className="text-sm font-bold font-mono text-[#263242] tabular-nums">
                  {required} {activeItem.unit}
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-[#E5E1D9]">
                <span className="text-[11px] text-[#697586] block">Fulfilled:</span>
                <span className="text-sm font-bold font-mono text-emerald-800 tabular-nums">
                  {fulfilled} {activeItem.unit}
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-[#E5E1D9]">
                <span className="text-[11px] text-[#697586] block">Active Reserved:</span>
                <span className="text-sm font-bold font-mono text-amber-800 tabular-nums">
                  {activeReserved} {activeItem.unit}
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-[#E5E1D9]">
                <span className="text-[11px] text-[#697586] block">Unreserved Need:</span>
                <span className="text-sm font-bold font-mono text-[#202B3C] tabular-nums">
                  {remainingUnreserved} {activeItem.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#F0ECE3] rounded-lg border border-[#E5E1D9] text-xs">
              <span className="text-[#263242] font-semibold">Warehouse Stock Available:</span>
              <span className="font-mono font-bold text-[#263242] tabular-nums text-sm">
                {availableStock} {activeItem.unit}
              </span>
            </div>

            {/* Invariant status indicator */}
            {isZeroMax ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {availableStock === 0
                    ? 'Cannot dispatch: Warehouse is completely out of stock for this item.'
                    : 'Cannot dispatch: This camp need is already 100% fulfilled or reserved.'}
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Max allocatable now: <strong>{maxAllocatable} {activeItem.unit}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors"
                >
                  Set Max
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Dispatch Quantity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#263242]">
              3. Dispatch Quantity {activeItem ? `(${activeItem.unit})` : ''} *
            </label>
            {maxAllocatable > 0 && (
              <span className="text-[11px] text-[#697586]">
                Limit: $\le$ {maxAllocatable}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={maxAllocatable > 0 ? maxAllocatable : 1}
              disabled={isZeroMax}
              value={quantity}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 0);
                setErrorMsg('');
              }}
              className="flex-1 px-3 py-2 text-xs font-mono font-semibold border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242] disabled:bg-[#F0ECE3]"
            />
            <button
              type="button"
              disabled={isZeroMax}
              onClick={handleMaxClick}
              className="px-3 py-2 text-xs font-semibold text-[#263242] bg-[#F0ECE3] border border-[#E5E1D9] rounded-lg hover:bg-[#E5E1D9] transition-colors disabled:opacity-50"
            >
              Fill Max
            </button>
          </div>
          {exceedsStock && (
            <p className="mt-1 text-[11px] text-rose-600">
              Quantity exceeds available warehouse stock ({availableStock}).
            </p>
          )}
          {exceedsNeed && (
            <p className="mt-1 text-[11px] text-rose-600">
              Quantity exceeds remaining unreserved need ({remainingUnreserved}).
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E1D9]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#263242] bg-white border border-[#E5E1D9] rounded-lg hover:bg-[#F0ECE3] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValidQuantity}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Truck className="w-3.5 h-3.5 text-[#D6A85F]" />
            )}
            <span>Confirm & Reserve Stock</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
