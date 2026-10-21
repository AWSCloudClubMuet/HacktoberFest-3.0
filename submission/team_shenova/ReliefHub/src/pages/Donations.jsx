import React, { useState } from 'react';
import { Plus, Edit2, DollarSign, Package, Eye, Trash2, ShieldCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { validateDonation } from '../utils/validation';

export default function Donations({ 
  donations = [], 
  inventory = [], 
  userRole = 'Admin', 
  onCreateDonation, 
  onUpdateDonation,
  onDeleteDonation 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditDonation, setActiveEditDonation] = useState(null);
  const [selectedDonationView, setSelectedDonationView] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Cash',
    amount_or_quantity: '',
    item_id: '',
    category: 'General Relief'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invMap = {};
  inventory.forEach(i => { invMap[String(i.id)] = i; });

  const categories = Array.from(new Set(donations.map(d => d.category).filter(Boolean)));

  // Totals calculations
  const totalCashPKR = donations
    .filter(d => d.type === 'Cash')
    .reduce((sum, d) => sum + (Number(d.amount_or_quantity) || 0), 0);

  const totalInKindUnits = donations
    .filter(d => d.type === 'In-Kind')
    .reduce((sum, d) => sum + (Number(d.amount_or_quantity) || 0), 0);

  // Grouped totals by category
  const categoryTotals = {};
  donations.forEach(d => {
    const cat = d.category || 'General';
    if (!categoryTotals[cat]) categoryTotals[cat] = { cash: 0, inKind: 0 };
    if (d.type === 'Cash') categoryTotals[cat].cash += Number(d.amount_or_quantity) || 0;
    else categoryTotals[cat].inKind += Number(d.amount_or_quantity) || 0;
  });

  const filteredDonations = donations.filter(don => {
    const matchesSearch = 
      (don.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(don.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || don.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || don.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleOpenCreateModal = () => {
    setFormData({
      type: 'Cash',
      amount_or_quantity: '50000',
      item_id: inventory[0]?.id || '',
      category: 'General Relief'
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: formData.type,
      amount_or_quantity: Number(formData.amount_or_quantity),
      item_id: formData.type === 'In-Kind' ? formData.item_id : null,
      category: formData.category.trim()
    };

    const { isValid, errors } = validateDonation(payload);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDonation(payload);
      setShowCreateModal(false);
      setFormData({ type: 'Cash', amount_or_quantity: '', item_id: '', category: 'General Relief' });
    } catch (err) {
      setFormErrors({ submit: err.message || 'Donation logging failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (donation) => {
    setActiveEditDonation(donation);
    setFormData({
      type: donation.type,
      amount_or_quantity: String(donation.amount_or_quantity),
      item_id: donation.item_id ? String(donation.item_id) : (inventory[0]?.id || ''),
      category: donation.category || 'General Relief'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: formData.type,
      amount_or_quantity: Number(formData.amount_or_quantity),
      item_id: formData.type === 'In-Kind' ? formData.item_id : null,
      category: formData.category.trim()
    };

    const { isValid, errors } = validateDonation(payload);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onUpdateDonation) {
        await onUpdateDonation(activeEditDonation.id, payload);
      }
      setShowEditModal(false);
      setActiveEditDonation(null);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Donation update failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDonation = async (donation) => {
    if (!window.confirm(`Are you sure you want to delete donation ${donation.id}? In-kind inventory will be adjusted safely.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onDeleteDonation(donation.id);
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Receipt ID',
      key: 'id',
      render: (d) => <span className="font-mono text-slate-700">{d.id}</span>
    },
    {
      header: 'Donation Type',
      key: 'type',
      render: (d) => <StatusBadge status={d.type} />
    },
    {
      header: 'Amount / Quantity',
      key: 'amount_or_quantity',
      render: (d) => {
        if (d.type === 'Cash') {
          return (
            <span className="font-bold text-slate-800">
              PKR {Number(d.amount_or_quantity).toLocaleString()}
            </span>
          );
        }
        const item = invMap[String(d.item_id)] || {};
        return (
          <span className="font-bold text-slate-800">
            {Number(d.amount_or_quantity).toLocaleString()} {item.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Allocated Item',
      key: 'item',
      render: (d) => {
        if (d.type === 'Cash') {
          return <span className="text-muted text-xs">Direct Monetary Fund</span>;
        }
        const item = invMap[String(d.item_id)] || {};
        return (
          <span className="font-medium text-slate-700">
            {item.name || 'Commodity'}
          </span>
        );
      }
    },
    {
      header: 'Designated Category',
      key: 'category',
      render: (d) => <span className="category-tag">{d.category}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (d) => (
        <div className="table-actions-cell">
          <button
            type="button"
            className="action-icon-btn view"
            onClick={() => setSelectedDonationView(d)}
            title="View donation details"
          >
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="action-icon-btn edit"
                onClick={() => handleOpenEditModal(d)}
                title="Edit donation"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-icon-btn delete"
                onClick={() => handleDeleteDonation(d)}
                title="Delete donation"
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
    <div className="page-donations">
      {/* Financial & In-Kind Metric Summary Cards */}
      <section className="donations-summary-grid">
        <div className="summary-stat-box">
          <div className="summary-stat-icon-wrap bg-teal-subtle">
            <DollarSign size={20} className="text-teal" />
          </div>
          <div>
            <span className="summary-stat-label">Total Cash Contributions</span>
            <div className="summary-stat-value text-teal font-bold">
              PKR {totalCashPKR.toLocaleString()}
            </div>
            <span className="summary-stat-sub">Allocated across humanitarian response funds</span>
          </div>
        </div>

        <div className="summary-stat-box">
          <div className="summary-stat-icon-wrap bg-purple-subtle">
            <Package size={20} className="text-purple" />
          </div>
          <div>
            <span className="summary-stat-label">Total In-Kind Relief Goods</span>
            <div className="summary-stat-value text-purple font-bold">
              {totalInKindUnits.toLocaleString()} units
            </div>
            <span className="summary-stat-sub">Directly credited to warehouse stock</span>
          </div>
        </div>

        <div className="summary-stat-box">
          <div className="summary-stat-icon-wrap bg-slate-subtle">
            <ShieldCheck size={20} className="text-slate-600" />
          </div>
          <div>
            <span className="summary-stat-label">Contribution Ledger</span>
            <div className="summary-stat-value text-slate-800 font-bold">
              {donations.length} Audited Entries
            </div>
            <span className="summary-stat-sub">Verified humanitarian intake records</span>
          </div>
        </div>
      </section>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredDonations}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search donation records by ID or category..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="don-type-filter" className="sr-only">Filter by type</label>
              <select
                id="don-type-filter"
                className="table-filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types (Cash & In-Kind)</option>
                <option value="Cash">Cash Only</option>
                <option value="In-Kind">In-Kind Goods Only</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <label htmlFor="don-cat-filter" className="sr-only">Filter by category</label>
              <select
                id="don-cat-filter"
                className="table-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
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
              <span>Record Contribution</span>
            </button>
          )
        }
        emptyMessage="No donation records found matching your filters."
      />

      {/* Create Donation Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Record Humanitarian Donation"
        >
          <form onSubmit={handleCreateSubmit} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label>Donation Type *</label>
              <div className="radio-pill-group">
                <label className={`radio-pill ${formData.type === 'Cash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="donationType"
                    value="Cash"
                    checked={formData.type === 'Cash'}
                    onChange={() => setFormData({ ...formData, type: 'Cash', item_id: '' })}
                  />
                  <span>Cash Contribution</span>
                </label>
                <label className={`radio-pill ${formData.type === 'In-Kind' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="donationType"
                    value="In-Kind"
                    checked={formData.type === 'In-Kind'}
                    onChange={() => setFormData({ ...formData, type: 'In-Kind', item_id: inventory[0]?.id || '' })}
                  />
                  <span>In-Kind Goods / Supplies</span>
                </label>
              </div>
            </div>

            {formData.type === 'In-Kind' && (
              <div className="form-group">
                <label htmlFor="don-item-select">Target Inventory Commodity *</label>
                <select
                  id="don-item-select"
                  className="form-select"
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.category}) - Current Stock: {i.stock} {i.unit}
                    </option>
                  ))}
                </select>
                <span className="field-helper-text">
                  Crediting this donation will automatically increase warehouse available stock.
                </span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="don-val">
                  {formData.type === 'Cash' ? 'Donation Amount (PKR) *' : 'Quantity Received *'}
                </label>
                <input
                  id="don-val"
                  type="number"
                  min="1"
                  required
                  className={`form-input ${formErrors.amount_or_quantity ? 'error' : ''}`}
                  placeholder={formData.type === 'Cash' ? 'e.g. 50000' : 'e.g. 100'}
                  value={formData.amount_or_quantity}
                  onChange={(e) => setFormData({ ...formData, amount_or_quantity: e.target.value })}
                />
                {formErrors.amount_or_quantity && (
                  <span className="field-error-msg">{formErrors.amount_or_quantity}</span>
                )}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="don-cat-input">Relief Category *</label>
                <input
                  id="don-cat-input"
                  type="text"
                  required
                  className={`form-input ${formErrors.category ? 'error' : ''}`}
                  placeholder="e.g. Emergency Relief, Medical, Food"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                {formErrors.category && (
                  <span className="field-error-msg">{formErrors.category}</span>
                )}
              </div>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging...' : 'Record Donation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Donation Modal */}
      {showEditModal && activeEditDonation && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowEditModal(false);
            setActiveEditDonation(null);
          }}
          title={`Edit Donation Record: ${activeEditDonation.id}`}
        >
          <form onSubmit={handleEditSubmit} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label>Donation Type *</label>
              <div className="radio-pill-group">
                <label className={`radio-pill ${formData.type === 'Cash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="editDonationType"
                    value="Cash"
                    checked={formData.type === 'Cash'}
                    onChange={() => setFormData({ ...formData, type: 'Cash', item_id: '' })}
                  />
                  <span>Cash Contribution</span>
                </label>
                <label className={`radio-pill ${formData.type === 'In-Kind' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="editDonationType"
                    value="In-Kind"
                    checked={formData.type === 'In-Kind'}
                    onChange={() => setFormData({ ...formData, type: 'In-Kind', item_id: inventory[0]?.id || '' })}
                  />
                  <span>In-Kind Goods / Supplies</span>
                </label>
              </div>
            </div>

            {formData.type === 'In-Kind' && (
              <div className="form-group">
                <label htmlFor="don-edit-item-select">Target Inventory Commodity *</label>
                <select
                  id="don-edit-item-select"
                  className="form-select"
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.category}) - Available Stock: {i.stock} {i.unit}
                    </option>
                  ))}
                </select>
                <span className="field-helper-text">
                  Adjusting donation quantity will automatically reconcile available warehouse stock.
                </span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="don-edit-val">
                  {formData.type === 'Cash' ? 'Donation Amount (PKR) *' : 'Quantity Received *'}
                </label>
                <input
                  id="don-edit-val"
                  type="number"
                  min="1"
                  required
                  className={`form-input ${formErrors.amount_or_quantity ? 'error' : ''}`}
                  value={formData.amount_or_quantity}
                  onChange={(e) => setFormData({ ...formData, amount_or_quantity: e.target.value })}
                />
                {formErrors.amount_or_quantity && (
                  <span className="field-error-msg">{formErrors.amount_or_quantity}</span>
                )}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="don-edit-cat-input">Relief Category *</label>
                <input
                  id="don-edit-cat-input"
                  type="text"
                  required
                  className={`form-input ${formErrors.category ? 'error' : ''}`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                {formErrors.category && (
                  <span className="field-error-msg">{formErrors.category}</span>
                )}
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setActiveEditDonation(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Update Donation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Donation Modal */}
      {selectedDonationView && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDonationView(null)}
          title={`Donation Record: ${selectedDonationView.id}`}
        >
          <div className="details-view-grid">
            <div className="detail-item">
              <span className="detail-label">Receipt ID</span>
              <span className="detail-value font-mono">{selectedDonationView.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <StatusBadge status={selectedDonationView.type} />
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount / Quantity</span>
              <span className="detail-value font-bold text-slate-800">
                {selectedDonationView.type === 'Cash'
                  ? `PKR ${Number(selectedDonationView.amount_or_quantity).toLocaleString()}`
                  : `${Number(selectedDonationView.amount_or_quantity).toLocaleString()} ${invMap[String(selectedDonationView.item_id)]?.unit || 'units'}`}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Designated Category</span>
              <span className="detail-value">{selectedDonationView.category}</span>
            </div>
            {selectedDonationView.type === 'In-Kind' && (
              <div className="detail-item full-width">
                <span className="detail-label">Credited Inventory Item</span>
                <span className="detail-value font-medium">
                  {invMap[String(selectedDonationView.item_id)]?.name || 'Item'}
                </span>
              </div>
            )}
          </div>
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedDonationView(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
