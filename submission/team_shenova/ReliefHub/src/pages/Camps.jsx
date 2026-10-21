import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, MapPin, ShieldAlert } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { validateCamp } from '../utils/validation';

export default function Camps({ 
  camps = [], 
  needs = [],
  userRole = 'Admin', 
  onCreateCamp, 
  onUpdateCamp, 
  onDeleteCamp,
  initialFilter = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter);

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [activeCamp, setActiveCamp] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    capacity: '',
    current_families: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique districts
  const districts = Array.from(new Set(camps.map(c => c.district).filter(Boolean)));

  // Filtered camps
  const filteredCamps = camps.filter(camp => {
    const matchesSearch = (camp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || camp.district === selectedDistrict;
    const matchesStatus = selectedStatus === 'all' || camp.status === selectedStatus;
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      district: districts[0] || 'Sukkur',
      capacity: '500',
      current_families: '0',
      status: 'Active'
    });
    setFormErrors({});
    setModalMode('create');
  };

  const handleOpenEdit = (camp) => {
    setActiveCamp(camp);
    setFormData({
      name: camp.name,
      district: camp.district,
      capacity: String(camp.capacity),
      current_families: String(camp.current_families),
      status: camp.status
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleOpenView = (camp) => {
    setActiveCamp(camp);
    setModalMode('view');
  };

  const handleOpenDelete = (camp) => {
    setActiveCamp(camp);
    setModalMode('delete');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveCamp(null);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleSaveCamp = async (e) => {
    e.preventDefault();
    const capNum = Number(formData.capacity);
    const famNum = Number(formData.current_families);

    // Automatic status rule calculation
    let calculatedStatus = formData.status;
    if (formData.status !== 'Closed') {
      if (famNum >= capNum) {
        calculatedStatus = 'Full';
      } else {
        calculatedStatus = 'Active';
      }
    }

    const payload = {
      name: formData.name.trim(),
      district: formData.district.trim(),
      capacity: capNum,
      current_families: famNum,
      status: calculatedStatus
    };

    const { isValid, errors } = validateCamp(payload);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await onCreateCamp(payload);
      } else if (modalMode === 'edit') {
        await onUpdateCamp(activeCamp.id, payload);
      }
      handleCloseModal();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeCamp) return;
    setIsSubmitting(true);
    try {
      await onDeleteCamp(activeCamp.id);
      handleCloseModal();
    } catch (err) {
      setFormErrors({ delete: err.message || 'Failed to delete camp' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Camp Name',
      key: 'name',
      render: (camp) => (
        <div>
          <span className="font-semibold text-slate-800">{camp.name}</span>
          <div className="table-sub-detail">ID: {camp.id}</div>
        </div>
      )
    },
    {
      header: 'District',
      key: 'district',
      render: (camp) => (
        <span className="district-pill">
          <MapPin size={12} /> {camp.district}
        </span>
      )
    },
    {
      header: 'Capacity',
      key: 'capacity',
      render: (camp) => `${camp.capacity.toLocaleString()} families`
    },
    {
      header: 'Sheltered',
      key: 'current_families',
      render: (camp) => `${camp.current_families.toLocaleString()} families`
    },
    {
      header: 'Occupancy Rate',
      key: 'occupancy',
      width: '180px',
      render: (camp) => (
        <ProgressBar
          value={camp.current_families}
          max={camp.capacity}
          variant="occupancy"
          size="sm"
        />
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (camp) => <StatusBadge status={camp.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (camp) => (
        <div className="table-actions-cell">
          <button
            type="button"
            className="action-icon-btn view"
            onClick={() => handleOpenView(camp)}
            title="View camp details"
          >
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="action-icon-btn edit"
                onClick={() => handleOpenEdit(camp)}
                title="Edit camp"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-icon-btn delete"
                onClick={() => handleOpenDelete(camp)}
                title="Delete camp"
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
    <div className="page-camps">
      <DataTable
        columns={columns}
        data={filteredCamps}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by camp name..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="camp-district-filter" className="sr-only">Filter by district</label>
              <select
                id="camp-district-filter"
                className="table-filter-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="all">All Districts</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor="camp-status-filter" className="sr-only">Filter by status</label>
              <select
                id="camp-status-filter"
                className="table-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Full">Full</option>
                <option value="Closed">Closed</option>
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
              <span>Register New Camp</span>
            </button>
          )
        }
        emptyMessage="No camps match your search and filter criteria."
      />

      {/* Create / Edit Camp Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={modalMode === 'create' ? 'Register New Relief Camp' : `Edit Camp: ${activeCamp?.name}`}
        >
          <form onSubmit={handleSaveCamp} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="camp-name">Camp Name *</label>
              <input
                id="camp-name"
                type="text"
                required
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="e.g. Al-Khidmat Relief Camp Sukkur"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="camp-district">District *</label>
                <input
                  id="camp-district"
                  type="text"
                  required
                  className={`form-input ${formErrors.district ? 'error' : ''}`}
                  placeholder="e.g. Sukkur, Dadu, Larkana"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
                {formErrors.district && <span className="field-error-msg">{formErrors.district}</span>}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="camp-status">Operating Status *</label>
                <select
                  id="camp-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
                <span className="field-helper-text">
                  Note: Active camps automatically become Full when families reach capacity.
                </span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="camp-capacity">Capacity (Max Families) *</label>
                <input
                  id="camp-capacity"
                  type="number"
                  min="1"
                  required
                  className={`form-input ${formErrors.capacity ? 'error' : ''}`}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
                {formErrors.capacity && <span className="field-error-msg">{formErrors.capacity}</span>}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="camp-families">Current Sheltered Families *</label>
                <input
                  id="camp-families"
                  type="number"
                  min="0"
                  required
                  className={`form-input ${formErrors.current_families ? 'error' : ''}`}
                  value={formData.current_families}
                  onChange={(e) => setFormData({ ...formData, current_families: e.target.value })}
                />
                {formErrors.current_families && <span className="field-error-msg">{formErrors.current_families}</span>}
              </div>
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
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Camp' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Camp Details Modal */}
      {modalMode === 'view' && activeCamp && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Camp Details: ${activeCamp.name}`}
        >
          <div className="details-view-grid">
            <div className="detail-item">
              <span className="detail-label">District</span>
              <span className="detail-value">{activeCamp.district}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <StatusBadge status={activeCamp.status} />
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Capacity</span>
              <span className="detail-value">{activeCamp.capacity.toLocaleString()} families</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Current Families</span>
              <span className="detail-value">{activeCamp.current_families.toLocaleString()} families</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Occupancy Gauge</span>
              <ProgressBar
                value={activeCamp.current_families}
                max={activeCamp.capacity}
                variant="occupancy"
                size="lg"
              />
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Associated Camp Needs</span>
              <div className="needs-summary-list">
                {needs.filter(n => String(n.camp_id) === String(activeCamp.id)).length === 0 ? (
                  <p className="text-muted text-sm">No recorded needs for this camp.</p>
                ) : (
                  needs
                    .filter(n => String(n.camp_id) === String(activeCamp.id))
                    .map(n => (
                      <div key={n.id} className="mini-need-pill">
                        <span>Required: {n.required_quantity} • Fulfilled: {n.fulfilled_quantity}</span>
                        <StatusBadge status={n.priority} />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && activeCamp && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Confirm Camp Deletion"
        >
          <div className="delete-confirm-body">
            <ShieldAlert size={36} className="text-red delete-icon" />
            <p>
              Are you sure you want to delete <strong>{activeCamp.name}</strong> ({activeCamp.district})?
            </p>
            {needs.some(n => String(n.camp_id) === String(activeCamp.id)) && (
              <div className="delete-warning-box">
                <strong>Warning:</strong> This camp has associated recorded needs. Deletion will be rejected by the server to protect data integrity until all needs are resolved.
              </div>
            )}
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
                {isSubmitting ? 'Deleting...' : 'Delete Camp'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
