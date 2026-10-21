import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Volunteer, VolunteerSkill, Camp } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteerToEdit?: Volunteer | null;
  camps: Camp[];
}

const SKILLS: VolunteerSkill[] = [
  'Medical',
  'Logistics',
  'Cooking',
  'Driving',
  'Counselling',
];

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  onClose,
  volunteerToEdit,
  camps,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [name, setName] = useState('');
  const [skill, setSkill] = useState<VolunteerSkill>('Medical');
  const [campId, setCampId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const eligibleCamps = camps.filter((c) => c.status !== 'Closed');

  useEffect(() => {
    if (volunteerToEdit) {
      setName(volunteerToEdit.name);
      setSkill(volunteerToEdit.skill);
      setCampId(volunteerToEdit.camp_id || '');
    } else {
      setName('');
      setSkill('Medical');
      setCampId('');
    }
    setErrorMsg('');
  }, [volunteerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Volunteer name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (volunteerToEdit) {
        await api.updateVolunteer(volunteerToEdit.id, {
          name: name.trim(),
          skill,
        });
        notify('success', 'Volunteer Updated', `Updated details for ${name.trim()}.`);
      } else {
        await api.registerVolunteer({
          name: name.trim(),
          skill,
          camp_id: campId ? campId : null,
        });
        notify('success', 'Volunteer Registered', `Registered ${name.trim()} (${skill}).`);
      }
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save volunteer.');
      notify('error', 'Operation Failed', err.message || 'Could not register volunteer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={volunteerToEdit ? 'Edit Volunteer Profile' : 'Register Relief Volunteer'}
      subtitle="Onboard specialized relief personnel for frontline deployment in Sindh camps."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Ayesha Baloch"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Specialized Skill *
          </label>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value as VolunteerSkill)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s} ({s === 'Medical' ? 'Doctors/Paramedics' : s === 'Logistics' ? 'Supply Coordinators' : s === 'Cooking' ? 'Community Kitchen' : s === 'Driving' ? 'Boat & 4x4 Transport' : 'Trauma Support'})
              </option>
            ))}
          </select>
        </div>

        {!volunteerToEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Camp Deployment (Optional)
            </label>
            <select
              value={campId}
              onChange={(e) => setCampId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="">Standby / Unassigned (Available)</option>
              {eligibleCamps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.district} ({c.status})
                </option>
              ))}
            </select>
          </div>
        )}

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
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{volunteerToEdit ? 'Save Changes' : 'Register Volunteer'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
