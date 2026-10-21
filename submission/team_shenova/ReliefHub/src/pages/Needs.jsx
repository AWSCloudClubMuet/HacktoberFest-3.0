import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, ArrowRight } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { calculateRemainingDemand } from '../utils/calculations';
import { validateNeed } from '../utils/validation';

export default function Needs({ 
  needs = [], 
  camps = [], 
  inventory = [], 
  dispatches = [],
  userRole = 'Admin', 
  onCreateNeed, 
  onUpdateNeed, 
  onDeleteNeed,
  onNavigateToDispatch
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCamp, setSelectedCamp] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [activeNeed, setActiveNeed] = useState(null);
  const [formData, setFormData] = useState({
    camp_id: '',
    inventory_item_id: '',
    required_quantity: '',
    fulfilled_quantity: '0',
    priority: 'High'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campMap = {};
  camps.forEach(c => { campMap[String(c.id)] = c; });

  const invMap = {};
  inventory.forEach(i => { invMap[String(i.id)] = i; });

  // Filtered Needs
  const filteredNeeds = needs.filter(need => {
    const camp = campMap[String(need.camp_id)] || {};
    const item = invMap[String(need.inventory_item_id)] || {};
    const matchesSearch = 
      (camp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (camp.district || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCamp = selectedCamp === 'all' || String(need.camp_id) === String(selectedCamp);
    const matchesPriority = selectedPriority === 'all' || need.priority === selectedPriority;

    return matchesSearch && matchesCamp && matchesPriority;
  });

  const handleOpenCreate = () => {
    setFormData({
      camp_id: camps[0]?.id || '',
      inventory_item_id: inventory[0]?.id || '',
      required_quantity: '300',
      fulfilled_quantity: '0',
      priority: 'High'
    });
    setFormErrors({});
    setModalMode('create');
  };

  const handleOpenEdit = (need) => {
    setActiveNeed(need);
    setFormData({
      camp_id: String(need.camp_id),
      inventory_item_id: String(need.inventory_item_id),
      required_quantity: String(need.required_quantity),
      fulfilled_quantity: String(need.fulfilled_quantity || 0),
      priority: need.priority
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleOpenView = (need) => {
    setActiveNeed(need);
    setModalMode('view');
  };

  const handleOpenDelete = (need) => {
    setActiveNeed(need);
    setModalMode('delete');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveNeed(null);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleSaveNeed = async (e) => {
    e.preventDefault();
    const reqQty = Number(formData.required_quantity);
    const existingFulfilled = modalMode === 'edit' && activeNeed ? Number(activeNeed.fulfilled_quantity || 0) : 0;
    
    // Active reservations for this need
    const activeReservations = modalMode === 'edit' && activeNeed
      ? dispatches
          .filter(d => String(d.need_id) === String(activeNeed.id) && (d.status === 'Pending' || d.status === 'In Transit'))
          .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)
      : 0;
    const minRequired = existingFulfilled + activeReservations;

    if (reqQty < minRequired) {
      setFormErrors({
        required_quantity: `Required quantity cannot be less than fulfilled plus active reserved demand (${minRequired} units)`
      });
      return;
    }

    const payload = {
      camp_id: formData.camp_id,
      inventory_item_id: formData.inventory_item_id,
      required_quantity: reqQty,
      fulfilled_quantity: existingFulfilled,
      priority: formData.priority
    };

    const { isValid, errors } = validateNeed(payload);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await onCreateNeed(payload);
      } else if (modalMode === 'edit') {
        await onUpdateNeed(activeNeed.id, payload);
      }
      handleCloseModal();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeNeed) return;
    setIsSubmitting(true);
    try {
      await onDeleteNeed(activeNeed.id);
      handleCloseModal();
    } catch (err) {
      setFormErrors({ delete: err.message || 'Failed to delete need' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Camp & District',
      key: 'camp',
      render: (need) => {
        const camp = campMap[String(need.camp_id)] || {};
        return (
          <div>
            <span className="font-semibold text-slate-800">{camp.name || 'Unknown Camp'}</span>
            <div className="table-sub-detail">{camp.district || 'Sindh'}</div>
          </div>
        );
      }
    },
    {
      header: 'Commodity Needed',
      key: 'item',
      render: (need) => {
        const item = invMap[String(need.inventory_item_id)] || {};
        return (
          <div>
            <span className="font-medium text-slate-700">{item.name || 'Commodity'}</span>
            <div className="table-sub-detail">Category: {item.category || 'General'}</div>
          </div>
        );
      }
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (need) => <StatusBadge status={need.priority} />
    },
    {
      header: 'Required',
      key: 'required',
      render: (need) => {
        const item = invMap[String(need.inventory_item_id)] || {};
        return `${need.required_quantity} ${item.unit || 'units'}`;
      }
    },
    {
      header: 'Fulfilled',
      key: 'fulfilled',
      render: (need) => {
        const item = invMap[String(need.inventory_item_id)] || {};
        return `${need.fulfilled_quantity || 0} ${item.unit || 'units'}`;
      }
    },
    {
      header: 'Remaining Demand',
      key: 'remaining',
      render: (need) => {
        const item = invMap[String(need.inventory_item_id)] || {};
        const remaining = calculateRemainingDemand(need, dispatches);
        return (
          <span className={`font-semibold ${remaining > 0 ? 'text-red' : 'text-slate-500'}`}>
            {remaining} {item.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Fulfilment Progress',
      key: 'progress',
      width: '180px',
      render: (need) => (
        <ProgressBar
          value={need.fulfilled_quantity}
          max={need.required_quantity}
          variant="fulfilment"
          size="sm"
        />
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (need) => (
        <div className="table-actions-cell">
          <button
            type="button"
            className="action-icon-btn view"
            onClick={() => handleOpenView(need)}
            title="View need details"
          >
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="action-icon-btn edit"
                onClick={() => handleOpenEdit(need)}
                title="Edit need"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-icon-btn delete"
                onClick={() => handleOpenDelete(need)}
                title="Delete need"
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
    <div className="page-needs">
      <DataTable
        columns={columns}
        data={filteredNeeds}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by camp, item, or district..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="need-camp-filter" className="sr-only">Filter by camp</label>
              <select
                id="need-camp-filter"
                className="table-filter-select"
                value={selectedCamp}
                onChange={(e) => setSelectedCamp(e.target.value)}
              >
                <option value="all">All Camps ({camps.length})</option>
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor="need-priority-filter" className="sr-only">Filter by priority</label>
              <select
                id="need-priority-filter"
                className="table-filter-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
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
              <span>Record Camp Need</span>
            </button>
          )
        }
        emptyMessage="No camp commodity needs match your search or filter."
      />

      {/* Create / Edit Need Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={modalMode === 'create' ? 'Record New Camp Commodity Need' : 'Edit Camp Need'}
        >
          <form onSubmit={handleSaveNeed} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="need-camp-select">Target Relief Camp *</label>
              <select
                id="need-camp-select"
                className="form-select"
                value={formData.camp_id}
                onChange={(e) => setFormData({ ...formData, camp_id: e.target.value })}
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}) - {c.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="need-item-select">Required Commodity Item *</label>
              <select
                id="need-item-select"
                className="form-select"
                value={formData.inventory_item_id}
                onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
              >
                {inventory.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.category}) - Available: {i.stock} {i.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="need-required-qty">Required Quantity *</label>
                <input
                  id="need-required-qty"
                  type="number"
                  min="1"
                  required
                  className={`form-input ${formErrors.required_quantity ? 'error' : ''}`}
                  value={formData.required_quantity}
                  onChange={(e) => setFormData({ ...formData, required_quantity: e.target.value })}
                />
                {formErrors.required_quantity && (
                  <span className="field-error-msg">{formErrors.required_quantity}</span>
                )}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="need-fulfilled-qty">Fulfilled Quantity (Read-Only)</label>
                <input
                  id="need-fulfilled-qty"
                  type="number"
                  readOnly
                  disabled
                  className="form-input bg-slate-100 cursor-not-allowed text-slate-600"
                  value={formData.fulfilled_quantity}
                />
                <span className="field-helper-text">
                  Updated automatically via verified cargo deliveries.
                </span>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="need-priority-select">Urgency Priority *</label>
                <select
                  id="need-priority-select"
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
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
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Record Need' : 'Update Need'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Need Details Modal */}
      {modalMode === 'view' && activeNeed && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Camp Need Specification"
        >
          {(() => {
            const camp = campMap[String(activeNeed.camp_id)] || {};
            const item = invMap[String(activeNeed.inventory_item_id)] || {};
            const remaining = calculateRemainingDemand(activeNeed, dispatches);

            return (
              <div className="details-view-grid">
                <div className="detail-item">
                  <span className="detail-label">Camp Name</span>
                  <span className="detail-value font-semibold">{camp.name || 'Unknown Camp'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">District</span>
                  <span className="detail-value">{camp.district || 'Sindh'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Commodity</span>
                  <span className="detail-value">{item.name || 'Commodity'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority Level</span>
                  <StatusBadge status={activeNeed.priority} />
                </div>
                <div className="detail-item">
                  <span className="detail-label">Required Quantity</span>
                  <span className="detail-value">{activeNeed.required_quantity} {item.unit || 'units'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fulfilled Quantity</span>
                  <span className="detail-value text-green font-semibold">
                    {activeNeed.fulfilled_quantity} {item.unit || 'units'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Remaining Unmet Demand</span>
                  <span className="detail-value text-red font-semibold">
                    {remaining} {item.unit || 'units'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Available Warehouse Stock</span>
                  <span className="detail-value">{item.stock || 0} {item.unit || 'units'}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Fulfilment Progress</span>
                  <ProgressBar
                    value={activeNeed.fulfilled_quantity}
                    max={activeNeed.required_quantity}
                    variant="fulfilment"
                    size="lg"
                  />
                </div>
              </div>
            );
          })()}
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const needId = activeNeed.id;
                const cId = activeNeed.camp_id;
                handleCloseModal();
                if (onNavigateToDispatch) {
                  onNavigateToDispatch({ createForNeed: needId, campId: cId });
                }
              }}
            >
              <span>Dispatch Supplies for this Need</span>
              <ArrowRight size={14} />
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Need Modal */}
      {modalMode === 'delete' && activeNeed && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Confirm Need Deletion"
        >
          <div className="delete-confirm-body">
            <p>
              Are you sure you want to remove this need for <strong>{campMap[String(activeNeed.camp_id)]?.name}</strong>?
            </p>
            {dispatches.some(d => String(d.need_id) === String(activeNeed.id)) && (
              <div className="delete-warning-box">
                <strong>Notice:</strong> This need has dispatch records linked to it. Removing it will not delete dispatches but may cause orphaned references.
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
                {isSubmitting ? 'Deleting...' : 'Delete Need'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
