import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { InventoryItem, InventoryCategory } from '../types/index.ts';
import { InventoryModal } from '../components/modals/InventoryModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { role, refreshKey, triggerRefresh, notify } = useApp();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  // Delete state
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const data = await api.getInventory({
          search: search.trim() || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          lowStockOnly,
        });
        if (mounted) setInventory(data);
      } catch (err) {
        console.error('Failed to load inventory:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchInventory();
    return () => {
      mounted = false;
    };
  }, [refreshKey, search, selectedCategory, lowStockOnly]);

  const categories: InventoryCategory[] = [
    'Clean Water',
    'Food',
    'Medicine',
    'Shelter',
    'Hygiene',
    'Clothing',
    'Other',
  ];

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.stock <= i.reorder_level).length;

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteInventory(itemToDelete.id);
      notify('success', 'Item Deleted', `Removed "${itemToDelete.name}" from inventory.`);
      triggerRefresh();
      setItemToDelete(null);
    } catch (err: any) {
      notify('error', 'Cannot Delete Item', err.message || 'Item has active dependencies.');
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#263242]">
            Regional Central Warehouse Inventory
          </h1>
          <p className="text-xs text-[#697586] mt-0.5">
            Physical relief stock reserves stored in Sukkur and Hyderabad logistic depots.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => {
              setItemToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D6A85F]" />
            <span>Add Stock Item</span>
          </button>
        ) : (
          <span className="text-xs text-[#697586] bg-[#F0ECE3] px-3 py-1.5 rounded-lg border border-[#E5E1D9]">
            Field Volunteer Mode (Read-Only)
          </span>
        )}
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Total Catalog Items</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {totalItems}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-amber-800 block">Low-Stock Warnings</span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {lowStockCount} items
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#263242] block">Supply Categories</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {categories.length} essential sectors
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#697586] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item by name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              lowStockOnly
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white text-[#697586] border-[#E5E1D9] hover:bg-[#F0ECE3] hover:text-[#263242]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only ({lowStockCount})</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0ECE3]/80 text-[#263242] font-semibold border-b border-[#E5E1D9]">
              <tr>
                <th className="px-5 py-3">Supply Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Available Stock</th>
                <th className="px-4 py-3 text-right">Reorder Threshold</th>
                <th className="px-4 py-3">Supply Runway</th>
                <th className="px-4 py-3">Inventory Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D9] font-medium text-[#263242]">
              {inventory.map((item) => {
                const isLow = item.stock <= item.reorder_level;
                const hasRunway = item.daily_consumption && item.daily_consumption > 0;
                const daysRemaining = hasRunway ? Math.floor(item.stock / item.daily_consumption!) : null;

                return (
                  <tr key={item.id} className="hover:bg-[#F0ECE3]/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#263242]">{item.name}</span>
                        <span className="text-[11px] text-[#697586] font-mono">Unit: {item.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0ECE3] text-[#263242] border border-[#E5E1D9]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-sm text-[#263242]">
                      {item.stock} {item.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#697586]">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="px-4 py-3.5">
                      {daysRemaining !== null ? (
                        <div className="flex flex-col">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              daysRemaining <= 3
                                ? 'text-rose-600'
                                : daysRemaining <= 7
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                          </span>
                          <span className="text-[10px] text-[#697586]">
                            ~{item.daily_consumption} {item.unit}/day burn
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#697586] font-mono italic">
                          No rate set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {role === 'admin' ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setItemToEdit(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-md transition-colors"
                            title="Edit supply item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-[#697586] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete supply item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#697586]">Read-Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inventory.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-white rounded-xl border border-[#E5E1D9]">
            <Package className="w-8 h-8 text-[#D6A85F] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-[#263242]">No inventory supplies found</p>
            <p className="text-xs text-[#697586] mt-1">Try relaxing filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Inventory Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse Supply Record"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? The system will reject deletion if active camp needs or past dispatches reference this item.`}
        confirmLabel="Delete Item"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
