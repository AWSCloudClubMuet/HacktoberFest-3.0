import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Camp, CampStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';

interface CampModalProps {
  isOpen: boolean;
  onClose: () => void;
  campToEdit?: Camp | null;
}

const SINDH_DISTRICTS = [
  'Dadu',
  'Badin',
  'Larkana',
  'Sukkur',
  'Thatta',
  'Hyderabad',
  'Naushahro Feroze',
  'Khairpur',
  'Jacobabad',
  'Sujawal',
  'Mirpur Khas',
];

export const CampModal: React.FC<CampModalProps> = ({
  isOpen,
  onClose,
  campToEdit,
}) => {
  const { notify, triggerRefresh } = useApp();
  const [name, setName] = useState('');
  const [district, setDistrict] = useState(SINDH_DISTRICTS[0]);
  const [capacity, setCapacity] = useState<number>(200);
  const [currentFamilies, setCurrentFamilies] = useState<number>(0);
  const [status, setStatus] = useState<CampStatus>('Open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (campToEdit) {
      setName(campToEdit.name);
      setDistrict(campToEdit.district);
      setCapacity(campToEdit.capacity);
      setCurrentFamilies(campToEdit.current_families);
      setStatus(campToEdit.status);
    } else {
      setName('');
      setDistrict(SINDH_DISTRICTS[0]);
      setCapacity(200);
      setCurrentFamilies(0);
      setStatus('Open');
    }
    setErrorMsg('');
  }, [campToEdit, isOpen]);

  // Dynamic status preview based on capacity rule
  const previewStatus = (): CampStatus => {
    if (status === 'Closed') return 'Closed';
    if (currentFamilies >= capacity) return 'Full';
    return 'Open';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Camp name is required.');
      return;
    }
    if (capacity <= 0) {
      setErrorMsg('Capacity must be a positive integer.');
      return;
    }
    if (currentFamilies < 0) {
      setErrorMsg('Current families cannot be negative.');
      return;
    }
    if (currentFamilies > capacity) {
      setErrorMsg(`Current families (${currentFamilies}) cannot exceed capacity (${capacity}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (campToEdit) {
        await api.updateCamp(campToEdit.id, {
          name: name.trim(),
          district,
          capacity: Number(capacity),
          current_families: Number(currentFamilies),
          status,
        });
        notify('success', 'Camp Updated', `Updated details for "${name.trim()}".`);
      } else {
        await api.createCamp({
          name: name.trim(),
          district,
          capacity: Number(capacity),
          current_families: Number(currentFamilies),
          status,
        });
        notify('success', 'Camp Created', `Successfully registered "${name.trim()}".`);
      }
      triggerRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save camp.');
      notify('error', 'Operation Failed', err.message || 'Could not save camp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campToEdit ? 'Edit Relief Camp' : 'Register New Relief Camp'}
      subtitle="Define camp capacity, location in Sindh, and current sheltered families."
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
            Camp Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dadu Bypass High School Shelter"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              District (Sindh) *
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              {SINDH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="Open">Open (Auto Full if at capacity)</option>
              <option value="Closed">Closed (Inundated / Decommissioned)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Family Capacity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Sheltered Families *
            </label>
            <input
              type="number"
              min="0"
              max={capacity}
              required
              value={currentFamilies}
              onChange={(e) => setCurrentFamilies(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Calculated Status Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-600">Calculated Occupancy:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-900">
              {capacity > 0 ? Math.round((currentFamilies / capacity) * 100) : 0}%
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-teal-700">
              Resulting Status: {previewStatus()}
            </span>
          </div>
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
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{campToEdit ? 'Save Changes' : 'Register Camp'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
