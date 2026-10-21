import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Dispatch, DispatchStatus, Camp, CampNeed, InventoryItem, DispatchDelayAlert } from '../types/index.ts';
import { DispatchModal } from '../components/modals/DispatchModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

export const DispatchesPage: React.FC = () => {
  const {
    role,
    refreshKey,
    triggerRefresh,
    notify,
    preselectedNeedForDispatch,
    setPreselectedNeedForDispatch,
  } = useApp();

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [delays, setDelays] = useState<DispatchDelayAlert[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [needs, setNeeds] = useState<CampNeed[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCamp, setSelectedCamp] = useState<string>('all');

  // Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Confirmation dialogs
  const [actionDispatch, setActionDispatch] = useState<{
    dispatch: Dispatch;
    action: 'deliver' | 'cancel' | 'in-transit';
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    if (preselectedNeedForDispatch) {
      setIsDispatchModalOpen(true);
    }
  }, [preselectedNeedForDispatch]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dispRes, campsRes, needsRes, invRes, delayRes] = await Promise.all([
          api.getDispatches({
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            campId: selectedCamp !== 'all' ? selectedCamp : undefined,
            search: search.trim() || undefined,
          }),
          api.getCamps(),
          api.getNeeds(),
          api.getInventory(),
          api.getDispatchDelays(24).catch(() => []),
        ]);

        if (mounted) {
          setDispatches(dispRes);
          setCamps(campsRes);
          setNeeds(needsRes);
          setInventory(invRes);
          setDelays(delayRes);
        }
      } catch (err) {
        console.error('Failed to load dispatches:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [refreshKey, selectedStatus, selectedCamp, search]);

  // Derived counts
  const pendingCount = dispatches.filter((d) => d.status === 'Pending').length;
  const inTransitCount = dispatches.filter((d) => d.status === 'In Transit').length;
  const deliveredCount = dispatches.filter((d) => d.status === 'Delivered').length;
  const cancelledCount = dispatches.filter((d) => d.status === 'Cancelled').length;

  const delayMap = useMemo(() => {
    const map = new Map<string, DispatchDelayAlert>();
    for (const d of delays) {
      map.set(d.dispatch_id, d);
    }
    return map;
  }, [delays]);

  const handleActionConfirm = async () => {
    if (!actionDispatch) return;
    const { dispatch, action } = actionDispatch;
    setIsProcessingAction(true);

    try {
      if (action === 'in-transit') {
        await api.markInTransit(dispatch.id);
        notify(
          'success',
          'Dispatch In Transit',
          `Convoy for ${dispatch.camp_name} (${dispatch.quantity} ${dispatch.item_unit || 'units'} of ${dispatch.item_name}) is now en route.`
        );
      } else if (action === 'deliver') {
        await api.markDelivered(dispatch.id);
        notify(
          'success',
          'Delivery Confirmed',
          `Delivered ${dispatch.quantity} ${dispatch.item_unit || 'units'} to ${dispatch.camp_name}. Need fulfilment incremented exactly once.`
        );
      } else if (action === 'cancel') {
        await api.cancelDispatch(dispatch.id);
        notify(
          'info',
          'Dispatch Cancelled & Stock Restored',
          `Cancelled shipment #${dispatch.id}. Restored ${dispatch.quantity} ${dispatch.item_unit || 'units'} of ${dispatch.item_name} back to central inventory.`
        );
      }
      triggerRefresh();
      setActionDispatch(null);
    } catch (err: any) {
      notify('error', 'Operation Failed', err.message || 'Status transition rejected by server.');
      setActionDispatch(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const statusBadge = (status: DispatchStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Transit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dispatches & Logistics Coordination
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet tracking, atomic inventory reservations, and verified handoffs to flood camps.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => {
              setPreselectedNeedForDispatch(null);
              setIsDispatchModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Dispatch</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Field Volunteer Mode (Operational Access)
          </span>
        )}
      </div>

      {/* 4 Summary Stat Pills (Unboxed Zero-Pill Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-medium text-amber-700 block">Pending Depot Loading</span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {pendingCount}
          </span>
          <span className="text-[10px] text-slate-500">Holding stock reservation</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-blue-700 block">In Transit (Convoy En Route)</span>
          <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            {inTransitCount}
          </span>
          <span className="text-[10px] text-slate-500">Active reservation</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-emerald-700 block">Delivered to Camps</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {deliveredCount}
          </span>
          <span className="text-[10px] text-slate-500">Accounted in fulfilment</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Cancelled / Returned</span>
          <span className="text-xl font-bold font-mono text-slate-500 tabular-nums">
            {cancelledCount}
          </span>
          <span className="text-[10px] text-slate-500">Stock restored to depot</span>
        </div>
      </div>

      {/* Logistics Delay Warning Banner */}
      {delays.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 tracking-tight flex items-center gap-2">
                  <span>Logistics Delay Warning: {delays.length} Shipment{delays.length > 1 ? 's' : ''} Stalled &gt;24 Hours</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900">
                    Target: &le;24h
                  </span>
                </h3>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  These relief convoys have remained in Pending or In Transit status beyond the 24-hour target turnaround time. Verify route accessibility, depot staging, or receipt confirmation.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200 shrink-0 hidden sm:inline">
              Fleet Alert
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {delays.slice(0, 3).map((alert) => (
              <div
                key={alert.dispatch_id}
                className="bg-white/90 border border-amber-200/80 rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                    <span className="truncate">{alert.camp_name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        alert.delay_level === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.elapsed_display}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {alert.quantity} {alert.item_unit} · {alert.item_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearch(alert.dispatch_id)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors shrink-0"
                >
                  Filter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dispatch ID, camp, or item..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {['all', 'Pending', 'In Transit', 'Delivered', 'Cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === s
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Camp selector */}
          <select
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            <option value="all">All Camps</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Dispatch ID</th>
                <th className="px-4 py-3">Destination Camp</th>
                <th className="px-4 py-3">Dispatched Item</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-5 py-3 text-right">State Transitions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {dispatches.map((dispatch) => {
                const createdDate = new Date(dispatch.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const deliveredDate = dispatch.delivered_at
                  ? new Date(dispatch.delivered_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;
                const cancelledDate = dispatch.cancelled_at
                  ? new Date(dispatch.cancelled_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <tr key={dispatch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-900">
                      {dispatch.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{dispatch.camp_name}</span>
                        <span className="text-[11px] text-slate-400">District: {dispatch.camp_district}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{dispatch.item_name}</span>
                        <span className="text-[11px] text-slate-400">{dispatch.item_category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-sm text-slate-900">
                      {dispatch.quantity} {dispatch.item_unit}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${statusBadge(
                            dispatch.status
                          )}`}
                        >
                          {dispatch.status}
                        </span>
                        {delayMap.has(dispatch.id) && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              delayMap.get(dispatch.id)?.delay_level === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{delayMap.get(dispatch.id)?.elapsed_display} delay</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <div>Created: {createdDate}</div>
                      {deliveredDate && (
                        <div className="text-emerald-700 font-medium">Delivered: {deliveredDate}</div>
                      )}
                      {cancelledDate && (
                        <div className="text-slate-500">Cancelled: {cancelledDate}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {/* State Machine Transition Actions */}
                      <div className="inline-flex items-center gap-1.5">
                        {dispatch.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionDispatch({ dispatch, action: 'in-transit' })}
                              className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              title="Transition to In Transit"
                            >
                              In Transit
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionDispatch({ dispatch, action: 'deliver' })}
                              className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                              title="Deliver to camp & increment fulfilment"
                            >
                              Deliver
                            </button>
                            {role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => setActionDispatch({ dispatch, action: 'cancel' })}
                                className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-md transition-colors"
                                title="Cancel dispatch & restore reserved inventory stock"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}

                        {dispatch.status === 'In Transit' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionDispatch({ dispatch, action: 'deliver' })}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                              title="Confirm receipt at camp"
                            >
                              Mark Delivered
                            </button>
                            {role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => setActionDispatch({ dispatch, action: 'cancel' })}
                                className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-md transition-colors"
                                title="Cancel dispatch & restore stock"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}

                        {dispatch.status === 'Delivered' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fulfilment Verified</span>
                          </span>
                        )}

                        {dispatch.status === 'Cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Stock Restored</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {dispatches.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-white">
            <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No dispatches matching filters</p>
            <p className="text-xs text-slate-500 mt-1">Create a new dispatch to reserve warehouse stock.</p>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setPreselectedNeedForDispatch(null);
        }}
        camps={camps}
        needs={needs}
        inventory={inventory}
        preselectedNeedId={preselectedNeedForDispatch}
      />

      {/* State Machine Transition Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!actionDispatch}
        onClose={() => setActionDispatch(null)}
        onConfirm={handleActionConfirm}
        title={
          actionDispatch?.action === 'deliver'
            ? 'Confirm Receipt & Delivery at Camp'
            : actionDispatch?.action === 'cancel'
            ? 'Cancel Dispatch & Restore Inventory Stock'
            : 'Mark Dispatch In Transit'
        }
        message={
          actionDispatch?.action === 'deliver'
            ? `Confirm receipt of ${actionDispatch.dispatch.quantity} ${actionDispatch.dispatch.item_unit || 'units'} of ${actionDispatch.dispatch.item_name} at "${actionDispatch.dispatch.camp_name}". This will increase the linked need's fulfilled quantity exactly once. Inventory will NOT be deducted again.`
            : actionDispatch?.action === 'cancel'
            ? `Cancelling shipment #${actionDispatch?.dispatch.id} will immediately restore ${actionDispatch?.dispatch.quantity} ${actionDispatch?.dispatch.item_unit || 'units'} back to available central warehouse stock. Camp need fulfilment will remain unchanged.`
            : `Set convoy status to In Transit for shipment #${actionDispatch?.dispatch.id} bound for "${actionDispatch?.dispatch.camp_name}".`
        }
        confirmLabel={
          actionDispatch?.action === 'deliver'
            ? 'Confirm Handover'
            : actionDispatch?.action === 'cancel'
            ? 'Cancel Dispatch & Restore Stock'
            : 'Mark En Route'
        }
        isDestructive={actionDispatch?.action === 'cancel'}
        isLoading={isProcessingAction}
      />
    </div>
  );
};
