import React, { useState } from 'react';
import { Heart, Users, DollarSign, PackageCheck, UserPlus, Sparkles, Droplets, ShieldCheck, Gift } from 'lucide-react';

export default function VolunteerDonations({
  donations = [],
  volunteers = [],
  camps = [],
  inventory = [],
  role = 'Admin',
  onRecordDonation,
  onAssignVolunteer
}) {
  const [activeSubTab, setActiveSubTab] = useState('donations');
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  // Form States
  const [donorName, setDonorName] = useState('');
  const [type, setType] = useState('Cash');
  const [amountOrQty, setAmountOrQty] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [category, setCategory] = useState('General Reserve');

  // Compute stats
  const totalCash = donations
    .filter(d => d.type === 'Cash')
    .reduce((sum, d) => sum + (Number(d.amountorquantity) || 0), 0);

  const totalInKind = donations.filter(d => d.type === 'In-Kind').length;

  const handleDonationSubmit = (e) => {
    e.preventDefault();
    const stockItem = inventory.find(i => String(i.id) === String(inventoryItemId));
    
    onRecordDonation({
      donor_name: donorName,
      type,
      amountorquantity: Number(amountOrQty),
      allocated_category_or_item: type === 'In-Kind' && stockItem ? stockItem.item_name : category,
      date: new Date().toISOString().split('T')[0]
    }, stockItem);

    setDonorName('');
    setAmountOrQty('');
    setShowDonationModal(false);
  };

  return (
    <div className="space-[#0f172a] space-y-6">
      
      {/* Dynamic Wave Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-cyan-950/80 border border-cyan-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              Relief Support Telemetry
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Aid & Deployment Hub <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track aid contributions and assign ground volunteers across active flood relief camps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDonationModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Record Donation
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Total Cash Aid</div>
            <div className="text-lg md:text-xl font-black text-cyan-400">PKR {totalCash.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">In-Kind Contribs</div>
            <div className="text-lg md:text-xl font-black text-blue-400">{totalInKind} Shipments</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Active Volunteers</div>
            <div className="text-lg md:text-xl font-black text-emerald-400">{volunteers.length} Deployed</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Relief Camps</div>
            <div className="text-lg md:text-xl font-black text-purple-400">{camps.length} Camps</div>
          </div>
        </div>
      </div>

      {/* Modern Tab Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('donations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'donations'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Donation Records ({donations.length})
          </button>

          <button
            onClick={() => setActiveSubTab('volunteers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'volunteers'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Volunteer Force ({volunteers.length})
          </button>
        </div>
      </div>

      {/* DONATIONS VIEW */}
      {activeSubTab === 'donations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donations.map((d, idx) => (
            <div
              key={d.id || idx}
              className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 ${
                    d.type === 'Cash' 
                      ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 shadow-lg shadow-emerald-500/20' 
                      : 'bg-gradient-to-tr from-cyan-400 to-blue-400 shadow-lg shadow-cyan-500/20'
                  }`}>
                    {d.type === 'Cash' ? <DollarSign className="w-5 h-5" /> : <PackageCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base group-hover:text-cyan-300 transition-colors">
                      {d.donor_name || 'Anonymous Donor'}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">{d.date || 'Recent'}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  d.type === 'Cash'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}>
                  {d.type}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Contribution</div>
                  <div className="text-lg font-black text-white">
                    {d.type === 'Cash' ? `PKR ${Number(d.amountorquantity).toLocaleString()}` : `${d.amountorquantity} Units`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Allocation</div>
                  <div className="text-xs font-bold text-slate-300">
                    {d.allocated_category_or_item || 'General Aid'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VOLUNTEERS VIEW */}
      {activeSubTab === 'volunteers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((v) => {
            const assignedCamp = camps.find(c => String(c.id) === String(v.camp_id));
            return (
              <div
                key={v.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                      {v.name ? v.name.charAt(0) : 'V'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">{v.name}</h3>
                      <p className="text-xs text-slate-400">{v.role || 'Field Responder'}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    assignedCamp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {assignedCamp ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Contact:</span>
                    <span className="text-slate-200 font-mono">{v.contact || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Deployed Camp:</span>
                    <span className="font-semibold text-cyan-400">{assignedCamp ? assignedCamp.name : 'None'}</span>
                  </div>

                  {role === 'Admin' && (
                    <div className="mt-2 pt-2">
                      <select
                        value={v.camp_id || ''}
                        onChange={(e) => onAssignVolunteer(v.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">-- Assign to Camp --</option>
                        {camps.map(c => (
                          <option key={c.id} value={c.id} disabled={c.status === 'Closed'}>
                            {c.name} {c.status === 'Closed' ? '(Closed)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECORD DONATION MODAL */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-cyan-400" />
              Record New Contribution
            </h2>

            <form onSubmit={handleDonationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Donor Name</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Sindh Relief Fund / John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Cash">Cash Aid</option>
                    <option value="In-Kind">In-Kind Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {type === 'Cash' ? 'Amount (PKR)' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amountOrQty}
                    onChange={(e) => setAmountOrQty(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {type === 'In-Kind' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Stock Item</label>
                  <select
                    required
                    value={inventoryItemId}
                    onChange={(e) => setInventoryItemId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Select Inventory Item --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} (Current: {item.stock})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="General Reserve">General Reserve</option>
                    <option value="Medical Support">Medical Support</option>
                    <option value="Food & Ration">Food & Ration</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDonationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}