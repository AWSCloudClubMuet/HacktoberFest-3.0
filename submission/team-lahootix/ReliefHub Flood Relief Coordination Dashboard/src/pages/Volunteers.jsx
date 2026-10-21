import React, { useState, useEffect, useMemo } from 'react';
import { volunteersApi, campsApi } from '../api/client';
import { useRole } from '../context/RoleContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

const VOLUNTEER_SKILLS = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];

export function Volunteers() {
  const { isAdmin } = useRole();

  // Data states
  const [volunteers, setVolunteers] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    skill: 'Medical',
    camp_id: ''
  });
  const [registerErrors, setRegisterErrors] = useState({});

  // Assign/Unassign Modal
  const [assigningVolunteer, setAssigningVolunteer] = useState(null);
  const [assignCampId, setAssignCampId] = useState('');
  const [assignError, setAssignError] = useState(null);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [volsData, campsData] = await Promise.all([
        volunteersApi.getAll(),
        campsApi.getAll()
      ]);
      setVolunteers(volsData);
      setCamps(campsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load volunteer records. Verify mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // Fast camps lookup
  const campsMap = useMemo(() => {
    const map = {};
    camps.forEach(c => { map[c.id] = c; });
    return map;
  }, [camps]);

  // Active (non-closed) camps eligible for deployment (FR-4.4)
  const openCamps = useMemo(() => {
    return camps.filter(c => c.status !== 'Closed');
  }, [camps]);

  // Open Register Modal
  function handleOpenRegister() {
    setRegisterFormData({
      name: '',
      skill: 'Medical',
      camp_id: ''
    });
    setRegisterErrors({});
    setIsRegisterOpen(true);
  }

  // Validate Register Form
  function validateRegister() {
    const errors = {};
    if (!registerFormData.name.trim()) errors.name = 'Volunteer name is required';
    if (!registerFormData.skill) errors.skill = 'Skill specialty is required';
    if (registerFormData.camp_id) {
      const targetCamp = campsMap[registerFormData.camp_id];
      if (targetCamp && targetCamp.status === 'Closed') {
        errors.camp_id = 'Volunteers cannot be deployed to Closed camps';
      }
    }
    return errors;
  }

  // Submit Register Form
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const errors = validateRegister();
    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: registerFormData.name.trim(),
        skill: registerFormData.skill,
        camp_id: registerFormData.camp_id ? Number(registerFormData.camp_id) : null
      };

      const created = await volunteersApi.create(payload);
      setVolunteers(prev => [...prev, created]);
      setIsRegisterOpen(false);
    } catch (err) {
      console.error(err);
      setRegisterErrors({ submit: 'Failed to register volunteer.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Open Assign Modal
  function handleOpenAssign(volunteer) {
    setAssigningVolunteer(volunteer);
    setAssignCampId(volunteer.camp_id ? String(volunteer.camp_id) : '');
    setAssignError(null);
  }

  // Submit Assignment (FR-4.4)
  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assigningVolunteer) return;

    if (assignCampId) {
      const camp = campsMap[assignCampId];
      if (camp && camp.status === 'Closed') {
        setAssignError('Violation: Volunteers cannot be assigned to a Closed camp.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const newCampId = assignCampId ? Number(assignCampId) : null;
      const updated = await volunteersApi.update(assigningVolunteer.id, {
        camp_id: newCampId
      });

      setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));
      setAssigningVolunteer(null);
    } catch (err) {
      setAssignError('Failed to update camp deployment assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  // Quick Unassign
  async function handleQuickUnassign(volunteer) {
    try {
      setSubmitting(true);
      const updated = await volunteersApi.update(volunteer.id, { camp_id: null });
      setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));
    } catch (err) {
      alert('Failed to unassign volunteer.');
    } finally {
      setSubmitting(false);
    }
  }

  // Confirm Delete
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await volunteersApi.delete(deleteTarget.id);
      setVolunteers(prev => prev.filter(v => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete volunteer.');
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSkill = skillFilter === 'ALL' || v.skill === skillFilter;
      const isAssigned = v.camp_id !== null && v.camp_id !== undefined;
      const matchesAssign = assignmentFilter === 'ALL' ||
        (assignmentFilter === 'ASSIGNED' && isAssigned) ||
        (assignmentFilter === 'UNASSIGNED' && !isAssigned);

      return matchesSearch && matchesSkill && matchesAssign;
    });
  }, [volunteers, searchQuery, skillFilter, assignmentFilter]);

  // Skill stats
  const assignedCount = volunteers.filter(v => v.camp_id !== null).length;
  const unassignedCount = volunteers.length - assignedCount;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Volunteer Force & Field Deployments</h1>
          <p className="page-subtitle">
            Track relief personnel, skill sets, and active assignments to Sindh flood shelter camps.
          </p>
        </div>
        {isAdmin && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleOpenRegister}>
              + Register New Volunteer
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="banner-alert info">
          <span>ℹ️ <strong>Field Volunteer View:</strong> Read-only access to personnel rosters. Relief Coordinator permissions required to register volunteers or assign camps.</span>
        </div>
      )}

      {error && (
        <div className="banner-alert warning">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <span className="kpi-title">Total Volunteers</span>
          <span className="kpi-value">{volunteers.length}</span>
          <span className="kpi-sub">Registered across 5 key skills</span>
        </div>

        <div className="kpi-card green">
          <span className="kpi-title">Deployed in Field</span>
          <span className="kpi-value">{assignedCount}</span>
          <span className="kpi-sub">Assigned to active camps</span>
        </div>

        <div className="kpi-card amber">
          <span className="kpi-title">Available for Deployment</span>
          <span className="kpi-value">{unassignedCount}</span>
          <span className="kpi-sub">Ready for assignment</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search volunteer by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="select-input"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          aria-label="Filter by Skill"
        >
          <option value="ALL">All Skills ({volunteers.length})</option>
          {VOLUNTEER_SKILLS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="select-input"
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
          aria-label="Filter by Assignment"
        >
          <option value="ALL">All Deployment Statuses</option>
          <option value="ASSIGNED">✅ Deployed ({assignedCount})</option>
          <option value="UNASSIGNED">⏳ Unassigned ({unassignedCount})</option>
        </select>

        {(searchQuery || skillFilter !== 'ALL' || assignmentFilter !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSkillFilter('ALL');
              setAssignmentFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Volunteers Table Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Volunteer Roster ({filteredVolunteers.length})</span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading volunteer roster...</p>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="state-box">
            <p>No volunteers found matching current criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer Name</th>
                  <th>Skill Specialty</th>
                  <th>Status</th>
                  <th>Assigned Camp Location</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map(v => {
                  const camp = v.camp_id ? campsMap[v.camp_id] : null;
                  return (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600 }}>👤 {v.name}</td>
                      <td>
                        <span className="badge badge-transit">{v.skill}</span>
                      </td>
                      <td>
                        {v.camp_id ? (
                          <span className="badge badge-delivered">✅ Deployed</span>
                        ) : (
                          <span className="badge badge-pending">⏳ Available</span>
                        )}
                      </td>
                      <td>
                        {camp ? (
                          <div>
                            <strong>{camp.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              📍 {camp.district} (Status: {camp.status})
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenAssign(v)}
                              title="Assign or reassign camp"
                            >
                              {v.camp_id ? 'Reassign' : 'Assign Camp'}
                            </button>
                            {v.camp_id && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleQuickUnassign(v)}
                                title="Unassign from camp"
                              >
                                Unassign
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTarget(v)}
                              title="Remove volunteer"
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

      {/* --- MODAL: Register New Volunteer --- */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Relief Volunteer"
      >
        <form onSubmit={handleRegisterSubmit}>
          {registerErrors.submit && (
            <div className="banner-alert warning">
              <span>{registerErrors.submit}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Volunteer Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Dr. Shireen Mazari"
              value={registerFormData.name}
              onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
            />
            {registerErrors.name && <div className="form-error">{registerErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Primary Skill / Role *</label>
            <select
              className="form-select"
              value={registerFormData.skill}
              onChange={(e) => setRegisterFormData({ ...registerFormData, skill: e.target.value })}
            >
              {VOLUNTEER_SKILLS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {registerErrors.skill && <div className="form-error">{registerErrors.skill}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Initial Camp Deployment (Optional)</label>
            <select
              className="form-select"
              value={registerFormData.camp_id}
              onChange={(e) => setRegisterFormData({ ...registerFormData, camp_id: e.target.value })}
            >
              <option value="">-- Leave Unassigned (Reserve Pool) --</option>
              {openCamps.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district}) — {c.status}
                </option>
              ))}
            </select>
            {registerErrors.camp_id && <div className="form-error">{registerErrors.camp_id}</div>}
            <p className="form-help">
              Rule: Volunteers can only be assigned to Open or Full camps. Closed camps cannot receive personnel.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRegisterOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register Volunteer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: Assign / Reassign Camp --- */}
      <Modal
        isOpen={Boolean(assigningVolunteer)}
        onClose={() => setAssigningVolunteer(null)}
        title={assigningVolunteer ? `Deploy Volunteer: ${assigningVolunteer.name}` : ''}
      >
        <form onSubmit={handleAssignSubmit}>
          {assignError && (
            <div className="banner-alert warning">
              <span>{assignError}</span>
            </div>
          )}

          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.85rem' }}>
              Specialty: <strong style={{ color: 'var(--accent-dark)' }}>{assigningVolunteer?.skill}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Current Deployment:{' '}
              <strong>
                {assigningVolunteer?.camp_id ? campsMap[assigningVolunteer.camp_id]?.name : 'Unassigned'}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Destination Camp *</label>
            <select
              className="form-select"
              value={assignCampId}
              onChange={(e) => {
                setAssignCampId(e.target.value);
                setAssignError(null);
              }}
            >
              <option value="">-- Unassigned (Standby) --</option>
              {camps.map(c => {
                const isClosed = c.status === 'Closed';
                return (
                  <option key={c.id} value={c.id} disabled={isClosed}>
                    {c.name} ({c.district}) {isClosed ? '— [CLOSED: Cannot Assign]' : `— ${c.status}`}
                  </option>
                );
              })}
            </select>
            <p className="form-help">
              Rule FR-4.4: A volunteer can have only one camp assignment, and cannot be assigned to a Closed camp.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAssigningVolunteer(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Deployment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CONFIRM: Delete Volunteer --- */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Volunteer Record"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from the volunteer directory?`}
        confirmText="Remove Volunteer"
        loading={submitting}
      />
    </div>
  );
}
