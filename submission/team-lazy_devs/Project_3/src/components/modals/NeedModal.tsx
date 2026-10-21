import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Camp, InventoryItem, CampNeed, NeedPriority } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';

interface NeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  needToEdit?: CampNeed | null;
  camps: Camp[];
  inventory: InventoryItem[];
  defaultCampId?: string | null;
}

export const NeedModal: React.FC<NeedModalProps> = ({
  isOpen,
  onClose,
  needToEdit,
  camps,
  inventory,
  defaultCampId,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [campId, setCampId] = useState('');
  const [itemId, setItemId] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState<number>(100);
  const [priority, setPriority] = useState<NeedPriority>('High');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (needToEdit) {
      setCampId(needToEdit.camp_id);
      setItemId(needToEdit.inventory_item_id);
      setRequiredQuantity(needToEdit.required_quantity);
      setPriority(needToEdit.priority);
    } else {
      setCampId(defaultCampId || (camps[0]?.id ?? ''));
      setItemId(inventory[0]?.id ?? '');
      setRequiredQuantity(100);
      setPriority('High');
    }
    setErrorMsg('');
  }, [needToEdit, isOpen, camps, inventory, defaultCampId]);

  const selectedItem = inventory.find((i) => i.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!campId) {
      setErrorMsg('Please select a camp.');
      return;
    }
    if (!itemId) {
      setErrorMsg('Please select an inventory item.');
      return;
    }
    if (requiredQuantity <= 0) {
      setErrorMsg('Required quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (needToEdit) {
        await api.updateNeed(needToEdit.id, {
          required_quantity: Number(requiredQuantity),
          priority,
        });
        notify('success', 'Need Updated', 'Successfully updated camp need requirements.');
      } else {
        await api.createNeed({
          camp_id: campId,
          inventory_item_id: itemId,
          required_quantity: Number(requiredQuantity),
          priority,
        });
        notify('success', 'Need Registered', 'New camp requirement added to operational tracking.');
      }
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save need.');
      notify('error', 'Operation Failed', err.message || 'Could not save need.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={needToEdit ? 'Update Camp Need Requirement' : 'Record Urgent Camp Need'}
      subtitle="Register required emergency items for displaced flood victims in a camp."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Relief Camp *
          </label>
          <select
            disabled={!!needToEdit}
            value={campId}
            onChange={(e) => setCampId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white disabled:bg-slate-50"
          >
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district}) · {c.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Required Inventory Item *
          </label>
          <select
            disabled={!!needToEdit}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white disabled:bg-slate-50"
          >
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category}) — {item.stock} {item.unit} available
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Quantity {selectedItem ? `(${selectedItem.unit})` : ''} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={requiredQuantity}
              onChange={(e) => setRequiredQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shortage Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NeedPriority)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="High">High Priority (Urgent Shortage)</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority (Buffer Stock)</option>
            </select>
          </div>
        </div>

        {needToEdit && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Already Fulfilled:</span>
              <span className="font-mono font-semibold text-slate-900">
                {needToEdit.fulfilled_quantity} {needToEdit.item_unit}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Active Reservations (Pending/In Transit):</span>
              <span className="font-mono font-semibold text-amber-700">
                {needToEdit.active_reserved_quantity ?? 0} {needToEdit.item_unit}
              </span>
            </div>
          </div>
        )}

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
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{needToEdit ? 'Save Need Changes' : 'Record Need'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
