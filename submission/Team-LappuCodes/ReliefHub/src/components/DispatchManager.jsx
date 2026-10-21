import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, AlertCircle, Zap } from 'lucide-react';

export default function DispatchManager({
  dispatches = [],
  camps = [],
  inventory = [],
  needs = [],
  role = 'Admin',
  prefilledDispatch = null,
  clearPrefilledDispatch,
  onCreateDispatch,
  onUpdateStatus
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (prefilledDispatch) {
      const targetCampId = String(prefilledDispatch.camp_id || prefilledDispatch.campid || '');
      const targetNeedId = String(prefilledDispatch.need_id || prefilledDispatch.needid || '');
      
      setSelectedCampId(targetCampId);
      setSelectedNeedId(targetNeedId);
      if (prefilledDispatch.quantity) {
        setQuantity(String(prefilledDispatch.quantity));
      }
      setShowModal(true);
    }
  }, [prefilledDispatch]);

  const handleCloseModal = () => {
    setShowModal(false);
    setErrorMsg('');
    if (clearPrefilledDispatch) clearPrefilledDispatch();
  };

  const availableNeeds = needs.filter(n => 
    String(n.camp_id || n.campid || '') === String(selectedCampId)
  );

  const selectedNeed = needs.find(n => 
    String(n.id) === String(selectedNeedId)
  );

  const selectedInventoryItem = selectedNeed
    ? inventory.find(i => 
        String(i.id) === String(selectedNeed.inventory_id || selectedNeed.inventoryitemid || '') ||
        (i.category && selectedNeed.category && i.category.toLowerCase().includes(selectedNeed.category.toLowerCase()))
      )
    : null;

  const pendingQtySum = selectedNeed
    ? dispatches
        .filter(d => 
          String(d.need_id || d.needid || '') === String(selectedNeed.id) && 
          (d.status === 'Pending' || d.status === 'In Transit')
        )
        .reduce((sum, d) => sum + Number(d.quantity || 0), 0)
    : 0;

  const reqQty = selectedNeed ? Number(selectedNeed.requiredquantity || selectedNeed.required_quantity || 0) : 0;
  const fulQty = selectedNeed ? Number(selectedNeed.fulfilledquantity || selectedNeed.fulfilled_quantity || 0) : 0;
  const unreservedRemaining = selectedNeed ? Math.max(0, reqQty - fulQty - pendingQtySum) : 0;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const dispatchQty = Number(quantity);

    if (!selectedCampId || !selectedNeedId || dispatchQty <= 0) {
      setErrorMsg('Please select a camp, a need item, and enter a valid quantity.');
      return;
    }

    try {
      await onCreateDispatch({
        camp_id: selectedCampId,
        campid: selectedCampId,
        need_id: selectedNeedId,
        needid: selectedNeedId,
        quantity: dispatchQty,
        stockItem: selectedInventoryItem,
        needItem: selectedNeed,
        pendingQtySum,
        status: 'Pending'
      });
      handleCloseModal();
      setQuantity('');
      setSelectedCampId('');
      setSelectedNeedId('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize stock dispatch.');
    }
  };

  const filteredDispatches = dispatches.filter(d => filterStatus === 'All' || d.status === filterStatus);

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="glass-card rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Logistics Telemetry</span>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" />
            Dispatch & Allocation Control
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor emergency stock shipments and update camp transit states
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white text-slate-700 text-xs font-bold rounded-2xl px-4 py-2.5 border border-slate-200 focus:outline-none shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {role === 'Admin' && (
            <button
              onClick={() => { setSelectedCampId(''); setSelectedNeedId(''); setQuantity(''); setShowModal(true); }}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-sky-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Create Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Dispatches Table Container */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-sky-50/70 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-sky-100">
              <tr>
                <th className="p-4">Dispatch ID</th>
                <th className="p-4">Target Relief Camp</th>
                <th className="p-4">Resource Item</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Transit Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                    No active dispatches found for selected filter status.
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((d) => {
                  const camp = camps.find(c => String(c.id) === String(d.camp_id || d.campid || ''));
                  const need = needs.find(n => String(n.id) === String(d.need_id || d.needid || ''));
                  const item = inventory.find(i => 
                    String(i.id) === String(d.inventory_id || d.inventoryitemid || need?.inventoryitemid || need?.inventory_id || '') ||
                    (need?.category && i.category && i.category.toLowerCase().includes(need.category.toLowerCase()))
                  );

                  return (
                    <tr key={d.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-400">#{d.id}</td>
                      <td className="p-4 font-extrabold text-slate-800">
                        {camp ? camp.name : `Camp #${d.camp_id || d.campid || ''}`}
                      </td>
                      <td className="p-4 text-sky-600 font-extrabold">
                        {item?.item_name || item?.name || need?.category || 'Relief Supplies'}
                      </td>
                      <td className="p-4 text-slate-800 font-black">
                        {d.quantity} <span className="text-xs text-slate-400 font-normal">{item?.unit || 'Units'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          d.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          d.status === 'In Transit' ? 'bg-sky-100 text-sky-700 border border-sky-200 animate-pulse' :
                          d.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {d.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {d.status === 'Pending' && (
                          <button
                            onClick={() => onUpdateStatus(d, 'In Transit', item, need)}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all"
                          >
                            Mark In Transit
                          </button>
                        )}
                        {(d.status === 'Pending' || d.status === 'In Transit') && (
                          <button
                            onClick={() => onUpdateStatus(d, 'Delivered', item, need)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {d.status !== 'Cancelled' && d.status !== 'Delivered' && (
                          <button
                            onClick={() => onUpdateStatus(d, 'Cancelled', item, need)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH CREATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-sky-600" />
                Create Emergency Dispatch
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Relief Camp</label>
                <select
                  value={selectedCampId}
                  onChange={(e) => { setSelectedCampId(e.target.value); setSelectedNeedId(''); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                >
                  <option value="">-- Choose Relief Camp --</option>
                  {camps.filter(c => c.status !== 'Closed').map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.district || 'Sindh'})</option>
                  ))}
                </select>
              </div>

              {selectedCampId && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Camp Need Requirement</label>
                  <select
                    value={selectedNeedId}
                    onChange={(e) => setSelectedNeedId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">-- Choose Unmet Need --</option>
                    {availableNeeds.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.category} Demand - Priority: {n.priority}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNeed && (
                <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-1.5 font-bold">
                  <div className="flex justify-between text-slate-600">
                    <span>Matching Depot Stock:</span>
                    <strong className="text-emerald-600">
                      {selectedInventoryItem ? `${selectedInventoryItem.stock} ${selectedInventoryItem.unit || ''}` : 'Stock Available'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Unreserved Need Gap:</span>
                    <strong className="text-sky-600">{unreservedRemaining} Units</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">Dispatch Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter dispatch quantity"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl shadow-md shadow-sky-500/25"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}