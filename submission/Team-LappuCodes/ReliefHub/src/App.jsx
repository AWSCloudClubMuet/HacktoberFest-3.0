import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CampManager from './components/CampManager';
import InventoryNeeds from './components/InventoryNeeds';
import DispatchManager from './components/DispatchManager';
import VolunteerDonations from './components/VolunteerDonations';
import SindhFloodTicker from './components/SindhFloodTicker';
import { api } from './services/api';

export default function App() {
  // Navigation & Role States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('Admin'); // 'Admin' vs 'Volunteer'
  const [selectedCampFilter, setSelectedCampFilter] = useState('All');
  const [prefilledDispatch, setPrefilledDispatch] = useState(null);

  // Backend Synchronized States (Declared FIRST before any functions/computations)
  const [camps, setCamps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Synchronize Telemetry from Mock API
  const fetchAllData = async () => {
    try {
      const [c, i, n, d, dn, v] = await Promise.all([
        api.get('camps'),
        api.get('inventory'),
        api.get('needs'),
        api.get('dispatches'),
        api.get('donations'),
        api.get('volunteers')
      ]);
      setCamps(Array.isArray(c) ? c : []);
      setInventory(Array.isArray(i) ? i : []);
      setNeeds(Array.isArray(n) ? n : []);
      setDispatches(Array.isArray(d) ? d : []);
      setDonations(Array.isArray(dn) ? dn : []);
      setVolunteers(Array.isArray(v) ? v : []);
    } catch (e) {
      console.error("Telemetry API synchronization failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute critical gaps count for Navbar warning badge AFTER states are initialized
  const criticalCount = needs.filter(n => {
    const req = Number(n.requiredquantity || n.required_quantity || 1);
    const ful = Number(n.fulfilledquantity || n.fulfilled_quantity || 0);
    return (n.priority || '').toLowerCase() === 'high' && Math.round((ful / req) * 100) < 40;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono text-xs gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="animate-pulse text-cyan-400 tracking-wider">INITIALIZING RELIEF HUB TELEMETRY...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        criticalCount={criticalCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sindh Hydro Telemetry Ticker */}
        <SindhFloodTicker />

        {activeTab === 'dashboard' && (
          <Dashboard
            camps={camps}
            inventory={inventory}
            needs={needs}
            volunteers={volunteers}
            setActiveTab={setActiveTab}
            setSelectedCampFilter={setSelectedCampFilter}
          />
        )}

        {activeTab === 'camps' && (
          <CampManager
            camps={camps}
            role={role}
            initialCampFilter={selectedCampFilter}
            onSaveCamp={async (camp, isEdit) => {
              if (isEdit) await api.patch(`camps/${camp.id}`, camp);
              else await api.post('camps', camp);
              await fetchAllData();
            }}
            onDeleteCamp={async (id) => {
              await api.delete(`camps/${id}`);
              await fetchAllData();
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryNeeds
            inventory={inventory}
            needs={needs}
            camps={camps}
            role={role}
            onSaveInventory={async (item, isEdit) => {
              if (isEdit) await api.patch(`inventory/${item.id}`, item);
              else await api.post('inventory', item);
              await fetchAllData();
            }}
            onDeleteInventory={async (id) => {
              await api.delete(`inventory/${id}`);
              await fetchAllData();
            }}
            onSaveNeed={async (need) => {
              await api.post('needs', need);
              await fetchAllData();
            }}
            onDeleteNeed={async (id) => {
              await api.delete(`needs/${id}`);
              await fetchAllData();
            }}
            onQuickDispatchMatch={(need, stockItem) => {
              const req = Number(need.requiredquantity || need.required_quantity || 0);
              const ful = Number(need.fulfilledquantity || need.fulfilled_quantity || 0);
              const remainingNeeded = Math.max(0, req - ful);
              const allocatable = Math.min(Number(stockItem.stock || 0), remainingNeeded);

              setPrefilledDispatch({
                camp_id: need.camp_id || need.campid,
                inventory_id: stockItem.id,
                need_id: need.id,
                quantity: allocatable
              });
              setActiveTab('dispatches');
            }}
          />
        )}

        {activeTab === 'dispatches' && (
          <DispatchManager
            dispatches={dispatches}
            camps={camps}
            inventory={inventory}
            needs={needs}
            role={role}
            prefilledDispatch={prefilledDispatch}
            clearPrefilledDispatch={() => setPrefilledDispatch(null)}
            onCreateDispatch={async (data) => {
              await api.createDispatch(data);
              await fetchAllData();
            }}
            onUpdateStatus={async (dispatch, newStatus, stockItem, needItem) => {
              await api.updateDispatchStatus(dispatch, newStatus, stockItem, needItem);
              await fetchAllData();
            }}
          />
        )}

        {(activeTab === 'donations' || activeTab === 'donations-volunteers') && (
          <VolunteerDonations
            donations={donations}
            volunteers={volunteers}
            camps={camps}
            inventory={inventory}
            role={role}
            onRecordDonation={async (data, stockItem) => {
              await api.recordDonation(data, stockItem);
              await fetchAllData();
            }}
            onAssignVolunteer={async (volId, campId) => {
              await api.patch(`volunteers/${volId}`, { camp_id: campId });
              await fetchAllData();
            }}
          />
        )}
      </main>
    </div>
  );
}