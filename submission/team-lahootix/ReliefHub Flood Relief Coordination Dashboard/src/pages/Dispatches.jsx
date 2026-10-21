import React, { useState, useEffect, useMemo } from 'react';
import { dispatchesApi, campsApi, needsApi, inventoryApi } from '../api/client';
import { useRole } from '../context/RoleContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Dispatches() {
  const { isAdmin, isVolunteer } = useRole();

  // Data states
  const [dispatches, setDispatches] = useState([]);
  const [camps, setCamps] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campFilter, setCampFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [selectedCampId, setSelectedCampId] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
      const [dispData, campsData, needsData, invData] = await Promise.all([
        dispatchesApi.getAll(),
        campsApi.getAll(),
        needsApi.getAll(),
        inventoryApi.getAll()
      ]);
      setDispatches(dispData);
      setCamps(campsData);
      setNeeds(needsData);
      setInventory(invData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dispatch records. Verify mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // Fast lookups
  const campsMap = useMemo(() => {
    const map = {};
    camps.forEach(c => { map[c.id] = c; });
    return map;
  }, [camps]);

  const needsMap = useMemo(() => {
    const map = {};
    needs.forEach(n => { map[n.id] = n; });
    return map;
  }, [needs]);

  const itemsMap = useMemo(() => {
    const map = {};
    inventory.forEach(i => { map[i.id] = i; });
    return map;
  }, [inventory]);

  // Compute pending + in-transit reservations for each need
  const reservationsByNeed = useMemo(() => {
    const map = {};
    dispatches.forEach(d => {
      if (d.status === 'Pending' || d.status === 'In Transit') {
        map[d.need_id] = (map[d.need_id] || 0) + Number(d.quantity);
      }
    });
    return map;
  }, [dispatches]);

  // Needs available for selected camp (with remaining unreserved quantity > 0)
  const campEligibleNeeds = useMemo(() => {
    if (!selectedCampId) return [];
    return needs.filter(n => {
      if (String(n.camp_id) !== String(selectedCampId)) return false;
      const reserved = reservationsByNeed[n.id] || 0;
      const unreserved = Number(n.required_quantity) - Number(n.fulfilled_quantity) - reserved;
      return unreserved > 0;
    });
  }, [selectedCampId, needs, reservationsByNeed]);

  // Current selected need and its inventory item
  const selectedNeed = useMemo(() => {
    if (!selectedNeedId) return null;
    return needs.find(n => String(n.id) === String(selectedNeedId)) || null;
  }, [selectedNeedId, needs]);

  const selectedItem = useMemo(() => {
    if (!selectedNeed) return null;
    return itemsMap[selectedNeed.inventory_item_id] || null;
  }, [selectedNeed, itemsMap]);

  // Max dispatchable quantity for the selected need
  const maxDispatchable = useMemo(() => {
    if (!selectedNeed || !selectedItem) return 0;
    const reserved = reservationsByNeed[selectedNeed.id] || 0;
    const unreservedNeed = Math.max(0, Number(selectedNeed.required_quantity) - Number(selectedNeed.fulfilled_quantity) - reserved);
    const availableStock = Math.max(0, Number(selectedItem.stock));
    return Math.min(unreservedNeed, availableStock);
  }, [selectedNeed, selectedItem, reservationsByNeed]);

  // Open Create Modal
  function handleOpenCreate() {
    const firstCampWithNeeds = camps.find(c => {
      return needs.some(n => {
        if (n.camp_id !== c.id) return false;
        const res = reservationsByNeed[n.id] || 0;
        return (Number(n.required_quantity) - Number(n.fulfilled_quantity) - res) > 0;
      });
    });

    const initCampId = firstCampWithNeeds ? String(firstCampWithNeeds.id) : (camps[0]?.id ? String(camps[0].id) : '');
    setSelectedCampId(initCampId);

    // Initial need
    const eligible = needs.filter(n => {
      if (String(n.camp_id) !== initCampId) return false;
      const res = reservationsByNeed[n.id] || 0;
      return (Number(n.required_quantity) - Number(n.fulfilled_quantity) - res) > 0;
    });

    setSelectedNeedId(eligible[0]?.id ? String(eligible[0].id) : '');
    setQuantity('');
    setFormErrors({});
    setIsCreateOpen(true);
  }

  // Handle Camp selection change
  function handleCampChange(e) {
    const newCampId = e.target.value;
    setSelectedCampId(newCampId);
    const eligible = needs.filter(n => {
      if (String(n.camp_id) !== newCampId) return false;
      const res = reservationsByNeed[n.id] || 0;
      return (Number(n.required_quantity) - Number(n.fulfilled_quantity) - res) > 0;
    });
    setSelectedNeedId(eligible[0]?.id ? String(eligible[0].id) : '');
    setQuantity('');
    setFormErrors({});
  }

  // Validate Create Form
  function validateCreate() {
    const errors = {};
    if (!selectedCampId) errors.camp = 'Select destination camp';
    if (!selectedNeedId || !selectedNeed) errors.need = 'Select camp need to fulfil';

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Quantity must be a positive number';
      return errors;
    }

    if (!selectedItem) {
      errors.quantity = 'Inventory item not found';
      return errors;
    }

    // FR-3.3: Reject quantity > available stock
    if (qty > Number(selectedItem.stock)) {
      errors.quantity = `Quantity (${qty}) exceeds available warehouse stock (${selectedItem.stock} ${selectedItem.unit})`;
      return errors;
    }

    // FR-3.4: Reject quantity > remaining unreserved need
    const reserved = reservationsByNeed[selectedNeed.id] || 0;
    const remainingNeed = Number(selectedNeed.required_quantity) - Number(selectedNeed.fulfilled_quantity) - reserved;
    if (qty > remainingNeed) {
      errors.quantity = `Quantity (${qty}) exceeds remaining unreserved need (${remainingNeed} ${selectedItem.unit})`;
      return errors;
    }

    return errors;
  }

  // Submit Create Dispatch: Sequential Client-Side Transaction
  async function handleCreateSubmit(e) {
    e.preventDefault();
    const errors = validateCreate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      const qty = parseInt(quantity, 10);

      // 1. Re-read current values immediately before writing
      const [freshItem, freshNeed, allDispatches] = await Promise.all([
        inventoryApi.getById(selectedItem.id),
        needsApi.getById(selectedNeed.id),
        dispatchesApi.getAll()
      ]);

      // Calculate fresh reservations
      const freshReserved = allDispatches
        .filter(d => d.need_id === freshNeed.id && (d.status === 'Pending' || d.status === 'In Transit'))
        .reduce((sum, d) => sum + Number(d.quantity), 0);

      const freshRemaining = Number(freshNeed.required_quantity) - Number(freshNeed.fulfilled_quantity) - freshReserved;

      if (qty > Number(freshItem.stock)) {
        setFormErrors({ submit: `Cannot dispatch: Stock has changed. Only ${freshItem.stock} available.` });
        setActionLoading(false);
        return;
      }

      if (qty > freshRemaining) {
        setFormErrors({ submit: `Cannot dispatch: Unreserved need is only ${freshRemaining}.` });
        setActionLoading(false);
        return;
      }

      // 2. Reduce stock immediately on dispatch creation (FR-3.2)
      const updatedStock = Number(freshItem.stock) - qty;
      const updatedItem = await inventoryApi.update(freshItem.id, { stock: updatedStock });

      // 3. Create dispatch with status "Pending"
      const newDispatch = await dispatchesApi.create({
        camp_id: Number(selectedCampId),
        need_id: Number(selectedNeedId),
        quantity: qty,
        status: 'Pending'
      });

      // 4. Update local state
      setDispatches(prev => [...prev, newDispatch]);
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: 'Failed to process dispatch and inventory reservation.' });
    } finally {
      setActionLoading(false);
    }
  }

  // Transition: Mark In Transit (Pending -> In Transit)
  async function handleMarkInTransit(dispatch) {
    if (dispatch.status !== 'Pending') return;
    try {
      setActionLoading(true);
      const updated = await dispatchesApi.update(dispatch.id, { status: 'In Transit' });
      setDispatches(prev => prev.map(d => d.id === dispatch.id ? updated : d));
    } catch (err) {
      alert('Failed to update dispatch to In Transit.');
    } finally {
      setActionLoading(false);
    }
  }

  // Transition: Mark Delivered (In Transit -> Delivered)
  // Increases need's fulfilled_quantity (FR-3.6)
  async function handleMarkDelivered(dispatch) {
    if (dispatch.status !== 'In Transit') return;
    try {
      setActionLoading(true);

      // Re-read current need
      const currentNeed = await needsApi.getById(dispatch.need_id);
      const newFulfilled = Number(currentNeed.fulfilled_quantity) + Number(dispatch.quantity);

      // Update need fulfilment
      const updatedNeed = await needsApi.update(dispatch.need_id, {
        fulfilled_quantity: newFulfilled
      });

      // Update dispatch status to Delivered
      const updatedDispatch = await dispatchesApi.update(dispatch.id, {
        status: 'Delivered'
      });

      // Update local state
      setNeeds(prev => prev.map(n => n.id === updatedNeed.id ? updatedNeed : n));
      setDispatches(prev => prev.map(d => d.id === dispatch.id ? updatedDispatch : d));
    } catch (err) {
      console.error(err);
      alert('Failed to mark dispatch as Delivered.');
    } finally {
      setActionLoading(false);
    }
  }

  // Transition: Cancel Dispatch (Pending or In Transit -> Cancelled)
  // Restores stock to inventory (FR-3.6). Delivered dispatches cannot be cancelled.
  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    if (cancelTarget.status === 'Delivered') {
      alert('Delivered dispatches cannot be cancelled.');
      setCancelTarget(null);
      return;
    }

    try {
      setActionLoading(true);

      // 1. Fetch current need to identify inventory item
      const need = await needsApi.getById(cancelTarget.need_id);
      const currentItem = await inventoryApi.getById(need.inventory_item_id);

      // 2. Restore reserved stock back into inventory
      const restoredStock = Number(currentItem.stock) + Number(cancelTarget.quantity);
      const updatedItem = await inventoryApi.update(currentItem.id, { stock: restoredStock });

      // 3. Update dispatch status to Cancelled
      const updatedDispatch = await dispatchesApi.update(cancelTarget.id, { status: 'Cancelled' });

      // 4. Update local state
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setDispatches(prev => prev.map(d => d.id === cancelTarget.id ? updatedDispatch : d));
      setCancelTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel dispatch and restore inventory stock.');
    } finally {
      setActionLoading(false);
    }
  }

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const camp = campsMap[d.camp_id];
      const campName = camp ? camp.name.toLowerCase() : '';
      const matchesSearch =
        String(d.id).includes(searchQuery) ||
        campName.includes(searchQuery.toLowerCase()) ||
        String(d.need_id).includes(searchQuery);

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchesCamp = campFilter === 'ALL' || String(d.camp_id) === String(campFilter);

      return matchesSearch && matchesStatus && matchesCamp;
    });
  }, [dispatches, searchQuery, statusFilter, campFilter, campsMap]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispatches & Stock Reservations</h1>
          <p className="page-subtitle">
            Coordinate relief supply convoys, reserve warehouse stock, and track delivery progress to Sindh camps.
          </p>
        </div>
        {isAdmin && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              + Dispatch Relief Aid
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="banner-alert info">
          <span>ℹ️ <strong>Field Volunteer Role:</strong> You can update dispatch delivery progress (Mark In Transit / Delivered). Creating dispatches or cancellations requires Relief Coordinator privileges.</span>
        </div>
      )}

      {error && (
        <div className="banner-alert warning">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by Dispatch #, Camp, or Need ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="select-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by Status"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending">⏳ Pending</option>
          <option value="In Transit">🚚 In Transit</option>
          <option value="Delivered">✅ Delivered</option>
          <option value="Cancelled">❌ Cancelled</option>
        </select>

        <select
          className="select-input"
          value={campFilter}
          onChange={(e) => setCampFilter(e.target.value)}
          aria-label="Filter by Camp"
        >
          <option value="ALL">All Destination Camps</option>
          {camps.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.district})</option>
          ))}
        </select>

        {(searchQuery || statusFilter !== 'ALL' || campFilter !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCampFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Dispatches Table Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Dispatch Shipments ({filteredDispatches.length})
          </span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading dispatch shipments...</p>
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div className="state-box">
            <p>No dispatches found matching the selected filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dispatch #</th>
                  <th>Destination Camp</th>
                  <th>Aid Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDispatches.map(d => {
                  const camp = campsMap[d.camp_id] || { name: `Camp #${d.camp_id}`, district: 'Unknown' };
                  const need = needsMap[d.need_id];
                  const item = need ? itemsMap[need.inventory_item_id] : null;

                  return (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        #{d.id}
                      </td>
                      <td>
                        <strong>{camp.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {camp.district}</div>
                      </td>
                      <td>
                        {item ? (
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Need #{d.need_id} ({need.priority} Priority)
                            </div>
                          </div>
                        ) : (
                          <span>Need #{d.need_id}</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>{d.quantity}</strong> {item?.unit || 'units'}
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {/* Pending -> Mark In Transit (Admin or Volunteer) */}
                          {d.status === 'Pending' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMarkInTransit(d)}
                              disabled={actionLoading}
                              title="Advance convoy to In Transit"
                            >
                              🚚 Start Transit
                            </button>
                          )}

                          {/* In Transit -> Mark Delivered (Admin or Volunteer) */}
                          {d.status === 'In Transit' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleMarkDelivered(d)}
                              disabled={actionLoading}
                              title="Confirm delivery at camp (updates need fulfilment)"
                            >
                              ✅ Mark Delivered
                            </button>
                          )}

                          {/* Pending or In Transit -> Cancel (Admin Only) */}
                          {isAdmin && (d.status === 'Pending' || d.status === 'In Transit') && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setCancelTarget(d)}
                              disabled={actionLoading}
                              title="Cancel dispatch and restore stock"
                            >
                              Cancel
                            </button>
                          )}

                          {d.status === 'Delivered' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Completed
                            </span>
                          )}

                          {d.status === 'Cancelled' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Stock Restored
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: Create New Dispatch --- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Relief Dispatch & Stock Reservation"
      >
        <form onSubmit={handleCreateSubmit}>
          {formErrors.submit && (
            <div className="banner-alert warning">
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* 1. Destination Camp */}
          <div className="form-group">
            <label className="form-label">1. Select Destination Camp *</label>
            <select
              className="form-select"
              value={selectedCampId}
              onChange={handleCampChange}
            >
              {camps.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district}) — Status: {c.status}
                </option>
              ))}
            </select>
            {formErrors.camp && <div className="form-error">{formErrors.camp}</div>}
          </div>

          {/* 2. Select Camp Need */}
          <div className="form-group">
            <label className="form-label">2. Select Unfulfilled Need *</label>
            {campEligibleNeeds.length === 0 ? (
              <div className="banner-alert warning" style={{ fontSize: '0.825rem' }}>
                <span>⚠️ All needs for this camp are currently fulfilled or fully covered by active dispatches.</span>
              </div>
            ) : (
              <select
                className="form-select"
                value={selectedNeedId}
                onChange={(e) => {
                  setSelectedNeedId(e.target.value);
                  setQuantity('');
                  setFormErrors({});
                }}
              >
                {campEligibleNeeds.map(n => {
                  const item = itemsMap[n.inventory_item_id] || { name: `Item #${n.inventory_item_id}`, unit: 'Units' };
                  const reserved = reservationsByNeed[n.id] || 0;
                  const unreserved = Number(n.required_quantity) - Number(n.fulfilled_quantity) - reserved;
                  return (
                    <option key={n.id} value={n.id}>
                      [{n.priority} Priority] {item.name} — Needs: {unreserved} {item.unit} remaining (Stock: {item.stock})
                    </option>
                  );
                })}
              </select>
            )}
            {formErrors.need && <div className="form-error">{formErrors.need}</div>}
          </div>

          {/* Need & Stock Summary Box */}
          {selectedNeed && selectedItem && (
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Warehouse Stock:</span>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedItem.stock === 0 ? '#dc2626' : 'var(--text-main)' }}>
                    {selectedItem.stock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Remaining Unreserved Need:</span>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0284c7' }}>
                    {Math.max(0, Number(selectedNeed.required_quantity) - Number(selectedNeed.fulfilled_quantity) - (reservationsByNeed[selectedNeed.id] || 0))} {selectedItem.unit}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Maximum allowable dispatch now: <strong>{maxDispatchable} {selectedItem.unit}</strong>
              </div>
            </div>
          )}

          {/* 3. Dispatch Quantity */}
          <div className="form-group">
            <label className="form-label">3. Quantity to Dispatch *</label>
            <input
              type="number"
              min="1"
              max={maxDispatchable > 0 ? maxDispatchable : 1}
              className="form-input"
              placeholder={`Enter quantity (max ${maxDispatchable})`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={maxDispatchable <= 0}
            />
            {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
            <p className="form-help">
              Rule: Creating a dispatch immediately decreases warehouse stock and places the shipment in <strong>Pending</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading || maxDispatchable <= 0 || !quantity}
            >
              {actionLoading ? 'Reserving Stock...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CONFIRM: Cancel Dispatch --- */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Dispatch & Restore Stock"
        message={`Are you sure you want to cancel Dispatch #${cancelTarget?.id} (${cancelTarget?.quantity} units)? This will return the reserved quantity back to warehouse inventory.`}
        confirmText="Cancel Dispatch & Restore Stock"
        loading={actionLoading}
      />
    </div>
  );
}
