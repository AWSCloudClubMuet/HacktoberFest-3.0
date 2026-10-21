import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Camp, CampStatus } from '../types/index.ts';
import { CampModal } from '../components/modals/CampModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import {
  Tent,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Building,
} from 'lucide-react';

export const CampsPage: React.FC = () => {
  const { role, refreshKey, triggerRefresh, notify, setActiveTab, setPreselectedCampFilter } = useApp();

  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [campToEdit, setCampToEdit] = useState<Camp | null>(null);

  // Delete confirmation
  const [campToDelete, setCampToDelete] = useState<Camp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchCamps = async () => {
      setIsLoading(true);
      try {
        const data = await api.getCamps({
          search: search.trim() || undefined,
          district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        });
        if (mounted) setCamps(data);
      } catch (err) {
        console.error('Failed to load camps:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCamps();
    return () => {
      mounted = false;
    };
  }, [refreshKey, search, selectedDistrict, selectedStatus]);

  // Derived counts
  const totalCount = camps.length;
  const openCount = camps.filter((c) => c.status === 'Open').length;
  const fullCount = camps.filter((c) => c.status === 'Full').length;
  const closedCount = camps.filter((c) => c.status === 'Closed').length;

  const districts = useMemo(() => {
    const set = new Set(camps.map((c) => c.district));
    return ['all', ...Array.from(set).sort()];
  }, [camps]);

  const handleDeleteConfirm = async () => {
    if (!campToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteCamp(campToDelete.id);
      notify('success', 'Camp Deleted', `Successfully removed "${campToDelete.name}".`);
      triggerRefresh();
      setCampToDelete(null);
    } catch (err: any) {
      notify('error', 'Cannot Delete Camp', err.message || 'Camp has dependencies.');
      setCampToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewNeeds = (camp: Camp) => {
    setPreselectedCampFilter(camp.id);
    setActiveTab('needs');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#263242]">
            Relief Camps Directory
          </h1>
          <p className="text-xs text-[#697586] mt-0.5">
            Operational shelters across flood-inundated districts of Sindh.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => {
              setCampToEdit(null);
              setIsCampModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D6A85F]" />
            <span>Add Relief Camp</span>
          </button>
        ) : (
          <span className="text-xs text-[#697586] bg-[#F0ECE3] px-3 py-1.5 rounded-lg border border-[#E5E1D9]">
            Field Volunteer Mode (Read-Only)
          </span>
        )}
      </div>

      {/* 4 Summary Stat Pills (Unboxed Zero-Pill Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Total Camps</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {totalCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-emerald-800 block">Open (Accepting)</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {openCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-amber-800 block">Full (At Capacity)</span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {fullCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Closed (Decommissioned)</span>
          <span className="text-xl font-bold font-mono text-[#697586] tabular-nums">
            {closedCount}
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
            placeholder="Search camp or district..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center p-0.5 bg-[#F0ECE3] rounded-lg border border-[#E5E1D9] text-xs">
            {['all', 'Open', 'Full', 'Closed'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === s
                    ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                    : 'text-[#697586] hover:text-[#263242]'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* District Dropdown */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            <option value="all">All Districts</option>
            {districts.filter((d) => d !== 'all').map((d) => (
              <option key={d} value={d}>
                District: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Camp Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {camps.map((camp) => {
          const occupancyPct =
            camp.capacity > 0 ? Math.round((camp.current_families / camp.capacity) * 100) : 0;

          const statusColor = {
            Open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            Full: 'bg-amber-50 text-amber-800 border-amber-200',
            Closed: 'bg-slate-100 text-slate-600 border-slate-200',
          }[camp.status];

          return (
            <div
              key={camp.id}
              className="bg-white rounded-xl border border-[#E5E1D9] p-5 shadow-xs flex flex-col justify-between hover:border-[#D6A85F]/60 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#263242] truncate">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-[#697586] mt-0.5">
                      District: <span className="font-semibold text-[#263242]">{camp.district}</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 ${statusColor}`}
                  >
                    {camp.status}
                  </span>
                </div>

                {/* Family Occupancy Gauge */}
                <div className="mt-4 p-3 bg-[#F0ECE3]/50 rounded-lg border border-[#E5E1D9]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#697586] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#697586]" />
                      <span>Sheltered Families</span>
                    </span>
                    <span className="font-mono font-bold text-[#263242] tabular-nums">
                      {camp.current_families} / {camp.capacity} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E1D9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        camp.status === 'Closed'
                          ? 'bg-slate-400'
                          : occupancyPct >= 100
                          ? 'bg-amber-500'
                          : occupancyPct > 80
                          ? 'bg-[#D6A85F]'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-[#E5E1D9] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleViewNeeds(camp)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#202B3C] hover:text-[#172232] hover:bg-[#F0ECE3] rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D6A85F]" />
                  <span>View Needs</span>
                </button>

                {role === 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCampToEdit(camp);
                        setIsCampModalOpen(true);
                      }}
                      className="p-1.5 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-md transition-colors"
                      title="Edit camp parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampToDelete(camp)}
                      className="p-1.5 text-[#697586] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete camp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {camps.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white rounded-xl border border-[#E5E1D9]">
          <Building className="w-8 h-8 text-[#D6A85F] mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-[#263242]">No camps found matching criteria</p>
          <p className="text-xs text-[#697586] mt-1">Try resetting search query or district filters.</p>
        </div>
      )}

      {/* Add / Edit Camp Modal */}
      <CampModal
        isOpen={isCampModalOpen}
        onClose={() => {
          setIsCampModalOpen(false);
          setCampToEdit(null);
        }}
        campToEdit={campToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!campToDelete}
        onClose={() => setCampToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Relief Camp Record"
        message={`Are you sure you want to delete "${campToDelete?.name}"? The system will verify that no active needs, dispatches, or volunteer assignments depend on this camp.`}
        confirmLabel="Delete Camp"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
