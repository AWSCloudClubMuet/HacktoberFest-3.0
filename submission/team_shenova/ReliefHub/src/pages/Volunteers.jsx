import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { validateVolunteer } from '../utils/validation';

export default function Volunteers({ 
  volunteers = [], 
  camps = [], 
  userRole = 'Admin', 
  onCreateVolunteer, 
  onUpdateVolunteer, 
  onDeleteVolunteer 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [activeVolunteer, setActiveVolunteer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    skill: 'Medical',
    camp_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campMap = {};
  camps.forEach(c => { campMap[String(c.id)] = c; });

  const skills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];

  const filteredVolunteers = volunteers.filter(vol => {
    const matchesSearch = (vol.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkill === 'all' || vol.skill === selectedSkill;
    const isAssigned = vol.camp_id && String(vol.camp_id).trim() !== '';
    const matchesAssignment = 
      assignmentFilter === 'all' ? true :
      assignmentFilter === 'assigned' ? isAssigned :
      !isAssigned;

    return matchesSearch && matchesSkill && matchesAssignment;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      skill: 'Medical',
      camp_id: ''
    });
    setFormErrors({});
    setModalMode('create');
  };

  const handleOpenEdit = (volunteer) => {
    setActiveVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      skill: volunteer.skill,
      camp_id: volunteer.camp_id ? String(volunteer.camp_id) : ''
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleOpenView = (volunteer) => {
    setActiveVolunteer(volunteer);
    setModalMode('view');
  };

  const handleOpenDelete = (volunteer) => {
    setActiveVolunteer(volunteer);
    setModalMode('delete');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveVolunteer(null);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleSaveVolunteer = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      skill: formData.skill,
      camp_id: formData.camp_id ? formData.camp_id : null
    };

    const { isValid, errors } = validateVolunteer(payload, camps);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await onCreateVolunteer(payload);
      } else if (modalMode === 'edit') {
        await onUpdateVolunteer(activeVolunteer.id, payload);
      }
      handleCloseModal();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeVolunteer) return;
    setIsSubmitting(true);
    try {
      await onDeleteVolunteer(activeVolunteer.id);
      handleCloseModal();
    } catch (err) {
      setFormErrors({ delete: err.message || 'Failed to delete volunteer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Volunteer Name',
      key: 'name',
      render: (vol) => (
        <div>
          <span className="font-semibold text-slate-800">{vol.name}</span>
          <div className="table-sub-detail">ID: {vol.id}</div>
        </div>
      )
    },
    {
      header: 'Specialized Skill',
      key: 'skill',
      render: (vol) => <span className="skill-tag">{vol.skill}</span>
    },
    {
      header: 'Assigned Camp',
      key: 'camp',
      render: (vol) => {
        if (!vol.camp_id) {
          return <span className="text-muted text-xs">Unassigned (Reserve)</span>;
        }
        const camp = campMap[String(vol.camp_id)];
        return (
          <div>
            <span className="font-medium text-slate-800">{camp?.name || 'Camp'}</span>
            <div className="table-sub-detail">{camp?.district}</div>
          </div>
        );
      }
    },
    {
      header: 'Deployment Status',
      key: 'status',
      render: (vol) => {
        const isAssigned = vol.camp_id && String(vol.camp_id).trim() !== '';
        return isAssigned ? (
          <span className="status-badge badge-teal">
            <UserCheck size={11} className="inline mr-1" /> Deployed
          </span>
        ) : (
          <span className="status-badge badge-neutral">
            <UserX size={11} className="inline mr-1" /> Standby
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (vol) => (
        <div className="table-actions-cell">
          <button
            type="button"
            className="action-icon-btn view"
            onClick={() => handleOpenView(vol)}
            title="View volunteer"
          >
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="action-icon-btn edit"
                onClick={() => handleOpenEdit(vol)}
                title="Edit volunteer"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-icon-btn delete"
                onClick={() => handleOpenDelete(vol)}
                title="Delete volunteer"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-volunteers">
      <DataTable
        columns={columns}
        data={filteredVolunteers}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search volunteers by full name..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="vol-skill-filter" className="sr-only">Filter by skill</label>
              <select
                id="vol-skill-filter"
                className="table-filter-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="all">All Operational Skills</option>
                {skills.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor="vol-assign-filter" className="sr-only">Filter by assignment</label>
              <select
                id="vol-assign-filter"
                className="table-filter-select"
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
              >
                <option value="all">All Deployment Statuses</option>
                <option value="assigned">Deployed to Camp</option>
                <option value="unassigned">Standby / Unassigned</option>
              </select>
            </div>
          </>
        }
        actionComponent={
          isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Register Volunteer</span>
            </button>
          )
        }
        emptyMessage="No volunteer personnel match your search or filter."
      />

      {/* Create / Edit Volunteer Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={modalMode === 'create' ? 'Register Volunteer Responder' : `Edit Volunteer: ${activeVolunteer?.name}`}
        >
          <form onSubmit={handleSaveVolunteer} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="vol-name">Full Name *</label>
              <input
                id="vol-name"
                type="text"
                required
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="e.g. Dr. Ayesha Memon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="vol-skill">Specialized Skill *</label>
              <select
                id="vol-skill"
                className="form-select"
                value={formData.skill}
                onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
              >
                {skills.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vol-camp-select">Camp Deployment Assignment</label>
              <select
                id="vol-camp-select"
                className={`form-select ${formErrors.camp_id ? 'error' : ''}`}
                value={formData.camp_id}
                onChange={(e) => setFormData({ ...formData, camp_id: e.target.value })}
              >
                <option value="">None (Standby Reserve)</option>
                {camps.map(c => (
                  <option 
                    key={c.id} 
                    value={c.id}
                    disabled={c.status === 'Closed'}
                  >
                    {c.name} ({c.district}) - {c.status} {c.status === 'Closed' ? '(Disabled)' : ''}
                  </option>
                ))}
              </select>
              {formErrors.camp_id && (
                <span className="field-error-msg">{formErrors.camp_id}</span>
              )}
              <span className="field-helper-text">
                Volunteers can only be assigned to Active or Full camps. Closed camps cannot receive personnel.
              </span>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Register Volunteer' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Volunteer Modal */}
      {modalMode === 'view' && activeVolunteer && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Volunteer Profile: ${activeVolunteer.name}`}
        >
          <div className="details-view-grid">
            <div className="detail-item">
              <span className="detail-label">Volunteer ID</span>
              <span className="detail-value font-mono">{activeVolunteer.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Operational Skill</span>
              <span className="detail-value font-semibold">{activeVolunteer.skill}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Deployment Status</span>
              {activeVolunteer.camp_id ? (
                <StatusBadge status="Active" />
              ) : (
                <StatusBadge status="Closed" />
              )}
            </div>
            <div className="detail-item">
              <span className="detail-label">Assigned Camp</span>
              <span className="detail-value font-medium">
                {campMap[String(activeVolunteer.camp_id)]?.name || 'Unassigned (Reserve Pool)'}
              </span>
            </div>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Volunteer Modal */}
      {modalMode === 'delete' && activeVolunteer && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Confirm Volunteer Removal"
        >
          <div className="delete-confirm-body">
            <p>
              Are you sure you want to remove <strong>{activeVolunteer.name}</strong> from the volunteer registry?
            </p>
            {formErrors.delete && (
              <div className="form-error-banner mt-3">{formErrors.delete}</div>
            )}
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Volunteer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
