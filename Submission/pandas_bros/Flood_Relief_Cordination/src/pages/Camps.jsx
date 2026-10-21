import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { campsApi } from '../api/camps.api';
import { validateCamp } from '../utils/validation';
import { formatNumber } from '../utils/formatting';
import { getStatusBadgeClass } from '../utils/formatting';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Full', label: 'Full' },
  { value: 'Closed', label: 'Closed' },
];

const DISTRICTS = [
  'Khairpur', 'Sukkur', 'Larkana', 'Dadu', 
  'Shikarpur', 'Jacobabad', 'Ghotki', 'Naushahro Feroze'
];

const Camps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    capacity: '',
    current_families: '',
    status: 'Active',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const res = await campsApi.getAll();
      setCamps(res.data);
    } catch (err) {
      console.error('Failed to fetch camps:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(search.toLowerCase()) ||
      camp.district.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || camp.status === statusFilter;
    const matchesDistrict = !districtFilter || camp.district === districtFilter;
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  const openCreateModal = () => {
    setEditingCamp(null);
    setFormData({ name: '', district: '', capacity: '', current_families: '', status: 'Active' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (camp) => {
    setEditingCamp(camp);
    setFormData({
      name: camp.name,
      district: camp.district,
      capacity: camp.capacity.toString(),
      current_families: camp.current_families.toString(),
      status: camp.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCamp(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const currentFamilies = Number(formData.current_families);
      const capacity = Number(formData.capacity);
      let status = formData.status;
      
      // Auto-set status to Full when current_families >= capacity
      if (currentFamilies >= capacity && status !== 'Closed') {
        status = 'Full';
      }
      
      const payload = {
        name: formData.name.trim(),
        district: formData.district.trim(),
        capacity: capacity,
        current_families: currentFamilies,
        status: status,
      };
      
      if (editingCamp) {
        await campsApi.update(editingCamp.id, payload);
      } else {
        await campsApi.create(payload);
      }
      setModalOpen(false);
      fetchCamps();
    } catch (err) {
      console.error('Failed to save camp:', err);
      setFormErrors({ submit: 'Failed to save camp. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await campsApi.delete(deleteConfirm.id);
      fetchCamps();
    } catch (err) {
      console.error('Failed to delete camp:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (camp) => {
    setDeleteConfirm(camp);
  };

  const getStatusBadge = (status) => (
    <Badge variant={getStatusBadgeClass(status)}>{status}</Badge>
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            Relief Camps
          </h1>
          <p className="page-subtitle">Manage flood relief camps across Sindh</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Add Camp
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search camps by name or district..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Search camps"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
              className="w-40"
            />
            <Select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              options={[{ value: '', label: 'All Districts' }, ...DISTRICTS.map(d => ({ value: d, label: d }))]}
              className="w-48"
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
          ) : filteredCamps.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Building2 className="w-12 h-12 text-slate-300" />}
              title={search || statusFilter || districtFilter ? 'No camps found' : 'No camps yet'}
              description={search || statusFilter || districtFilter 
                ? 'Try adjusting your search or filters'
                : 'Create your first relief camp to get started'}
              action={!search && !statusFilter && !districtFilter ? (
                <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                  Add Camp
                </Button>
              ) : null}
            />
          ) : (
            <Table
              data={filteredCamps}
              keyField="id"
              columns={[
                { key: 'name', header: 'Camp Name', render: (v, row) => (
                  <Link to={`/camps/${row.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                    {v}
                  </Link>
                )},
                { key: 'district', header: 'District' },
                { key: 'capacity', header: 'Capacity', render: (v) => formatNumber(v) },
                { key: 'current_families', header: 'Current Families', render: (v, row) => (
                  <span className={v >= row.capacity ? 'text-red-600 font-medium' : ''}>
                    {formatNumber(v)} / {formatNumber(row.capacity)}
                  </span>
                )},
                { key: 'status', header: 'Status', render: getStatusBadge },
              ]}
              renderRowActions={(row) => (
                <div className="flex items-center gap-1">
                  <Link to={`/camps/${row.id}`} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded" aria-label="View details">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                    aria-label="Edit camp"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(row)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete camp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              emptyMessage="No camps found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCamp ? 'Edit Camp' : 'Add New Camp'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingCamp ? 'Save Changes' : 'Create Camp'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Camp Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g., Khairpur Relief Camp"
            required
            maxLength={100}
          />
          
          <Select
            label="District"
            value={formData.district}
            onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
            options={DISTRICTS.map(d => ({ value: d, label: d }))}
            error={formErrors.district}
            placeholder="Select district"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              error={formErrors.capacity}
              placeholder="500"
              required
              min="1"
            />
            
            <Input
              label="Current Families"
              type="number"
              value={formData.current_families}
              onChange={e => setFormData(prev => ({ ...prev, current_families: e.target.value }))}
              error={formErrors.current_families}
              placeholder="0"
              required
              min="0"
            />
          </div>
          
          <Select
            label="Status"
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            options={STATUS_OPTIONS}
            error={formErrors.status}
            required
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
        title="Delete Camp"
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
        <p className="text-sm text-slate-500 mt-2">
          This will also remove associated needs and dispatches for this camp.
        </p>
      </Modal>
    </div>
  );
};

export default Camps;