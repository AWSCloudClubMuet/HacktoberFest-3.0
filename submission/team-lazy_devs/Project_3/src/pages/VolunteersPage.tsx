import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Volunteer, VolunteerSkill, Camp } from '../types/index.ts';
import { VolunteerModal } from '../components/modals/VolunteerModal.tsx';
import { AssignVolunteerModal } from '../components/modals/AssignVolunteerModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import {
  Users2,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  Stethoscope,
  Truck,
  UtensilsCrossed,
  Car,
  HeartPulse,
} from 'lucide-react';

export const VolunteersPage: React.FC = () => {
  const { role, refreshKey, triggerRefresh, notify } = useApp();

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [volunteerToEdit, setVolunteerToEdit] = useState<Volunteer | null>(null);

  // Assign modal
  const [volunteerToAssign, setVolunteerToAssign] = useState<Volunteer | null>(null);

  // Unassign confirmation
  const [volunteerToUnassign, setVolunteerToUnassign] = useState<Volunteer | null>(null);
  const [isUnassigning, setIsUnassigning] = useState(false);

  // Delete
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [volRes, campsRes] = await Promise.all([
          api.getVolunteers({
            skill: selectedSkill !== 'all' ? selectedSkill : undefined,
            assignedStatus: selectedStatus !== 'all' ? selectedStatus : undefined,
            search: search.trim() || undefined,
          }),
          api.getCamps(),
        ]);

        if (mounted) {
          setVolunteers(volRes);
          setCamps(campsRes);
        }
      } catch (err) {
        console.error('Failed to load volunteers:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [refreshKey, selectedSkill, selectedStatus, search]);

  const totalVolunteers = volunteers.length;
  const deployedCount = volunteers.filter((v) => v.camp_id !== null).length;
  const availableCount = volunteers.filter((v) => v.camp_id === null).length;

  const handleUnassignConfirm = async () => {
    if (!volunteerToUnassign) return;
    setIsUnassigning(true);
    try {
      await api.unassignVolunteer(volunteerToUnassign.id);
      notify('info', 'Volunteer Unassigned', `${volunteerToUnassign.name} is now on standby availability.`);
      triggerRefresh();
      setVolunteerToUnassign(null);
    } catch (err: any) {
      notify('error', 'Unassign Failed', err.message || 'Could not unassign volunteer.');
      setVolunteerToUnassign(null);
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!volunteerToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteVolunteer(volunteerToDelete.id);
      notify('success', 'Volunteer Removed', `Removed ${volunteerToDelete.name} from records.`);
      triggerRefresh();
      setVolunteerToDelete(null);
    } catch (err: any) {
      notify('error', 'Delete Failed', err.message || 'Could not delete volunteer.');
      setVolunteerToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const skillIcon = (skill: VolunteerSkill) => {
    switch (skill) {
      case 'Medical':
        return <Stethoscope className="w-3.5 h-3.5 text-teal-600" />;
      case 'Logistics':
        return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case 'Cooking':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />;
      case 'Driving':
        return <Car className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Counselling':
        return <HeartPulse className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#263242]">
            Relief Volunteer Force
          </h1>
          <p className="text-xs text-[#697586] mt-0.5">
            Doctors, supply coordinators, cooks, drivers, and trauma counselors deployed across camps.
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => {
              setVolunteerToEdit(null);
              setIsVolunteerModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D6A85F]" />
            <span>Register Volunteer</span>
          </button>
        ) : (
          <span className="text-xs text-[#697586] bg-[#F0ECE3] px-3 py-1.5 rounded-lg border border-[#E5E1D9]">
            Field Volunteer Mode (Read-Only)
          </span>
        )}
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#E5E1D9] shadow-xs">
        <div>
          <span className="text-[11px] font-medium text-[#697586] block">Total Volunteer Roster</span>
          <span className="text-xl font-bold font-mono text-[#263242] tabular-nums">
            {totalVolunteers}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-emerald-800 block">Deployed to Camps</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {deployedCount}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-amber-800 block">Available on Standby</span>
          <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {availableCount}
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
            placeholder="Search volunteer name or skill..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] text-[#263242]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Assignment Status Tabs */}
          <div className="flex items-center p-0.5 bg-[#F0ECE3] rounded-lg border border-[#E5E1D9] text-xs">
            {['all', 'assigned', 'available'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === s
                    ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                    : 'text-[#697586] hover:text-[#263242]'
                }`}
              >
                {s === 'all' ? 'All' : s === 'assigned' ? 'Deployed' : 'Standby'}
              </button>
            ))}
          </div>

          {/* Skill Selector */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6A85F]/20 focus:border-[#D6A85F] bg-white text-[#263242]"
          >
            <option value="all">All Specializations</option>
            <option value="Medical">Medical</option>
            <option value="Logistics">Logistics</option>
            <option value="Cooking">Cooking</option>
            <option value="Driving">Driving</option>
            <option value="Counselling">Counselling</option>
          </select>
        </div>
      </div>

      {/* Volunteer Table */}
      <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0ECE3] text-[#263242] font-semibold border-b border-[#E5E1D9]">
              <tr>
                <th className="px-5 py-3">Volunteer Name</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Deployment Status</th>
                <th className="px-4 py-3">Assigned Camp & District</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D9] font-medium text-[#263242]">
              {volunteers.map((vol) => {
                const isAssigned = vol.camp_id !== null;
                return (
                  <tr key={vol.id} className="hover:bg-[#F0ECE3]/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#263242]">
                      {vol.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0ECE3] text-[#263242] border border-[#E5E1D9]">
                        {skillIcon(vol.skill)}
                        <span>{vol.skill}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isAssigned ? (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200">
                          Deployed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-[#F0ECE3] text-[#697586] border-[#E5E1D9]">
                          Standby / Ready
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isAssigned ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#263242]">{vol.camp_name}</span>
                          <span className="text-[11px] text-[#697586]">District: {vol.camp_district}</span>
                        </div>
                      ) : (
                        <span className="text-[#697586] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {role === 'admin' ? (
                        <div className="inline-flex items-center gap-1.5">
                          {isAssigned ? (
                            <button
                              type="button"
                              onClick={() => setVolunteerToUnassign(vol)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#263242] hover:text-[#172232] bg-[#F0ECE3] hover:bg-[#E5E1D9] rounded-md transition-colors inline-flex items-center gap-1 border border-[#E5E1D9]"
                              title="Unassign from camp"
                            >
                              <UserMinus className="w-3 h-3 text-[#697586]" />
                              <span>Unassign</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setVolunteerToAssign(vol)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
                              title="Assign to open/full camp"
                            >
                              <UserPlus className="w-3 h-3 text-[#D6A85F]" />
                              <span>Deploy</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setVolunteerToEdit(vol);
                              setIsVolunteerModalOpen(true);
                            }}
                            className="p-1.5 text-[#697586] hover:text-[#263242] hover:bg-[#F0ECE3] rounded-md transition-colors"
                            title="Edit volunteer details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVolunteerToDelete(vol)}
                            className="p-1.5 text-[#697586] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete volunteer"
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

        {volunteers.length === 0 && !isLoading && (
          <div className="p-12 text-center bg-white">
            <Users2 className="w-8 h-8 text-[#697586] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#263242]">No volunteers found</p>
            <p className="text-xs text-[#697586] mt-1">Register new personnel or adjust filters.</p>
          </div>
        )}
      </div>

      {/* Volunteer Modal (Add / Edit) */}
      <VolunteerModal
        isOpen={isVolunteerModalOpen}
        onClose={() => {
          setIsVolunteerModalOpen(false);
          setVolunteerToEdit(null);
        }}
        volunteerToEdit={volunteerToEdit}
        camps={camps}
      />

      {/* Assign Volunteer Modal */}
      <AssignVolunteerModal
        isOpen={!!volunteerToAssign}
        onClose={() => setVolunteerToAssign(null)}
        volunteer={volunteerToAssign}
        camps={camps}
      />

      {/* Unassign Confirmation */}
      <ConfirmDialog
        isOpen={!!volunteerToUnassign}
        onClose={() => setVolunteerToUnassign(null)}
        onConfirm={handleUnassignConfirm}
        title="Unassign Volunteer from Camp"
        message={`Are you sure you want to unassign ${volunteerToUnassign?.name} from "${volunteerToUnassign?.camp_name}"? They will return to the active standby roster.`}
        confirmLabel="Unassign Volunteer"
        isLoading={isUnassigning}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!volunteerToDelete}
        onClose={() => setVolunteerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Volunteer Record"
        message={`Remove ${volunteerToDelete?.name} (${volunteerToDelete?.skill}) from the relief register?`}
        confirmLabel="Delete Volunteer"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
