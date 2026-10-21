import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { CampNeed, Camp, InventoryItem, NeedPriority } from '../types/index.ts';
import { NeedModal } from '../components/modals/NeedModal.tsx';
import { DispatchModal } from '../components/modals/DispatchModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import {
  ClipboardList,
  Plus,
  Search,
  Truck,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';

export const NeedsPage: React.FC = () => {
  const {
    role,
    refreshKey,
    triggerRefresh,
    notify,
    preselectedCampFilter,
    setPreselectedCampFilter,
  } = useApp();

  const [needs, setNeeds] = useState<CampNeed[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCamp, setSelectedCamp] = useState<string>(preselectedCampFilter || 'all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [needToEdit, setNeedToEdit] = useState<CampNeed | null>(null);

  // Dispatch modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchNeedId, setDispatchNeedId] = useState<string | null>(null);

  // Delete
  const [needToDelete, setNeedToDelete] = useState<CampNeed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (preselectedCampFilter) {
      setSelectedCamp(preselectedCampFilter);
      setPreselectedCampFilter(null);
    }
  }, [preselectedCampFilter, setPreselectedCampFilter]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [needsRes, campsRes, invRes] = await Promise.all([
          api.getNeeds({
            campId: selectedCamp !== 'all' ? selectedCamp : undefined,
            priority: selectedPriority !== 'all' ? selectedPriority : undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: search.trim() || undefined,
          }),
          api.getCamps(),
          api.getInventory(),
        ]);

        if (mounted) {
          setNeeds(needsRes);
          setCamps(campsRes);
          setInventory(invRes);
        }
      } catch (err) {
        console.error('Failed to load needs:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [refreshKey, selectedCamp, selectedPriority, selectedCategory, search]);

  const handleDeleteConfirm = async () => {
    if (!needToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteNeed(needToDelete.id);
      notify('success', 'Need Deleted', 'Camp need record removed.');
      triggerRefresh();
      setNeedToDelete(null);
    } catch (err: any) {
      notify('error', 'Cannot Delete Need', err.message || 'Active dispatches exist.');
      setNeedToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDispatchForNeed = (need: CampNeed) => {
    setDispatchNeedId(need.id);
    setIsDispatchModalOpen(true);
  };

  const priorityBadge = (priority: NeedPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const totalNeedsCount = needs.length;
  const fulfilledCount = needs.filter((n) => (n.fulfilment_percentage ?? 0) >= 100).length;
  const criticalCount = needs.filter(
    (n) => n.priority === 'High' && (n.fulfilment_percentage ?? 0) < 40
  ).length;
  const inProgressCount = totalNeedsCount - fulfilledCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#263242]">
            Camp Needs & Shortage Register
          </h1>
          <p className="text-xs text-[#697586] mt-0.5">
            Operational relief demands submitted by field coordinators across Sindh camps.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => {
              setNeedToEdit(null);
              setIsNeedModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D6A85F]" />
            <span>Record Urgent Need</span>
          </button>
        ) : (
          <span className="text-xs text-[#697586] bg-[#F0ECE3] px-3 py-1.5 rounded-lg border border-[#E5E1D9]">
            Field Volunteer Mode (Read-Only)
          </span>
        )}
      </div>

      {/* 4 Summary Stat Pills (Executive Command Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Total Demands</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {totalNeedsCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-emerald-800 block">Fully Fulfilled</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {fulfilledCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-rose-800 block">Critical Gaps (&lt;40%)</span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
            {criticalCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Pending Fulfilment</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {inProgressCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#697586] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search camp, item, or district..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Camp selector */}
          <select
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            <option value="all">All Camps ({camps.length})</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>

          {/* Priority selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Needs Table */}
      <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0ECE3] text-[#263242] font-semibold border-b border-[#E5E1D9]">
              <tr>
                <th className="px-5 py-3">Relief Camp & Location</th>
                <th className="px-4 py-3">Required Supply Item</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Required</th>
                <th className="px-4 py-3 text-right">Fulfilled</th>
                <th className="px-4 py-3 text-right">Reserved / Outstanding</th>
                <th className="px-5 py-3">Fulfilment Progress</th>
                <th className="px-5 py-3 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D9] font-medium text-[#263242]">
              {needs.map((need) => {
                const outstanding = need.required_quantity - need.fulfilled_quantity;
                const isCriticalGap = need.priority === 'High' && (need.fulfilment_percentage ?? 0) < 40;

                return (
                  <tr
                    key={need.id}
                    className={`hover:bg-[#F0ECE3]/40 transition-colors ${
                      isCriticalGap ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#263242]">{need.camp_name}</span>
                        <span className="text-[11px] text-[#697586]">District: {need.camp_district}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#263242]">{need.item_name}</span>
                        <span className="text-[11px] text-[#697586]">{need.item_category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${priorityBadge(
                          need.priority
                        )}`}
                      >
                        {need.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#263242]">
                      {need.required_quantity} {need.item_unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-emerald-800">
                      {need.fulfilled_quantity} {need.item_unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-[#263242]">
                          {outstanding} {need.item_unit}
                        </span>
                        {(need.active_reserved_quantity ?? 0) > 0 && (
                          <span className="text-[10px] text-amber-800 font-medium">
                            ({need.active_reserved_quantity} reserved)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              isCriticalGap ? 'text-rose-800' : 'text-[#263242]'
                            }`}
                          >
                            {need.fulfilment_percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F0ECE3] rounded-full overflow-hidden border border-[#E5E1D9]/50">
                          <div
                            className={`h-full rounded-full ${
                              isCriticalGap
                                ? 'bg-rose-600'
                                : (need.fulfilment_percentage ?? 0) >= 100
                                ? 'bg-emerald-600'
                                : 'bg-[#D6A85F]'
                            }`}
                            style={{ width: `${Math.min(100, need.fulfilment_percentage ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCreateDispatchForNeed(need)}
                          className="px-2 py-1 text-xs font-semibold text-[#172232] bg-[#D6A85F] hover:bg-[#c9994f] rounded-md transition-colors inline-flex items-center gap-1 shadow-xs font-bold"
                          title="Allocate dispatch to reserve stock"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>

                        {role === 'admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setNeedToEdit(need);
                                setIsNeedModalOpen(true);
                              }}
                              className="p-1.5 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-md transition-colors"
                              title="Edit requirement"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setNeedToDelete(need)}
                              className="p-1.5 text-[#697586] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete need"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {needs.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-white">
            <ClipboardList className="w-8 h-8 text-[#697586] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#263242]">No camp requirements found</p>
            <p className="text-xs text-[#697586] mt-1">Adjust selected filters or record a new camp need.</p>
          </div>
        )}
      </div>

      {/* Need Modal */}
      <NeedModal
        isOpen={isNeedModalOpen}
        onClose={() => {
          setIsNeedModalOpen(false);
          setNeedToEdit(null);
        }}
        needToEdit={needToEdit}
        camps={camps}
        inventory={inventory}
        defaultCampId={selectedCamp !== 'all' ? selectedCamp : null}
      />

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDispatchNeedId(null);
        }}
        camps={camps}
        needs={needs}
        inventory={inventory}
        preselectedNeedId={dispatchNeedId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!needToDelete}
        onClose={() => setNeedToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Camp Need Requirement"
        message={`Are you sure you want to delete this need for "${needToDelete?.item_name}" at "${needToDelete?.camp_name}"? Deletion is rejected if active pending or in-transit dispatches exist.`}
        confirmLabel="Delete Need"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
