import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { InventoryItem, InventoryCategory } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
}

const CATEGORIES: InventoryCategory[] = [
  'Clean Water',
  'Food',
  'Medicine',
  'Shelter',
  'Hygiene',
  'Clothing',
  'Other',
];

const STANDARD_UNITS = [
  'litres',
  'packets',
  'kits',
  'boxes',
  'blankets',
  'pieces',
  'bottles',
  'bags',
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Clean Water');
  const [unit, setUnit] = useState('litres');
  const [stock, setStock] = useState<number>(100);
  const [reorderLevel, setReorderLevel] = useState<number>(50);
  const [dailyConsumption, setDailyConsumption] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setUnit(itemToEdit.unit);
      setStock(itemToEdit.stock);
      setReorderLevel(itemToEdit.reorder_level);
      setDailyConsumption(itemToEdit.daily_consumption !== undefined ? itemToEdit.daily_consumption : '');
    } else {
      setName('');
      setCategory('Clean Water');
      setUnit('litres');
      setStock(100);
      setReorderLevel(50);
      setDailyConsumption('');
    }
    setErrorMsg('');
  }, [itemToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    if (stock < 0) {
      setErrorMsg('Available stock cannot be negative.');
      return;
    }
    if (reorderLevel < 0) {
      setErrorMsg('Reorder level cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDailyConsumption = dailyConsumption === '' ? undefined : Number(dailyConsumption);
      if (itemToEdit) {
        await api.updateInventory(itemToEdit.id, {
          name: name.trim(),
          category,
          unit: unit.trim(),
          stock: Number(stock),
          reorder_level: Number(reorderLevel),
          daily_consumption: parsedDailyConsumption,
        });
        notify('success', 'Item Updated', `Updated "${name.trim()}".`);
      } else {
        await api.createInventory({
          name: name.trim(),
          category,
          unit: unit.trim(),
          stock: Number(stock),
          reorder_level: Number(reorderLevel),
        });
        notify('success', 'Item Added', `Added "${name.trim()}" to warehouse stock.`);
      }
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save inventory item.');
      notify('error', 'Operation Failed', err.message || 'Could not save inventory item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Edit Inventory Item' : 'Add Warehouse Stock Item'}
      subtitle="Register essential relief supplies stored at the regional central warehouse."
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
            Item Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chlorine Tablets (100 tabs pack)"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InventoryCategory)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit of Measurement *
            </label>
            <input
              type="text"
              list="units-list"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. litres, kits"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <datalist id="units-list">
              {STANDARD_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Physical Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Low Stock Reorder Level *
            </label>
            <input
              type="number"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Feature 2: Stock Shortage Forecast Daily Usage Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Estimated Daily Consumption ({unit || 'units'}/day)
            </label>
            <span className="text-[10px] text-slate-500">Optional for Shortage Forecast</span>
          </div>
          <input
            type="number"
            min="0"
            value={dailyConsumption}
            onChange={(e) => setDailyConsumption(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 25 (leave empty if daily rate is unestablished)"
            className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Used to calculate estimated depletion days. If left empty, the system displays "Insufficient data" to avoid fabricating estimates.
          </p>
        </div>

        {stock <= reorderLevel && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Note: Current stock ({stock}) is at or below reorder level ({reorderLevel}). This item will be flagged as <span className="font-semibold">Low Stock</span>.
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
            <span>{itemToEdit ? 'Update Item' : 'Add Supply Item'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
