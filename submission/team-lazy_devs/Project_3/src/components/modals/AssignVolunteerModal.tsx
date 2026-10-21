import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Volunteer, Camp } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { UserPlus, AlertCircle } from 'lucide-react';

interface AssignVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
  camps: Camp[];
}

export const AssignVolunteerModal: React.FC<AssignVolunteerModalProps> = ({
  isOpen,
  onClose,
  volunteer,
  camps,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [selectedCampId, setSelectedCampId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Explicitly filter out Closed camps
  const eligibleCamps = camps.filter((c) => c.status !== 'Closed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteer) return;
    setErrorMsg('');

    if (!selectedCampId) {
      setErrorMsg('Please select a camp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.assignVolunteer(volunteer.id, selectedCampId);
      notify(
        'success',
        'Volunteer Deployed',
        `Assigned ${volunteer.name} (${volunteer.skill}) to ${updated.camp_name || 'Camp'}.`
      );
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign volunteer.');
      notify('error', 'Assignment Failed', err.message || 'Could not assign volunteer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy Volunteer to Camp"
      subtitle={`Select an operational flood shelter for ${volunteer?.name || 'Volunteer'}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Personnel:</span>
            <span className="font-semibold text-slate-900">{volunteer?.name}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-500">Specialization:</span>
            <span className="font-semibold text-teal-700">{volunteer?.skill}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Relief Camp (Open / Full only) *
          </label>
          <select
            required
            value={selectedCampId}
            onChange={(e) => {
              setSelectedCampId(e.target.value);
              setErrorMsg('');
            }}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            <option value="">-- Choose destination camp --</option>
            {eligibleCamps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district}) — {c.status} ({c.current_families}/{c.capacity} families)
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Note: Decommissioned/Closed camps are automatically omitted to maintain personnel safety.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedCampId}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            <span>Confirm Assignment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
