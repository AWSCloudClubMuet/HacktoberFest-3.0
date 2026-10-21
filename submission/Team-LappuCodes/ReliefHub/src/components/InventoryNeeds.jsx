import React, { useState } from 'react';
import { Package, AlertCircle, Zap, Plus, Trash2 } from 'lucide-react';

export default function InventoryNeeds({
  inventory = [],
  needs = [],
  camps = [],
  role = 'Admin',
  onSaveInventory,
  onDeleteInventory,
  onSaveNeed,
  onDeleteNeed,
  onQuickDispatchMatch
}) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showNeedModal, setShowNeedModal] = useState(false);

  // New Stock Item State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Food & Ration');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [reorderLevel, setReorderLevel] = useState('50');

  // New Need State
  const [campId, setCampId] = useState('');
  const [needCategory, setNeedCategory] = useState('Food & Ration');
  const [requiredQty, setRequiredQty] = useState('');
  const [priority, setPriority] = useState('High');

  const handleStockSubmit = (e) => {
    e.preventDefault();
    onSaveInventory({
      item_name: itemName,
      category,
      stock: Number(stock),
      unit,
      reorder_level: Number(reorderLevel)
    }, false);
    setItemName('');
    setStock('');
    setShowStockModal(false);
  };

  const handleNeedSubmit = (e) => {
    e.preventDefault();
    onSaveNeed({
      camp_id: campId,
      campid: campId,
      category: needCategory,
      requiredquantity: Number(requiredQty),
      fulfilledquantity: 0,
      priority,
      status: 'Open'
    });
    setRequiredQty('');
    setShowNeedModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Subtab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sky-200/60 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'inventory'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Central Stock Depots ({inventory.length})
          </button>

          <button
            onClick={() => setActiveTab('needs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'needs'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Camp Demands & Needs ({needs.length})
          </button>
        </div>

        {role === 'Admin' && (
          <div className="flex items-center gap-2">
            {activeTab === 'inventory' ? (
              <button
                onClick={() => setShowStockModal(true)}
                className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Stock Entry
              </button>
            ) : (
              <button
                onClick={() => setShowNeedModal(true)}
                className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Register Camp Need
              </button>
            )}
          </div>
        )}
      </div>

      {/* CENTRAL STOCK DEPOTS VIEW */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const reorder = Number(item.reorder_level || item.reorderlevel || 50);
            const isLowStock = Number(item.stock || 0) <= reorder;
            return (
              <div
                key={item.id}
                className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">{item.category || 'General'}</span>
                      <h3 className="text-slate-800 font-extrabold text-lg">{item.item_name || item.name || 'Stock Item'}</h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isLowStock 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isLowStock ? 'Low Stock' : 'Adequate'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{Number(item.stock || 0).toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-500">{item.unit || 'Units'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Reorder Floor: <strong className="text-slate-700">{reorder} {item.unit || 'Units'}</strong></span>
                  {role === 'Admin' && (
                    <button
                      onClick={() => onDeleteInventory(item.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CAMP DEMANDS & NEEDS VIEW */}
      {activeTab === 'needs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {needs.map((need) => {
            const needCampId = String(need.camp_id || need.campid || '');
            const camp = camps.find(c => String(c.id) === needCampId);
            const req = Number(need.requiredquantity || need.required_quantity || 1);
            const ful = Number(need.fulfilledquantity || need.fulfilled_quantity || 0);
            const pct = Math.min(100, Math.round((ful / req) * 100));
            const isCritical = need.priority === 'High' && pct < 40;

            const matchingStock = inventory.find(i => {
              const stockCat = (i?.category || i?.item_name || i?.name || '').toLowerCase();
              const needCat = (need?.category || '').toLowerCase();
              return stockCat.includes(needCat) || needCat.includes(stockCat);
            });

            return (
              <div
                key={need.id}
                className={`glass-card glass-card-hover rounded-3xl p-5 flex flex-col justify-between ${
                  isCritical ? 'border-l-4 border-l-rose-500' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {camp ? camp.name : `Camp #${needCampId}`}
                      </span>
                      <h3 className="text-slate-800 font-extrabold text-base">{need.category || 'General'} Demand</h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      need.priority === 'High' 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {need.priority || 'Medium'} Priority
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Fulfillment</span>
                      <span className={pct < 40 ? 'text-rose-600' : 'text-emerald-600'}>{pct}% ({ful} / {req})</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct < 40 ? 'bg-rose-500' : pct < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {matchingStock && pct < 100 && (
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-[11px] flex justify-between items-center text-sky-800 font-bold">
                      <span>Available Depot:</span>
                      <span className="text-sky-600 font-black">{matchingStock.item_name || matchingStock.name} ({matchingStock.stock})</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {matchingStock && pct < 100 && role === 'Admin' ? (
                    <button
                      onClick={() => onQuickDispatchMatch && onQuickDispatchMatch(need, matchingStock)}
                      className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                      ⚡ Auto-Match Dispatch
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      {pct >= 100 ? 'Fully Met' : 'Manual Allocation Required'}
                    </span>
                  )}

                  {role === 'Admin' && (
                    <button
                      onClick={() => onDeleteNeed(need.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Need"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD STOCK ENTRY MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-sky-600" />
              New Stock Depot Entry
            </h2>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Mineral Water (1.5L)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  >
                    <option value="Food & Ration">Food & Ration</option>
                    <option value="Medical">Medical</option>
                    <option value="Water">Water</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Hygiene">Hygiene</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. Bags, Kits"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reorder Floor</label>
                  <input
                    type="number"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEED MODAL */}
      {showNeedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-sky-600" />
              Register Camp Requirement
            </h2>

            <form onSubmit={handleNeedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select Relief Camp</label>
                <select
                  required
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                >
                  <option value="">-- Choose Relief Camp --</option>
                  {camps.map(c => (
                    <option key={c.id} value={c.id} disabled={c.status === 'Closed'}>
                      {c.name} {c.status === 'Closed' ? '(Closed)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={needCategory}
                    onChange={(e) => setNeedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  >
                    <option value="Food & Ration">Food & Ration</option>
                    <option value="Medical">Medical</option>
                    <option value="Water">Water</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Hygiene">Hygiene</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Required Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={requiredQty}
                    onChange={(e) => setRequiredQty(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNeedModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25"
                >
                  Register Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}