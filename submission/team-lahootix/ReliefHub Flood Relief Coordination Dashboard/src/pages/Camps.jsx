import React, { useState, useEffect, useMemo } from 'react';
import { campsApi, needsApi, volunteersApi } from '../api/client';
import { useRole } from '../context/RoleContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertTriangle, ClipboardList, Info, MapPin, Plus, UserRound, UsersRound, X } from 'lucide-react';

const SINDH_DISTRICTS = [
  'Sukkur',
  'Larkana',
  'Dadu',
  'Jacobabad',
  'Khairpur',
  'Shikarpur',
  'Thatta',
  'Badin'
];

export function Camps() {
  const { isAdmin } = useRole();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [deleteCampTarget, setDeleteCampTarget] = useState(null);
  const [selectedCampDetail, setSelectedCampDetail] = useState(null);
  const [campDetailNeeds, setCampDetailNeeds] = useState([]);
  const [campDetailVolunteers, setCampDetailVolunteers] = useState([]);
  const [inventoryItemsMap, setInventoryItemsMap] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    district: 'Sukkur',
    capacity: 100,
    current_families: 0,
    status: 'Open'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCamps();
  }, []);

  async function loadCamps() {
    try {
      setLoading(true);
      setError(null);
      const data = await campsApi.getAll();
      setCamps(data);
    } catch (err) {
      setError('Failed to load camps. Make sure the mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // Open Form for Create or Edit
  function openForm(camp = null) {
    if (camp) {
      setEditingCamp(camp);
      setFormData({
        name: camp.name,
        district: camp.district,
        capacity: camp.capacity,
        current_families: camp.current_families,
        status: camp.status
      });
    } else {
      setEditingCamp(null);
      setFormData({
        name: '',
        district: 'Sukkur',
        capacity: 100,
        current_families: 0,
        status: 'Open'
      });
    }
    setFormErrors({});
    setIsFormOpen(true);
  }

  // Auto-status calculator business rule
  function calculateAutoStatus(families, capacity, manualStatus) {
    if (manualStatus === 'Closed') {
      return 'Closed';
    }
    if (Number(families) >= Number(capacity)) {
      return 'Full';
    }
    return 'Open';
  }

  // Form Change Handler
  function handleFormChange(e) {
    const { name, value } = e.target;
    let nextFormData = { ...formData, [name]: value };

    if (name === 'capacity' || name === 'current_families') {
      const families = name === 'current_families' ? parseInt(value) || 0 : parseInt(formData.current_families) || 0;
      const capacity = name === 'capacity' ? parseInt(value) || 0 : parseInt(formData.capacity) || 0;
      
      // Enforce auto status rule
      nextFormData.status = calculateAutoStatus(families, capacity, formData.status);
    }

    if (name === 'status') {
      const families = parseInt(formData.current_families) || 0;
      const capacity = parseInt(formData.capacity) || 0;
      if (value !== 'Closed' && families >= capacity) {
        nextFormData.status = 'Full';
      }
    }

    setFormData(nextFormData);
  }

  // Form Validation
  function validateForm() {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Camp name is required';
    }
    if (!formData.district) {
      errors.district = 'District is required';
    }
    const cap = Number(formData.capacity);
    if (isNaN(cap) || cap < 1) {
      errors.capacity = 'Capacity must be at least 1 family';
    }
    const fam = Number(formData.current_families);
    if (isNaN(fam) || fam < 0) {
      errors.current_families = 'Current families must be 0 or greater';
    }
    return errors;
  }

  // Form Submit
  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const families = parseInt(formData.current_families, 10);
      const capacity = parseInt(formData.capacity, 10);
      const status = calculateAutoStatus(families, capacity, formData.status);

      const payload = {
        name: formData.name.trim(),
        district: formData.district,
        capacity,
        current_families: families,
        status
      };

      if (editingCamp) {
        const updated = await campsApi.update(editingCamp.id, payload);
        setCamps(prev => prev.map(c => c.id === editingCamp.id ? updated : c));
        if (selectedCampDetail?.id === editingCamp.id) {
          setSelectedCampDetail(updated);
        }
      } else {
        const created = await campsApi.create(payload);
        setCamps(prev => [...prev, created]);
      }

      setIsFormOpen(false);
    } catch (err) {
      setFormErrors({ submit: 'Failed to save camp. Please verify API server.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Delete Action
  async function handleDeleteConfirm() {
    if (!deleteCampTarget) return;
    try {
      setSubmitting(true);
      await campsApi.delete(deleteCampTarget.id);
      setCamps(prev => prev.filter(c => c.id !== deleteCampTarget.id));
      if (selectedCampDetail?.id === deleteCampTarget.id) {
        setSelectedCampDetail(null);
      }
      setDeleteCampTarget(null);
    } catch (err) {
      alert('Failed to delete camp.');
    } finally {
      setSubmitting(false);
    }
  }

  // View Camp Details
  async function viewDetails(camp) {
    setSelectedCampDetail(camp);
    setDetailLoading(true);
    try {
      const [needs, vols, items] = await Promise.all([
        needsApi.getByCampId(camp.id),
        volunteersApi.getByCampId(camp.id),
        inventoryApi.getAll()
      ]);
      const map = {};
      items.forEach(item => {
        map[item.id] = item;
      });
      setInventoryItemsMap(map);
      setCampDetailNeeds(needs);
    } catch (err) {
      console.error('Failed to load camp relations:', err);
    } finally {
      setDetailLoading(false);
    }
  }

  // Delete need from camp detail
  async function handleDeleteNeedFromCamp(needId) {
    if (!window.confirm(`Are you sure you want to delete Need #${needId}?`)) return;
    try {
      await needsApi.delete(needId);
      setCampDetailNeeds(prev => prev.filter(n => n.id !== needId));
    } catch (err) {
      alert('Failed to remove need from camp.');
    }
  }

  // Filtered Camps
  const filteredCamps = useMemo(() => {
    return camps.filter(camp => {
      const matchesSearch =
        camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.district.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || camp.status === statusFilter;
      const matchesDistrict = districtFilter === 'ALL' || camp.district === districtFilter;

      return matchesSearch && matchesStatus && matchesDistrict;
    });
  }, [camps, searchQuery, statusFilter, districtFilter]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set(camps.map(c => c.district));
    return Array.from(set).sort();
  }, [camps]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relief Camps Management</h1>
          <p className="page-subtitle">
            Monitor shelter capacities, status transitions, and emergency camp requirements across Sindh districts.
          </p>
        </div>
        {isAdmin && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => openForm(null)}>
              <Plus size={15} /> Register new camp
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="banner-alert info">
          <Info size={17} /><span><strong>Field Volunteer View:</strong> You have read-only access to camps. Coordinator role required to add, modify, or remove camps.</span>
        </div>
      )}

      {error && (
        <div className="banner-alert warning">
          <AlertTriangle size={17} /><span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search camp by name or district..."
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
          <option value="Open">Open</option>
          <option value="Full">Full</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          className="select-input"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          aria-label="Filter by District"
        >
          <option value="ALL">All Districts</option>
          {uniqueDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {(searchQuery || statusFilter !== 'ALL' || districtFilter !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setDistrictFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Camps Table Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Registered Camps ({filteredCamps.length})
          </span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading relief camps from mock database...</p>
          </div>
        ) : filteredCamps.length === 0 ? (
          <div className="state-box">
            <p>No camps found matching the selected filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Camp Name</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Occupancy / Capacity</th>
                  <th>Utilization</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCamps.map(camp => {
                  const occupancyRatio = camp.capacity > 0 ? (camp.current_families / camp.capacity) : 0;
                  return (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 600 }}>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem'
                          }}
                          onClick={() => viewDetails(camp)}
                        >
                          {camp.name}
                        </button>
                      </td>
                      <td>
                        <span className="icon-text" style={{ color: 'var(--text-muted)' }}><MapPin size={13} /> {camp.district}</span>
                      </td>
                      <td>
                        <StatusBadge status={camp.status} />
                      </td>
                      <td>
                        <strong>{camp.current_families}</strong> / {camp.capacity} families
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <ProgressBar current={camp.current_families} total={camp.capacity} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewDetails(camp)}
                            title="View linked needs and volunteers"
                          >
                            Details
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openForm(camp)}
                                title="Edit camp parameters"
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteCampTarget(camp)}
                                title="Delete camp record"
                              >
                                Delete
                              </button>
                            </>
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

      {/* Camp Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCamp ? `Edit Camp: ${editingCamp.name}` : 'Register New Relief Camp'}
      >
        <form onSubmit={handleSubmit}>
          {formErrors.submit && (
            <div className="banner-alert warning" style={{ marginBottom: '1rem' }}>
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Camp Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Sukkur Barrage Relief Point"
              value={formData.name}
              onChange={handleFormChange}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">District *</label>
            <select
              name="district"
              className="form-select"
              value={formData.district}
              onChange={handleFormChange}
            >
              {SINDH_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {formErrors.district && <div className="form-error">{formErrors.district}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Total Capacity (Families) *</label>
              <input
                type="number"
                name="capacity"
                min="1"
                className="form-input"
                value={formData.capacity}
                onChange={handleFormChange}
              />
              {formErrors.capacity && <div className="form-error">{formErrors.capacity}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Current Families *</label>
              <input
                type="number"
                name="current_families"
                min="0"
                className="form-input"
                value={formData.current_families}
                onChange={handleFormChange}
              />
              {formErrors.current_families && <div className="form-error">{formErrors.current_families}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleFormChange}
            >
              <option value="Open">Open</option>
              <option value="Full">Full (Auto-assigned when families ≥ capacity)</option>
              <option value="Closed">Closed</option>
            </select>
            <p className="form-help">
              Rule: If current families ≥ capacity, status automatically switches to <strong>Full</strong>. If capacity is increased above families, a Full camp reverts to Open.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingCamp ? 'Update Camp' : 'Create Camp'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCampTarget)}
        onClose={() => setDeleteCampTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Camp"
        message={`Are you sure you want to delete "${deleteCampTarget?.name}"? This camp and its records will be permanently removed.`}
        confirmText="Delete Camp"
        loading={submitting}
      />

      {/* Camp Detail View Modal */}
      <Modal
        isOpen={Boolean(selectedCampDetail)}
        onClose={() => setSelectedCampDetail(null)}
        title={selectedCampDetail ? `Camp Details: ${selectedCampDetail.name}` : ''}
      >
        {selectedCampDetail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>District</span>
                <p className="icon-text" style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}><MapPin size={15} /> {selectedCampDetail.district}</p>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '0.2rem' }}><StatusBadge status={selectedCampDetail.status} /></div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Families Sheltered</span>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.2rem' }}>
                  {selectedCampDetail.current_families} / {selectedCampDetail.capacity}
                </p>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capacity Usage</span>
                <div style={{ marginTop: '0.5rem' }}>
                  <ProgressBar current={selectedCampDetail.current_families} total={selectedCampDetail.capacity} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                <span className="icon-text"><ClipboardList size={16} /> Camp Needs ({campDetailNeeds.length})</span>
              </h4>
              {detailLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading camp needs...</p>
              ) : campDetailNeeds.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No needs currently recorded for this camp.</p>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {campDetailNeeds.map(n => {
                    const item = inventoryItemsMap[n.inventory_item_id] || { name: `Inventory Item #${n.inventory_item_id}`, unit: 'Units' };
                    return (
                      <li key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <PriorityBadge priority={n.priority} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Fulfilled: <strong>{n.fulfilled_quantity}</strong> / {n.required_quantity} {item.unit}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '130px' }}>
                            <ProgressBar current={n.fulfilled_quantity} total={n.required_quantity} />
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteNeedFromCamp(n.id)}
                              title="Delete this need"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                <span className="icon-text"><UsersRound size={16} /> Assigned Volunteers ({campDetailVolunteers.length})</span>
              </h4>
              {detailLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading volunteers...</p>
              ) : campDetailVolunteers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No volunteers deployed to this camp yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {campDetailVolunteers.map(v => (
                    <span key={v.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '0.35rem 0.65rem', borderRadius: '4px', fontSize: '0.825rem' }}>
                      <span className="icon-text"><UserRound size={13} /> {v.name} <strong style={{ color: 'var(--accent-dark)' }}>({v.skill})</strong></span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCampDetail(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
