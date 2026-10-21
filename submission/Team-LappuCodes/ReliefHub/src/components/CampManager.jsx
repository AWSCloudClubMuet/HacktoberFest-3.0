import React, { useState } from 'react';
import { Shield, Plus, Search, Edit2, Trash2, Users, AlertCircle, X, MapPin } from 'lucide-react';
import CapacityGauge from './CapacityGauge';

export default function CampManager({ camps = [], onSaveCamp, onDeleteCamp, role, initialCampFilter = '' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState(initialCampFilter || 'All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    capacity: '',
    currentfamilies: '',
    status: 'Active'
  });
  const [errorMsg, setErrorMsg] = useState('');

  const safeCamps = Array.isArray(camps) ? camps : [];

  // Extract unique districts
  const districts = ['All', ...new Set(safeCamps.map(c => c?.district).filter(Boolean))];

  const handleOpenModal = (camp = null) => {
    setErrorMsg('');
    if (camp) {
      setEditingCamp(camp);
      setFormData({
        name: camp.name || '',
        district: camp.district || '',
        capacity: camp.capacity || '',
        currentfamilies: camp.currentfamilies ?? camp.current_families ?? 0,
        status: camp.status || 'Active'
      });
    } else {
      setEditingCamp(null);
      setFormData({ name: '', district: '', capacity: '', currentfamilies: 0, status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const capacityNum = Number(formData.capacity);
    const familiesNum = Number(formData.currentfamilies);

    if (!formData.name.trim() || !formData.district.trim()) {
      setErrorMsg('Camp name and district are required fields.');
      return;
    }
    if (capacityNum <= 0) {
      setErrorMsg('Capacity must be a positive number greater than zero.');
      return;
    }
    if (familiesNum < 0) {
      setErrorMsg('Current families cannot be negative.');
      return;
    }

    // Rule: Auto-mark camp 'Full' if currentfamilies >= capacity
    let finalStatus = formData.status;
    if (formData.status !== 'Closed' && familiesNum >= capacityNum) {
      finalStatus = 'Full';
    } else if (formData.status === 'Full' && familiesNum < capacityNum) {
      finalStatus = 'Active';
    }

    const payload = {
      ...formData,
      capacity: capacityNum,
      currentfamilies: familiesNum,
      current_families: familiesNum,
      status: finalStatus,
      id: editingCamp ? editingCamp.id : `c_${Date.now()}`
    };

    try {
      if (onSaveCamp) {
        await onSaveCamp(payload, editingCamp !== null);
      }
      setShowModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Error saving camp entry');
    }
  };

  const filteredCamps = safeCamps.filter(c => {
    if (!c) return false;
    const campName = String(c.name || '').toLowerCase();
    const campDistrict = String(c.district || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = campName.includes(search) || campDistrict.includes(search);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesDistrict = districtFilter === 'All' || c.district === districtFilter || c.id === districtFilter;
    
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Bar */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Ground Registry</span>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-600" />
            Relief Camps Telemetry
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search camp or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-slate-800 text-xs font-bold pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white text-slate-700 text-xs font-bold rounded-2xl px-3.5 py-2.5 border border-slate-200 focus:outline-none shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Full">Full</option>
            <option value="Closed">Closed</option>
          </select>

          {/* District Filter */}
          {districts.length > 1 && (
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-white text-slate-700 text-xs font-bold rounded-2xl px-3.5 py-2.5 border border-slate-200 focus:outline-none shadow-sm"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
              ))}
            </select>
          )}

          {role === 'Admin' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-sky-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Register Camp
            </button>
          )}
        </div>
      </div>

      {/* Camps Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCamps.length === 0 ? (
          <div className="col-span-full glass-card rounded-3xl p-8 text-center text-slate-400 font-bold">
            No relief camps found matching your filter criteria.
          </div>
        ) : (
          filteredCamps.map((camp, idx) => {
            const fams = Number(camp.currentfamilies ?? camp.current_families ?? 0);
            const caps = Number(camp.capacity || 1);

            return (
              <div 
                key={camp.id || idx} 
                className="glass-card glass-card-hover rounded-3xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        {camp.district || 'Sindh'} District
                      </span>
                      <h3 className="text-slate-800 font-extrabold text-base mt-0.5">{camp.name}</h3>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      camp.status === 'Full' ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' :
                      camp.status === 'Closed' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {camp.status || 'Active'}
                    </span>
                  </div>

                  {/* Shelter Occupancy with CapacityGauge Ring */}
                  <div className="flex items-center justify-between mt-5 p-3.5 bg-sky-50/70 rounded-2xl border border-sky-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Shelter Occupancy
                      </span>
                      <span className="text-sm font-black text-slate-800">
                        {fams} / {caps} 
                        <span className="text-xs font-medium text-slate-500 ml-1">Families</span>
                      </span>
                    </div>

                    {/* Interactive SVG Progress Ring */}
                    <CapacityGauge 
                      current={fams} 
                      capacity={caps} 
                      size={56} 
                    />
                  </div>
                </div>

                {role === 'Admin' && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleOpenModal(camp)}
                      className="p-2 text-slate-400 hover:text-sky-600 rounded-xl hover:bg-sky-50 transition-colors"
                      title="Edit Camp"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onDeleteCamp && (
                      <button
                        onClick={() => onDeleteCamp(camp.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Delete Camp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Camp Creation / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-800">
                {editingCamp ? 'Edit Relief Camp' : 'Register New Relief Camp'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Camp Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dadu High School Camp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Dadu / Sukkur / Badin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Max Capacity (Families)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Current Families</label>
                  <input
                    type="number"
                    value={formData.currentfamilies}
                    onChange={(e) => setFormData({ ...formData, currentfamilies: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:border-sky-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl shadow-md shadow-sky-500/25"
                >
                  Save Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}