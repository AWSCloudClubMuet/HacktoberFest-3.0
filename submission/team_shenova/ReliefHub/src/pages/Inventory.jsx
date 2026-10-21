import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { validateInventoryItem } from '../utils/validation';

export default function Inventory({ 
  inventory = [], 
  userRole = 'Admin', 
  onCreateItem, 
  onUpdateItem, 
  onDeleteItem,
  initialFilter = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState(initialFilter === 'low_stock' ? 'low' : 'all');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | 'delete'
  const [activeItem, setActiveItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    unit: 'cartons',
    stock: '',
    reorder_level: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Food', 'Water', 'Medical', 'Shelter', 'Hygiene', 'Clothing'];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const isLow = (Number(item.stock) || 0) <= (Number(item.reorder_level) || 0);
    const matchesStock = 
      stockStatusFilter === 'all' ? true :
      stockStatusFilter === 'low' ? isLow :
      !isLow;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      category: 'Food',
      unit: 'cartons',
      stock: '500',
      reorder_level: '200'
    });
    setFormErrors({});
    setModalMode('create');
  };

  const handleOpenEdit = (item) => {
    setActiveItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: String(item.stock),
      reorder_level: String(item.reorder_level)
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleOpenView = (item) => {
    setActiveItem(item);
    setModalMode('view');
  };

  const handleOpenDelete = (item) => {
    setActiveItem(item);
    setModalMode('delete');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveItem(null);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit.trim(),
      stock: Number(formData.stock),
      reorder_level: Number(formData.reorder_level)
    };

    const { isValid, errors } = validateInventoryItem(payload);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await onCreateItem(payload);
      } else if (modalMode === 'edit') {
        await onUpdateItem(activeItem.id, payload);
      }
      handleCloseModal();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    setIsSubmitting(true);
    try {
      await onDeleteItem(activeItem.id);
      handleCloseModal();
    } catch (err) {
      setFormErrors({ delete: err.message || 'Failed to delete item' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === 'Admin';

  const columns = [
    {
      header: 'Item Name',
      key: 'name',
      render: (item) => {
        const isLow = (Number(item.stock) || 0) <= (Number(item.reorder_level) || 0);
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{item.name}</span>
              {isLow && (
                <span className="low-stock-alert-pill" title="Stock at or below reorder threshold">
                  <AlertTriangle size={12} /> Low Stock
                </span>
              )}
            </div>
            <div className="table-sub-detail">ID: {item.id}</div>
          </div>
        );
      }
    },
    {
      header: 'Category',
      key: 'category',
      render: (item) => (
        <span className="category-tag">
          {item.category}
        </span>
      )
    },
    {
      header: 'Unit of Measure',
      key: 'unit',
      render: (item) => item.unit
    },
    {
      header: 'Available Stock',
      key: 'stock',
      render: (item) => {
        const isLow = (Number(item.stock) || 0) <= (Number(item.reorder_level) || 0);
        return (
          <span className={`stock-number-cell ${isLow ? 'text-red font-bold' : 'font-semibold'}`}>
            {item.stock.toLocaleString()} {item.unit}
          </span>
        );
      }
    },
    {
      header: 'Reorder Level',
      key: 'reorder_level',
      render: (item) => `${item.reorder_level.toLocaleString()} ${item.unit}`
    },
    {
      header: 'Stock Status',
      key: 'status',
      render: (item) => {
        const isLow = (Number(item.stock) || 0) <= (Number(item.reorder_level) || 0);
        return isLow ? (
          <span className="status-badge badge-danger">
            <AlertTriangle size={11} className="inline mr-1" /> Reorder Needed
          </span>
        ) : (
          <span className="status-badge badge-success">
            <CheckCircle size={11} className="inline mr-1" /> Adequate
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="table-actions-cell">
          <button
            type="button"
            className="action-icon-btn view"
            onClick={() => handleOpenView(item)}
            title="View item details"
          >
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="action-icon-btn edit"
                onClick={() => handleOpenEdit(item)}
                title="Edit item"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="action-icon-btn delete"
                onClick={() => handleOpenDelete(item)}
                title="Delete item"
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
    <div className="page-inventory">
      <DataTable
        columns={columns}
        data={filteredInventory}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search inventory by item name..."
        filterComponent={
          <>
            <div className="filter-select-wrap">
              <label htmlFor="inv-category-filter" className="sr-only">Filter by category</label>
              <select
                id="inv-category-filter"
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

            <div className="filter-select-wrap">
              <label htmlFor="inv-stock-filter" className="sr-only">Filter by stock health</label>
              <select
                id="inv-stock-filter"
                className="table-filter-select"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock Only (At/Below Reorder)</option>
                <option value="adequate">Adequate Stock</option>
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
              <span>Add Inventory Item</span>
            </button>
          )
        }
        emptyMessage="No inventory commodities match your search or filter."
      />

      {/* Create / Edit Inventory Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={modalMode === 'create' ? 'Add Inventory Commodity' : `Edit Item: ${activeItem?.name}`}
        >
          <form onSubmit={handleSaveItem} className="modal-form">
            {formErrors.submit && (
              <div className="form-error-banner">{formErrors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="inv-name">Commodity Item Name *</label>
              <input
                id="inv-name"
                type="text"
                required
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="e.g. Mineral Water Jerrycans 19L"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="inv-category">Category *</label>
                <select
                  id="inv-category"
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="inv-unit">Unit of Measurement *</label>
                <input
                  id="inv-unit"
                  type="text"
                  required
                  className={`form-input ${formErrors.unit ? 'error' : ''}`}
                  placeholder="e.g. cartons, cans, kits, bags"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
                {formErrors.unit && <span className="field-error-msg">{formErrors.unit}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="inv-stock">Available Physical Stock *</label>
                <input
                  id="inv-stock"
                  type="number"
                  min="0"
                  required
                  className={`form-input ${formErrors.stock ? 'error' : ''}`}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
                {formErrors.stock && <span className="field-error-msg">{formErrors.stock}</span>}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="inv-reorder">Reorder Threshold *</label>
                <input
                  id="inv-reorder"
                  type="number"
                  min="0"
                  required
                  className={`form-input ${formErrors.reorder_level ? 'error' : ''}`}
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                />
                {formErrors.reorder_level && <span className="field-error-msg">{formErrors.reorder_level}</span>}
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
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Save Item' : 'Update Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Item Details Modal */}
      {modalMode === 'view' && activeItem && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Inventory Commodity: ${activeItem.name}`}
        >
          <div className="details-view-grid">
            <div className="detail-item">
              <span className="detail-label">Item ID</span>
              <span className="detail-value font-mono">{activeItem.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{activeItem.category}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available Warehouse Stock</span>
              <span className="detail-value font-bold text-slate-800">
                {activeItem.stock.toLocaleString()} {activeItem.unit}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reorder Safety Level</span>
              <span className="detail-value">
                {activeItem.reorder_level.toLocaleString()} {activeItem.unit}
              </span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Inventory Health</span>
              {(Number(activeItem.stock) || 0) <= (Number(activeItem.reorder_level) || 0) ? (
                <div className="low-stock-warning-banner">
                  <AlertTriangle size={16} />
                  <span>
                    Stock level ({activeItem.stock}) is at or below the safety threshold ({activeItem.reorder_level}). Restock recommended.
                  </span>
                </div>
              ) : (
                <div className="normal-stock-banner">
                  <CheckCircle size={16} />
                  <span>Stock levels are healthy and sufficient above reorder threshold.</span>
                </div>
              )}
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
      {modalMode === 'delete' && activeItem && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Confirm Inventory Deletion"
        >
          <div className="delete-confirm-body">
            <p>
              Are you sure you want to remove <strong>{activeItem.name}</strong> from the warehouse inventory catalog?
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
                {isSubmitting ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
