import React, { useState, useEffect, useMemo } from 'react';
import { inventoryApi, needsApi, campsApi } from '../api/client';
import { useRole } from '../context/RoleContext';
import { LowStockBadge, PriorityBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

const INVENTORY_CATEGORIES = ['Food', 'Water', 'Medicine', 'Shelter', 'Hygiene'];
const COMMON_UNITS = ['Bags', 'Bottles', 'Strips', 'Boxes', 'Kits', 'Units', 'Sheets', 'Pieces', 'Cans'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export function Inventory() {
  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'needs'

  // Data states
  const [items, setItems] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inventory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'HEALTHY'

  // Needs Filters
  const [needsCampFilter, setNeedsCampFilter] = useState('ALL');
  const [needsPriorityFilter, setNeedsPriorityFilter] = useState('ALL');

  // Modals - Inventory
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: 'Food',
    unit: 'Bags',
    stock: 0,
    reorder_level: 50
  });
  const [itemFormErrors, setItemFormErrors] = useState({});

  // Modals - Needs
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);
  const [deleteNeedTarget, setDeleteNeedTarget] = useState(null);
  const [needFormData, setNeedFormData] = useState({
    camp_id: '',
    inventory_item_id: '',
    required_quantity: 100,
    priority: 'High',
    fulfilled_quantity: 0
  });
  const [needFormErrors, setNeedFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [invData, needsData, campsData] = await Promise.all([
        inventoryApi.getAll(),
        needsApi.getAll(),
        campsApi.getAll()
      ]);
      setItems(invData);
      setNeeds(needsData);
      setCamps(campsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory data. Make sure mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // --- Maps for Fast Lookup ---
  const campsMap = useMemo(() => {
    const map = {};
    camps.forEach(c => { map[c.id] = c; });
    return map;
  }, [camps]);

  const itemsMap = useMemo(() => {
    const map = {};
    items.forEach(i => { map[i.id] = i; });
    return map;
  }, [items]);

  // --- Inventory Item Actions ---
  function openItemForm(item = null) {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        stock: item.stock,
        reorder_level: item.reorder_level
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        name: '',
        category: 'Food',
        unit: 'Bags',
        stock: 0,
        reorder_level: 50
      });
    }
    setItemFormErrors({});
    setIsItemModalOpen(true);
  }

  function validateItemForm() {
    const errors = {};
    if (!itemFormData.name.trim()) errors.name = 'Item name is required';
    if (!itemFormData.category) errors.category = 'Category is required';
    if (!itemFormData.unit.trim()) errors.unit = 'Unit is required';
    if (Number(itemFormData.stock) < 0 || isNaN(Number(itemFormData.stock))) {
      errors.stock = 'Stock must be 0 or greater';
    }
    if (Number(itemFormData.reorder_level) < 0 || isNaN(Number(itemFormData.reorder_level))) {
      errors.reorder_level = 'Reorder level must be 0 or greater';
    }
    return errors;
  }

  async function handleItemSubmit(e) {
    e.preventDefault();
    const errors = validateItemForm();
    if (Object.keys(errors).length > 0) {
      setItemFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: itemFormData.name.trim(),
        category: itemFormData.category,
        unit: itemFormData.unit.trim(),
        stock: parseInt(itemFormData.stock, 10),
        reorder_level: parseInt(itemFormData.reorder_level, 10)
      };

      if (editingItem) {
        const updated = await inventoryApi.update(editingItem.id, payload);
        setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
      } else {
        const created = await inventoryApi.create(payload);
        setItems(prev => [...prev, created]);
      }
      setIsItemModalOpen(false);
    } catch (err) {
      setItemFormErrors({ submit: 'Failed to save inventory item.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItemConfirm() {
    if (!deleteItemTarget) return;
    try {
      setSubmitting(true);
      await inventoryApi.delete(deleteItemTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteItemTarget.id));
      setDeleteItemTarget(null);
    } catch (err) {
      alert('Failed to delete item.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Camp Needs Actions ---
  function openNeedForm(need = null) {
    if (need) {
      setEditingNeed(need);
      setNeedFormData({
        camp_id: need.camp_id,
        inventory_item_id: need.inventory_item_id,
        required_quantity: need.required_quantity,
        priority: need.priority,
        fulfilled_quantity: need.fulfilled_quantity
      });
    } else {
      setEditingNeed(null);
      setNeedFormData({
        camp_id: camps[0]?.id || '',
        inventory_item_id: items[0]?.id || '',
        required_quantity: 100,
        priority: 'High',
        fulfilled_quantity: 0
      });
    }
    setNeedFormErrors({});
    setIsNeedModalOpen(true);
  }

  function validateNeedForm() {
    const errors = {};
    if (!needFormData.camp_id) errors.camp_id = 'Please select a relief camp';
    if (!needFormData.inventory_item_id) errors.inventory_item_id = 'Please select an inventory item';
    const req = Number(needFormData.required_quantity);
    if (isNaN(req) || req <= 0) errors.required_quantity = 'Required quantity must be greater than 0';
    const ful = Number(needFormData.fulfilled_quantity);
    if (isNaN(ful) || ful < 0) errors.fulfilled_quantity = 'Fulfilled quantity cannot be negative';
    if (ful > req) errors.fulfilled_quantity = 'Fulfilled quantity cannot exceed required quantity';
    return errors;
  }

  async function handleNeedSubmit(e) {
    e.preventDefault();
    const errors = validateNeedForm();
    if (Object.keys(errors).length > 0) {
      setNeedFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        camp_id: Number(needFormData.camp_id),
        inventory_item_id: Number(needFormData.inventory_item_id),
        required_quantity: Number(needFormData.required_quantity),
        priority: needFormData.priority,
        fulfilled_quantity: Number(needFormData.fulfilled_quantity)
      };

      if (editingNeed) {
        const updated = await needsApi.update(editingNeed.id, payload);
        setNeeds(prev => prev.map(n => n.id === editingNeed.id ? updated : n));
      } else {
        const created = await needsApi.create(payload);
        setNeeds(prev => [...prev, created]);
      }
      setIsNeedModalOpen(false);
    } catch (err) {
      setNeedFormErrors({ submit: 'Failed to save need requirement.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNeedConfirm() {
    if (!deleteNeedTarget) return;
    try {
      setSubmitting(true);
      await needsApi.delete(deleteNeedTarget.id);
      setNeeds(prev => prev.filter(n => n.id !== deleteNeedTarget.id));
      setDeleteNeedTarget(null);
    } catch (err) {
      alert('Failed to delete need.');
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const isLow = Number(item.stock) <= Number(item.reorder_level);
      const matchesStock = stockStatusFilter === 'ALL' ||
        (stockStatusFilter === 'LOW' && isLow) ||
        (stockStatusFilter === 'HEALTHY' && !isLow);

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, searchQuery, categoryFilter, stockStatusFilter]);

  // Filtered Needs
  const filteredNeeds = useMemo(() => {
    return needs.filter(n => {
      const matchesCamp = needsCampFilter === 'ALL' || String(n.camp_id) === String(needsCampFilter);
      const matchesPriority = needsPriorityFilter === 'ALL' || n.priority === needsPriorityFilter;
      return matchesCamp && matchesPriority;
    });
  }, [needs, needsCampFilter, needsPriorityFilter]);

  // Low stock items count
  const lowStockCount = useMemo(() => {
    return items.filter(i => Number(i.stock) <= Number(i.reorder_level)).length;
  }, [items]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouse & Camp Needs</h1>
          <p className="page-subtitle">
            Manage inventory items, monitor low-stock thresholds, and track camp aid fulfilment requirements.
          </p>
        </div>
        {isAdmin && (
          <div className="header-actions">
            {activeTab === 'inventory' ? (
              <button className="btn btn-primary" onClick={() => openItemForm(null)}>
                + Add Inventory Item
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => openNeedForm(null)}>
                + Add Camp Need
              </button>
            )}
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="banner-alert info">
          <span>ℹ️ <strong>Field Volunteer View:</strong> Read-only access. Relief Coordinator permissions required to add or modify warehouse inventory and camp needs.</span>
        </div>
      )}

      {error && (
        <div className="banner-alert warning">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Warehouse Inventory ({items.length}) {lowStockCount > 0 && <span style={{ background: '#dc2626', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '0.35rem' }}>{lowStockCount} Low</span>}
        </button>
        <button
          className={`btn ${activeTab === 'needs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('needs')}
        >
          📋 Camp Needs Tracker ({needs.length})
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <>
          {/* Filter Bar */}
          <div className="filter-bar">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="select-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
            >
              <option value="ALL">All Categories</option>
              {INVENTORY_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="select-input"
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              aria-label="Filter by Stock Status"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">⚠️ Low Stock Only ({lowStockCount})</option>
              <option value="HEALTHY">✓ Healthy Stock Only</option>
            </select>

            {(searchQuery || categoryFilter !== 'ALL' || stockStatusFilter !== 'ALL') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setStockStatusFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Inventory Table Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Warehouse Stock Catalog ({filteredItems.length})
              </span>
              {lowStockCount > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>
                  ⚠️ {lowStockCount} item{lowStockCount > 1 ? 's' : ''} at or below reorder level
                </span>
              )}
            </div>

            {loading ? (
              <div className="state-box">
                <div className="spinner" />
                <p>Loading warehouse catalog...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="state-box">
                <p>No inventory items match the current filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Current Stock</th>
                      <th>Reorder Threshold</th>
                      <th>Status Flag</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const isLow = Number(item.stock) <= Number(item.reorder_level);
                      return (
                        <tr key={item.id} style={isLow ? { background: 'var(--priority-high-bg)' } : {}}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>
                            <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                          <td>
                            <strong style={{ fontSize: '1rem', color: isLow ? '#dc2626' : 'var(--text-main)' }}>
                              {item.stock}
                            </strong>
                          </td>
                          <td>{item.reorder_level}</td>
                          <td>
                            {isLow ? (
                              <LowStockBadge />
                            ) : (
                              <span style={{ color: '#16a34a', fontSize: '0.825rem', fontWeight: 600 }}>
                                ✓ Normal
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openItemForm(item)}
                                  title="Edit item parameters"
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setDeleteItemTarget(item)}
                                  title="Remove item"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CAMP NEEDS */}
      {activeTab === 'needs' && (
        <>
          {/* Needs Filter Bar */}
          <div className="filter-bar">
            <select
              className="select-input"
              value={needsCampFilter}
              onChange={(e) => setNeedsCampFilter(e.target.value)}
              aria-label="Filter by Camp"
            >
              <option value="ALL">All Relief Camps</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.district})</option>
              ))}
            </select>

            <select
              className="select-input"
              value={needsPriorityFilter}
              onChange={(e) => setNeedsPriorityFilter(e.target.value)}
              aria-label="Filter by Priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">▲ High Priority</option>
              <option value="Medium">■ Medium Priority</option>
              <option value="Low">▼ Low Priority</option>
            </select>

            {(needsCampFilter !== 'ALL' || needsPriorityFilter !== 'ALL') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setNeedsCampFilter('ALL');
                  setNeedsPriorityFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Needs Table Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Camp Needs & Fulfilment ({filteredNeeds.length})</span>
            </div>

            {loading ? (
              <div className="state-box">
                <div className="spinner" />
                <p>Loading camp needs...</p>
              </div>
            ) : filteredNeeds.length === 0 ? (
              <div className="state-box">
                <p>No camp needs match the selected criteria.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Need ID</th>
                      <th>Camp & District</th>
                      <th>Relief Item</th>
                      <th>Priority</th>
                      <th>Fulfilled / Required</th>
                      <th>Progress</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNeeds.map(need => {
                      const camp = campsMap[need.camp_id] || { name: `Camp #${need.camp_id}`, district: 'Unknown' };
                      const item = itemsMap[need.inventory_item_id] || { name: `Item #${need.inventory_item_id}`, unit: 'Units' };
                      const progressPct = need.required_quantity > 0 ? Math.round((need.fulfilled_quantity / need.required_quantity) * 100) : 0;
                      const isCriticalGap = need.priority === 'High' && progressPct < 40;

                      return (
                        <tr key={need.id} style={isCriticalGap ? { background: 'var(--priority-high-bg)' } : {}}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{need.id}</td>
                          <td>
                            <strong>{camp.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {camp.district}</div>
                          </td>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            <PriorityBadge priority={need.priority} />
                          </td>
                          <td>
                            <strong>{need.fulfilled_quantity}</strong> / {need.required_quantity} {item.unit}
                          </td>
                          <td style={{ minWidth: '160px' }}>
                            <ProgressBar current={need.fulfilled_quantity} total={need.required_quantity} />
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openNeedForm(need)}
                                  title="Edit need requirement"
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setDeleteNeedTarget(need)}
                                  title="Remove need"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MODAL: Add/Edit Inventory Item --- */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.name}` : 'Add New Inventory Item'}
      >
        <form onSubmit={handleItemSubmit}>
          {itemFormErrors.submit && (
            <div className="banner-alert warning"><span>{itemFormErrors.submit}</span></div>
          )}

          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Tarpaulin Sheets (12x15ft)"
              value={itemFormData.name}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
            />
            {itemFormErrors.name && <div className="form-error">{itemFormErrors.name}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-select"
                value={itemFormData.category}
                onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
              >
                {INVENTORY_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {itemFormErrors.category && <div className="form-error">{itemFormErrors.category}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure *</label>
              <input
                type="text"
                name="unit"
                className="form-input"
                placeholder="e.g. Bags, Bottles, Kits"
                value={itemFormData.unit}
                onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
              />
              {itemFormErrors.unit && <div className="form-error">{itemFormErrors.unit}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Current Stock Quantity *</label>
              <input
                type="number"
                min="0"
                name="stock"
                className="form-input"
                value={itemFormData.stock}
                onChange={(e) => setItemFormData({ ...itemFormData, stock: e.target.value })}
              />
              {itemFormErrors.stock && <div className="form-error">{itemFormErrors.stock}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Level *</label>
              <input
                type="number"
                min="0"
                name="reorder_level"
                className="form-input"
                value={itemFormData.reorder_level}
                onChange={(e) => setItemFormData({ ...itemFormData, reorder_level: e.target.value })}
              />
              {itemFormErrors.reorder_level && <div className="form-error">{itemFormErrors.reorder_level}</div>}
            </div>
          </div>
          <p className="form-help">
            Rule: When current stock falls at or below the reorder level, the item will automatically be flagged as <strong>Low Stock</strong>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsItemModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CONFIRM: Delete Inventory Item --- */}
      <ConfirmDialog
        isOpen={Boolean(deleteItemTarget)}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={handleDeleteItemConfirm}
        title="Delete Inventory Item"
        message={`Are you sure you want to remove "${deleteItemTarget?.name}" from warehouse records?`}
        confirmText="Delete Item"
        loading={submitting}
      />

      {/* --- MODAL: Add/Edit Camp Need --- */}
      <Modal
        isOpen={isNeedModalOpen}
        onClose={() => setIsNeedModalOpen(false)}
        title={editingNeed ? `Edit Need #${editingNeed.id}` : 'Create Camp Need Requirement'}
      >
        <form onSubmit={handleNeedSubmit}>
          {needFormErrors.submit && (
            <div className="banner-alert warning"><span>{needFormErrors.submit}</span></div>
          )}

          <div className="form-group">
            <label className="form-label">Relief Camp *</label>
            <select
              name="camp_id"
              className="form-select"
              value={needFormData.camp_id}
              onChange={(e) => setNeedFormData({ ...needFormData, camp_id: e.target.value })}
            >
              <option value="">-- Select Camp --</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.district})</option>
              ))}
            </select>
            {needFormErrors.camp_id && <div className="form-error">{needFormErrors.camp_id}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Inventory Item *</label>
            <select
              name="inventory_item_id"
              className="form-select"
              value={needFormData.inventory_item_id}
              onChange={(e) => setNeedFormData({ ...needFormData, inventory_item_id: e.target.value })}
            >
              <option value="">-- Select Item --</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stock: {i.stock} {i.unit})
                </option>
              ))}
            </select>
            {needFormErrors.inventory_item_id && <div className="form-error">{needFormErrors.inventory_item_id}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Required Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={needFormData.required_quantity}
                onChange={(e) => setNeedFormData({ ...needFormData, required_quantity: e.target.value })}
              />
              {needFormErrors.required_quantity && <div className="form-error">{needFormErrors.required_quantity}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level *</label>
              <select
                className="form-select"
                value={needFormData.priority}
                onChange={(e) => setNeedFormData({ ...needFormData, priority: e.target.value })}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Already Fulfilled Quantity</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={needFormData.fulfilled_quantity}
              onChange={(e) => setNeedFormData({ ...needFormData, fulfilled_quantity: e.target.value })}
            />
            {needFormErrors.fulfilled_quantity && <div className="form-error">{needFormErrors.fulfilled_quantity}</div>}
            <p className="form-help">
              Fulfilment progress: {needFormData.required_quantity > 0 ? Math.round(((Number(needFormData.fulfilled_quantity) || 0) / Number(needFormData.required_quantity)) * 100) : 0}%
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNeedModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingNeed ? 'Update Need' : 'Create Need'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CONFIRM: Delete Camp Need --- */}
      <ConfirmDialog
        isOpen={Boolean(deleteNeedTarget)}
        onClose={() => setDeleteNeedTarget(null)}
        onConfirm={handleDeleteNeedConfirm}
        title="Delete Camp Need"
        message={`Are you sure you want to delete Need #${deleteNeedTarget?.id}?`}
        confirmText="Delete Need"
        loading={submitting}
      />
    </div>
  );
}
