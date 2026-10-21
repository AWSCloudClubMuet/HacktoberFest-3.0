import React, { useState, useEffect } from 'react';
import { Plus, Truck, CheckCircle2, XCircle } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { calculateRemainingDemand } from '../utils/calculations';
import { validateDispatch } from '../utils/validation';

export default function Dispatches({ 
  dispatches = [], 
  camps = [], 
  needs = [], 
  inventory = [], 
  userRole = 'Admin', 
  onCreateDispatch, 
  onUpdateDispatch,
  prefilledCampId = null,
  prefilledNeedId = null 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCampFilter, setSelectedCampFilter] = useState('all');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    camp_id: '',
    need_id: '',
    quantity: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campMap = {};
  camps.forEach(c => { campMap[String(c.id)] = c; });

  const invMap = {};
  inventory.forEach(i => { invMap[String(i.id)] = i; });

  const needMap = {};
  needs.forEach(n => { needMap[String(n.id)] = n; });

  // Handle prefilled props (e.g. clicking "Dispatch Relief" from Critical Gaps table)
  useEffect(() => {
    if (prefilledNeedId && prefilledCampId) {
      setFormData({
        camp_id: String(prefilledCampId),
        need_id: String(prefilledNeedId),
        quantity: ''
      });
      setShowCreateModal(true);
    }
  }, [prefilledNeedId, prefilledCampId]);

  // Needs available for selected camp in modal
  const availableCampNeeds = needs.filter(n => {
    if (!formData.camp_id) return true;
    return String(n.camp_id) === String(formData.camp_id);
  });

  // Currently selected need details in form
  const currentSelectedNeed = needMap[String(formData.need_id)];
  const currentInvItem = currentSelectedNeed ? invMap[String(currentSelectedNeed.inventory_item_id)] : null;
  const currentRemainingDemand = currentSelectedNeed 
    ? calculateRemainingDemand(currentSelectedNeed, dispatches) 
    : 0;

  // Filtered dispatches
  const filteredDispatches = dispatches.filter(disp => {
    const camp = campMap[String(disp.camp_id)] || {};
    const need = needMap[String(disp.need_id)] || {};
    const item = need.inventory_item_id ? invMap[String(need.inventory_item_id)] : {};

    const matchesSearch = 
      (camp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(disp.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || disp.status === selectedStatus;
    const matchesCamp = selectedCampFilter === 'all' || String(disp.camp_id) === String(selectedCampFilter);

    return matchesSearch && matchesStatus && matchesCamp;
  });

  const handleOpenCreateModal = () => {
    const firstCampId = camps[0]?.id || '';
    const campNeeds = needs.filter(n => String(n.camp_id) === String(firstCampId));
    setFormData({
      camp_id: firstCampId,
      need_id: campNeeds[0]?.id || '',
      quantity: ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleCampChangeInForm = (newCampId) => {
    const campNeeds = needs.filter(n => String(n.camp_id) === String(newCampId));
    setFormData({
      ...formData,
      camp_id: newCampId,
      need_id: campNeeds[0]?.id || '',
      quantity: ''
    });
    setFormErrors({});
  };

  const handleCreateDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!currentSelectedNeed || !currentInvItem) {
      setFormErrors({ submit: 'Please select a valid camp and recorded need' });
      return;
    }

    const payload = {
      camp_id: formData.camp_id,
      need_id: formData.need_id,
      quantity: Number(formData.quantity),
      status: 'Pending'
    };

    const { isValid, errors } = validateDispatch(payload, currentInvItem, currentRemainingDemand);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDispatch(payload);
      setShowCreateModal(false);
      setFormData({ camp_id: '', need_id: '', quantity: '' });
      setFormErrors({});
    } catch (err) {
      setFormErrors({ submit: err.message || 'Dispatch creation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status transitions
  const handleTransitionStatus = async (dispatch, newStatus) => {
    setIsSubmitting(true);
    try {
      await onUpdateDispatch(dispatch.id, { status: newStatus });
    } catch (err) {
      alert(`Status transition error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Dispatch ID',
      key: 'id',
      render: (disp) => <span className="font-mono text-slate-700">{disp.id}</span>
    },
    {
      header: 'Destination Camp',
      key: 'camp',
      render: (disp) => {
        const camp = campMap[String(disp.camp_id)] || {};
        return (
          <div>
            <span className="font-semibold text-slate-800">{camp.name || 'Unknown Camp'}</span>
            <div className="table-sub-detail">{camp.district || 'Sindh'}</div>
          </div>
        );
      }
    },
    {
      header: 'Commodity Dispatched',
      key: 'item',
      render: (disp) => {
        const need = needMap[String(disp.need_id)] || {};
        const item = need.inventory_item_id ? invMap[String(need.inventory_item_id)] : {};
        return (
          <div>
            <span className="font-medium text-slate-700">{item.name || 'Relief Commodity'}</span>
            <div className="table-sub-detail">Category: {item.category || 'General'}</div>
          </div>
        );
      }
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (disp) => {
        const need = needMap[String(disp.need_id)] || {};
        const item = need.inventory_item_id ? invMap[String(need.inventory_item_id)] : {};
        return (
          <span className="font-bold text-slate-800">
            {disp.quantity} {item.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      key: 'status',
      render: (disp) => <StatusBadge status={disp.status} />
    },
    {
      header: 'Workflow Actions',
      key: 'actions',
      render: (disp) => {
        if (!isAdmin) {
          return <span className="text-muted text-xs">Read-Only</span>;
        }

        return (
          <div className="dispatch-workflow-actions">
            {disp.status === 'Pending' && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => handleTransitionStatus(disp, 'In Transit')}
                  disabled={isSubmitting}
                  title="Mark cargo as en-route"
                >
                  <Truck size={12} />
                  <span>Mark In Transit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => handleTransitionStatus(disp, 'Cancelled')}
                  disabled={isSubmitting}
                  title="Cancel dispatch and restore stock"
                >
                  <XCircle size={12} />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {disp.status === 'In Transit' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => handleTransitionStatus(disp, 'Delivered')}
                  disabled={isSubmitting}
                  title="Confirm safe delivery at camp"
                >
                  <CheckCircle2 size={12} />
                  <span>Mark Delivered</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => handleTransitionStatus(disp, 'Cancelled')}
                  disabled={isSubmitting}
                  title="Abort transit and restore stock"
                >
                  <XCircle size={12} />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {disp.status === 'Delivered' && (
              <span className="text-green text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Completed
              </span>
            )}

            {disp.status === 'Cancelled' && (
              <span className="text-slate-400 text-xs font-medium">
                Stock Restored
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="page-dispatches">
      <DataTable
        columns={columns}
        data={filteredDispatches}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by dispatch ID, camp, or item..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="disp-status-filter" className="sr-only">Filter by status</label>
              <select
                id="disp-status-filter"
                className="table-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Dispatch Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor="disp-camp-filter" className="sr-only">Filter by destination camp</label>
              <select
                id="disp-camp-filter"
                className="table-filter-select"
                value={selectedCampFilter}
                onChange={(e) => setSelectedCampFilter(e.target.value)}
              >
                <option value="all">All Destination Camps</option>
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </>
        }
        actionComponent={
          isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} />
              <span>Create Dispatch</span>
            </button>
          )
        }
        emptyMessage="No dispatches found matching your filters."
      />

      {/* Create Dispatch Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Create Relief Cargo Dispatch"
        >
          <form onSubmit={handleCreateDispatchSubmit} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="disp-camp-select">Destination Relief Camp *</label>
              <select
                id="disp-camp-select"
                className="form-select"
                value={formData.camp_id}
                onChange={(e) => handleCampChangeInForm(e.target.value)}
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}) - {c.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="disp-need-select">Target Camp Commodity Need *</label>
              <select
                id="disp-need-select"
                className="form-select"
                value={formData.need_id}
                onChange={(e) => {
                  setFormData({ ...formData, need_id: e.target.value });
                  setFormErrors({});
                }}
              >
                {availableCampNeeds.length === 0 ? (
                  <option value="">No recorded needs for this camp</option>
                ) : (
                  availableCampNeeds.map(n => {
                    const itm = invMap[String(n.inventory_item_id)] || {};
                    const remaining = calculateRemainingDemand(n, dispatches);
                    return (
                      <option key={n.id} value={n.id}>
                        {itm.name || 'Item'} (Remaining Unmet: {remaining} {itm.unit}) - Priority: {n.priority}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Live Stock & Remaining Demand Intelligence Card */}
            {currentSelectedNeed && currentInvItem && (
              <div className="dispatch-context-card">
                <div className="context-row">
                  <span className="context-label">Available Warehouse Stock:</span>
                  <span className="context-val font-bold text-teal">
                    {currentInvItem.stock} {currentInvItem.unit}
                  </span>
                </div>
                <div className="context-row">
                  <span className="context-label">Remaining Unreserved Demand:</span>
                  <span className="context-val font-bold text-amber">
                    {currentRemainingDemand} {currentInvItem.unit}
                  </span>
                </div>
                <div className="context-row">
                  <span className="context-label">Already Fulfilled:</span>
                  <span className="context-val text-slate-600">
                    {currentSelectedNeed.fulfilled_quantity} / {currentSelectedNeed.required_quantity} {currentInvItem.unit}
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="disp-quantity">Dispatch Quantity *</label>
              <input
                id="disp-quantity"
                type="number"
                min="1"
                required
                className={`form-input ${formErrors.quantity ? 'error' : ''}`}
                placeholder="Enter units to dispatch..."
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              {formErrors.quantity && (
                <span className="field-error-msg">{formErrors.quantity}</span>
              )}
              <span className="field-helper-text">
                Note: Creating a dispatch immediately deducts quantity from warehouse stock and reserves demand.
              </span>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || availableCampNeeds.length === 0}
              >
                {isSubmitting ? 'Reserving...' : 'Confirm Dispatch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
