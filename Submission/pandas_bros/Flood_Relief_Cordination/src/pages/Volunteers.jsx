import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  UserMinus,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { volunteersApi } from '../api/volunteers.api';
import { campsApi } from '../api/camps.api';
import { validateVolunteer } from '../utils/validation';
import { getDeployedVolunteersCount } from '../utils/calculations';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

const SKILL_OPTIONS = [
  { value: 'Medical', label: 'Medical' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Cooking', label: 'Cooking' },
  { value: 'Driving', label: 'Driving' },
  { value: 'Counselling', label: 'Counselling' },
];

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [campFilter, setCampFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    skill: '',
    camp_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [volunteersRes, campsRes] = await Promise.all([
        volunteersApi.getAll(),
        campsApi.getAll(),
      ]);
      setVolunteers(volunteersRes.data);
      setCamps(campsRes.data.filter(c => c.status !== 'Closed'));
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = !skillFilter || volunteer.skill === skillFilter;
    const matchesCamp = !campFilter || volunteer.camp_id === campFilter;
    return matchesSearch && matchesSkill && matchesCamp;
  });

  const openCreateModal = () => {
    setEditingVolunteer(null);
    setFormData({ name: '', skill: '', camp_id: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (volunteer) => {
    setEditingVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      skill: volunteer.skill,
      camp_id: volunteer.camp_id || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateVolunteer(formData, volunteers, editingVolunteer?.id);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        skill: formData.skill,
        camp_id: formData.camp_id || null,
      };
      
      if (editingVolunteer) {
        await volunteersApi.update(editingVolunteer.id, payload);
      } else {
        await volunteersApi.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save volunteer:', err);
      setFormErrors({ submit: 'Failed to save volunteer. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (volunteer) => {
    setDeleteConfirm(volunteer);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await volunteersApi.delete(deleteConfirm.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const unassignVolunteer = async (volunteer) => {
    try {
      await volunteersApi.patch(volunteer.id, { camp_id: null });
      fetchData();
    } catch (err) {
      console.error('Failed to unassign volunteer:', err);
    }
  };

  const deployedCount = getDeployedVolunteersCount(volunteers, camps);
  const unassignedCount = volunteers.filter(v => !v.camp_id).length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Volunteers
          </h1>
          <p className="page-subtitle">Manage volunteer registrations and camp assignments</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Register Volunteer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Total Volunteers</p>
              <p className="kpi-value">{volunteers.length}</p>
            </div>
            <div className="kpi-icon bg-primary-100 text-primary-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Deployed</p>
              <p className="kpi-value text-green-600">{deployedCount}</p>
            </div>
            <div className="kpi-icon bg-green-100 text-green-600">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Available</p>
              <p className="kpi-value text-amber-600">{unassignedCount}</p>
            </div>
            <div className="kpi-icon bg-amber-100 text-amber-600">
              <UserMinus className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="search"
                placeholder="Search volunteers by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Search volunteers"
              />
            </div>
            <Select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              options={[{ value: '', label: 'All Skills' }, ...SKILL_OPTIONS]}
              className="w-40"
            />
            <Select
              value={campFilter}
              onChange={e => setCampFilter(e.target.value)}
              options={[{ value: '', label: 'All Camps' }, { value: 'unassigned', label: 'Unassigned' }, ...camps.map(c => ({ value: c.id, label: c.name }))]}
              className="w-56"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Users className="w-12 h-12 text-surface-300" />}
              title={search || skillFilter || campFilter ? 'No volunteers found' : 'No volunteers yet'}
              description={search || skillFilter || campFilter 
                ? 'Try adjusting your search or filters'
                : 'Register your first volunteer to get started'}
              action={!search && !skillFilter && !campFilter ? (
                <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                  Register Volunteer
                </Button>
              ) : null}
            />
          ) : (
            <Table
              data={filteredVolunteers}
              keyField="id"
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'skill', header: 'Skill', render: (v) => <Badge variant="info">{v}</Badge> },
                { key: 'camp_id', header: 'Assigned Camp', render: (v) => {
                  if (!v) return <span className="text-surface-400">Unassigned</span>;
                  const camp = camps.find(c => c.id === v);
                  return camp ? (
                    <Link to={`/camps/${v}`} className="text-primary-600 hover:text-primary-700">
                      {camp.name}
                    </Link>
                  ) : 'Unknown';
                }},
                { key: 'status', header: 'Status', render: (v, row) => {
                  if (!row.camp_id) {
                    return <Badge variant="warning">Available</Badge>;
                  }
                  const camp = camps.find(c => c.id === row.camp_id);
                  if (!camp) return <Badge variant="neutral">Unknown Camp</Badge>;
                  if (camp.status === 'Closed') return <Badge variant="danger">Camp Closed</Badge>;
                  return <Badge variant="success">Deployed</Badge>;
                }},
              ]}
              renderRowActions={(row) => (
                <div className="flex items-center gap-1">
                  {row.camp_id ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => unassignVolunteer(row)}
                      icon={<UserMinus className="w-3 h-3" />}
                    >
                      Unassign
                    </Button>
                  ) : (
                    camps.length > 0 && (
                      <select
                        className="px-2 py-1 text-xs border border-surface-300 rounded hover:border-primary-500"
                        onChange={e => {
                          if (e.target.value) {
                            volunteersApi.patch(row.id, { camp_id: e.target.value });
                            fetchData();
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Assign...</option>
                        {camps.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )
                  )}
                  <button
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                    aria-label="Edit volunteer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(row)}
                    className="p-1.5 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete volunteer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              emptyMessage="No volunteers found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVolunteer ? 'Edit Volunteer' : 'Register New Volunteer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingVolunteer ? 'Save Changes' : 'Register Volunteer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g., Dr. Ahmed Khan"
            required
            maxLength={100}
          />
          
          <Select
            label="Skill"
            value={formData.skill}
            onChange={e => setFormData(prev => ({ ...prev, skill: e.target.value }))}
            options={SKILL_OPTIONS}
            error={formErrors.skill}
            placeholder="Select skill"
            required
          />
          
          <Select
            label="Assign to Camp (Optional)"
            value={formData.camp_id}
            onChange={e => setFormData(prev => ({ ...prev, camp_id: e.target.value }))}
            options={[{ value: '', label: 'Unassigned' }, ...camps.map(c => ({ value: c.id, label: `${c.name} (${c.district})` }))]}
            placeholder="Select camp (optional)"
          />
          
          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
              {formErrors.submit}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Volunteer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Volunteers;