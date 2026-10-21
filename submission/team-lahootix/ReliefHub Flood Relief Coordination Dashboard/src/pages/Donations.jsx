import React, { useState, useEffect, useMemo } from 'react';
import { donationsApi, inventoryApi } from '../api/client';
import { useRole } from '../context/RoleContext';
import { Modal } from '../components/Modal';

const CASH_PURPOSES = [
  'General Flood Support',
  'Emergency Relief Fund',
  'Medical Aid',
  'Child Nutrition',
  'Shelter Rehabilitation'
];

export function Donations() {
  const { isAdmin, isVolunteer } = useRole();

  // Data states
  const [donations, setDonations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationType, setDonationType] = useState('Cash'); // 'Cash' | 'In-Kind'
  const [cashAmount, setCashAmount] = useState('');
  const [cashCategory, setCashCategory] = useState(CASH_PURPOSES[0]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [inKindQuantity, setInKindQuantity] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [donData, invData] = await Promise.all([
        donationsApi.getAll(),
        inventoryApi.getAll()
      ]);
      setDonations(donData);
      setInventory(invData);
    } catch (err) {
      console.error(err);
      setError('Failed to load donations. Verify mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // Inventory items map
  const itemsMap = useMemo(() => {
    const map = {};
    inventory.forEach(i => { map[i.id] = i; });
    return map;
  }, [inventory]);

  // Open Modal
  function handleOpenModal() {
    setDonationType('Cash');
    setCashAmount('');
    setCashCategory(CASH_PURPOSES[0]);
    setSelectedItemId(inventory[0]?.id ? String(inventory[0].id) : '');
    setInKindQuantity('');
    setFormErrors({});
    setIsModalOpen(true);
  }

  // Form Validation
  function validateForm() {
    const errors = {};
    if (donationType === 'Cash') {
      const amt = Number(cashAmount);
      if (isNaN(amt) || amt <= 0) {
        errors.cashAmount = 'Enter a valid donation amount (PKR)';
      }
      if (!cashCategory) {
        errors.cashCategory = 'Select category or fund';
      }
    } else {
      if (!selectedItemId) {
        errors.selectedItemId = 'Select an inventory item to donate';
      }
      const qty = Number(inKindQuantity);
      if (isNaN(qty) || qty <= 0) {
        errors.inKindQuantity = 'Enter a valid positive quantity';
      }
    }
    return errors;
  }

  // Handle Submit
  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (donationType === 'Cash') {
        const payload = {
          type: 'Cash',
          amount_or_quantity: parseInt(cashAmount, 10),
          item_id: null,
          category: cashCategory
        };
        const created = await donationsApi.create(payload);
        setDonations(prev => [...prev, created]);
      } else {
        // In-Kind donation: raises inventory stock immediately (FR-4.1)
        const qty = parseInt(inKindQuantity, 10);
        const item = itemsMap[selectedItemId];
        const freshItem = await inventoryApi.getById(selectedItemId);
        const updatedStock = Number(freshItem.stock) + qty;

        // 1. Update inventory stock
        const updatedInventoryItem = await inventoryApi.update(selectedItemId, {
          stock: updatedStock
        });

        // 2. Create donation record
        const payload = {
          type: 'In-Kind',
          amount_or_quantity: qty,
          item_id: Number(selectedItemId),
          category: freshItem.category
        };
        const created = await donationsApi.create(payload);

        // 3. Update local states
        setInventory(prev => prev.map(i => i.id === updatedInventoryItem.id ? updatedInventoryItem : i));
        setDonations(prev => [...prev, created]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: 'Failed to record donation. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered Donations
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
      const itemName = d.item_id && itemsMap[d.item_id] ? itemsMap[d.item_id].name.toLowerCase() : '';
      const categoryName = (d.category || '').toLowerCase();
      const matchesSearch =
        itemName.includes(searchQuery.toLowerCase()) ||
        categoryName.includes(searchQuery.toLowerCase()) ||
        String(d.id).includes(searchQuery);

      return matchesType && matchesSearch;
    });
  }, [donations, typeFilter, searchQuery, itemsMap]);

  // Totals calculations (FR-4.2)
  const cashTotal = useMemo(() => {
    return donations
      .filter(d => d.type === 'Cash')
      .reduce((sum, d) => sum + (Number(d.amount_or_quantity) || 0), 0);
  }, [donations]);

  const inKindTotalItems = useMemo(() => {
    return donations
      .filter(d => d.type === 'In-Kind')
      .reduce((sum, d) => sum + (Number(d.amount_or_quantity) || 0), 0);
  }, [donations]);

  const inKindByCategory = useMemo(() => {
    const map = {};
    donations.forEach(d => {
      if (d.type === 'In-Kind' && d.category) {
        map[d.category] = (map[d.category] || 0) + Number(d.amount_or_quantity);
      }
    });
    return map;
  }, [donations]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Donation Receipts & In-Kind Supplies</h1>
          <p className="page-subtitle">
            Log financial contributions and in-kind relief goods that automatically increase warehouse stock.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenModal}>
            + Record New Donation
          </button>
        </div>
      </div>

      {error && (
        <div className="banner-alert warning">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <span className="kpi-title">Total Cash Received</span>
          <span className="kpi-value">PKR {cashTotal.toLocaleString()}</span>
          <span className="kpi-sub">Direct disaster relief funds</span>
        </div>

        <div className="kpi-card blue">
          <span className="kpi-title">In-Kind Items Donated</span>
          <span className="kpi-value">{inKindTotalItems.toLocaleString()} units</span>
          <span className="kpi-sub">Added to warehouse inventory</span>
        </div>

        <div className="kpi-card purple">
          <span className="kpi-title">In-Kind Categories</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {Object.keys(inKindByCategory).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No in-kind donations</span>
            ) : (
              Object.entries(inKindByCategory).map(([cat, qty]) => (
                <span key={cat} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  {cat}: {qty}
                </span>
              ))
            )}
          </div>
          <span className="kpi-sub" style={{ marginTop: '0.5rem' }}>Category breakdown</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by category, item name, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="select-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by Type"
        >
          <option value="ALL">All Donation Types</option>
          <option value="Cash">💵 Cash Only</option>
          <option value="In-Kind">📦 In-Kind Goods Only</option>
        </select>

        {(searchQuery || typeFilter !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Donations Table Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Donation Records ({filteredDonations.length})</span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading donations log...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="state-box">
            <p>No donations found matching criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donation #</th>
                  <th>Type</th>
                  <th>Item / Description</th>
                  <th>Category / Fund</th>
                  <th>Amount / Quantity</th>
                  <th>Stock Effect</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map(d => {
                  const item = d.item_id ? itemsMap[d.item_id] : null;
                  return (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{d.id}</td>
                      <td>
                        <span className={`badge ${d.type === 'Cash' ? 'badge-delivered' : 'badge-transit'}`}>
                          {d.type === 'Cash' ? '💵 Cash' : '📦 In-Kind'}
                        </span>
                      </td>
                      <td>
                        {d.type === 'Cash' ? (
                          <strong>Direct Monetary Aid</strong>
                        ) : (
                          <strong>{item?.name || `Item #${d.item_id}`}</strong>
                        )}
                      </td>
                      <td>
                        <span style={{ background: 'var(--bg-surface)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                          {d.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {d.type === 'Cash' ? `PKR ${Number(d.amount_or_quantity).toLocaleString()}` : `${d.amount_or_quantity} ${item?.unit || 'units'}`}
                        </strong>
                      </td>
                      <td>
                        {d.type === 'In-Kind' ? (
                          <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                            + Increased Stock
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Added to Funds
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: Record Donation --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Relief Donation"
      >
        <form onSubmit={handleSubmit}>
          {formErrors.submit && (
            <div className="banner-alert warning">
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Donation Type *</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="donationType"
                  value="Cash"
                  checked={donationType === 'Cash'}
                  onChange={() => setDonationType('Cash')}
                />
                💵 Cash Donation
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="donationType"
                  value="In-Kind"
                  checked={donationType === 'In-Kind'}
                  onChange={() => setDonationType('In-Kind')}
                />
                📦 In-Kind Goods (Raises Stock)
              </label>
            </div>
          </div>

          {donationType === 'Cash' ? (
            <>
              <div className="form-group">
                <label className="form-label">Donation Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {formErrors.cashAmount && <div className="form-error">{formErrors.cashAmount}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Category / Purpose *</label>
                <select
                  className="form-select"
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value)}
                >
                  {CASH_PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {formErrors.cashCategory && <div className="form-error">{formErrors.cashCategory}</div>}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Donated Inventory Item *</label>
                <select
                  className="form-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category}) — Current Stock: {item.stock} {item.unit}
                    </option>
                  ))}
                </select>
                {formErrors.selectedItemId && <div className="form-error">{formErrors.selectedItemId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Quantity Donated ({itemsMap[selectedItemId]?.unit || 'units'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={inKindQuantity}
                  onChange={(e) => setInKindQuantity(e.target.value)}
                />
                {formErrors.inKindQuantity && <div className="form-error">{formErrors.inKindQuantity}</div>}
                <p className="form-help">
                  Rule: Recording an In-Kind donation will immediately increase the warehouse stock of <strong>{itemsMap[selectedItemId]?.name}</strong> by this quantity.
                </p>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Recording...' : 'Save Donation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
