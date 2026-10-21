import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Package
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { needsApi } from '../api/needs.api';
import { campsApi } from '../api/camps.api';
import { inventoryApi } from '../api/inventory.api';
import { dispatchesApi } from '../api/dispatches.api';
import { validateNeed } from '../utils/validation';
import { calculateFulfillmentPercentage, calculateRemainingDemand } from '../utils/calculations';
import { formatNumber, formatPercentage, getStatusBadgeClass } from '../utils/formatting';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';

const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const Needs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [needs, setNeeds] = useState([]);
  const [camps, setCamps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [campFilter, setCampFilter] = useState(searchParams.get('camp') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);
  const [formData, setFormData] = useState({
    camp_id: '',
    inventory_item_id: '',
    required_quantity: '',
    priority: 'High',
    fulfilled_quantity: '0',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [gapFilter, setGapFilter] = useState(searchParams.get('gap') === 'true');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [needsRes, campsRes, inventoryRes, dispatchesRes] = await Promise.all([
        needsApi.getAll(),
        campsApi.getAll(),
        inventoryApi.getAll(),
        dispatchesApi.getAll(),
      ]);
      
      setNeeds(needsRes.data);
      setCamps(campsRes.data.filter(c => c.status !== 'Closed'));
      setInventory(inventoryRes.data);
      setDispatches(dispatchesRes.data);
    } catch (err) {
      console.error('Failed to fetch needs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNeeds = needs.filter(need => {
    const camp = camps.find(c => c.id === need.camp_id);
    const item = inventory.find(i => i.id === need.inventory_item_id);
    const matchesSearch = camp?.name.toLowerCase().includes(search.toLowerCase()) ||
      item?.name.toLowerCase().includes(search.toLowerCase());
    const matchesCamp = !campFilter || need.camp_id === campFilter;
    const matchesPriority = !priorityFilter || need.priority === priorityFilter;
    const matchesGap = !gapFilter || (need.priority === 'High' && 
      calculateFulfillmentPercentage(Number(need.required_quantity), Number(need.fulfilled_quantity)) < 40);
    return matchesSearch && matchesCamp && matchesPriority && matchesGap;
  });

  const openCreateModal = (prefillCampId = null) => {
    setEditingNeed(null);
    setFormData({
      camp_id: prefillCampId || '',
      inventory_item_id: '',
      required_quantity: '',
      priority: 'High',
      fulfilled_quantity: '0',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (need) => {
    setEditingNeed(need);
    setFormData({
      camp_id: need.camp_id,
      inventory_item_id: need.inventory_item_id,
      required_quantity: need.required_quantity.toString(),
      priority: need.priority,
      fulfilled_quantity: need.fulfilled_quantity.toString(),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateNeed(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        camp_id: formData.camp_id,
        inventory_item_id: formData.inventory_item_id,
        required_quantity: Number(formData.required_quantity),
        priority: formData.priority,
        fulfilled_quantity: Number(formData.fulfilled_quantity),
      };
      
      if (editingNeed) {
        await needsApi.update(editingNeed.id, payload);
      } else {
        await needsApi.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save need:', err);
      setFormErrors({ submit: 'Failed to save need. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await needsApi.delete(deleteConfirm.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete need:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (need) => {
    setDeleteConfirm(need);
  };

  const getPriorityBadge = (priority) => (
    <Badge variant={priority === 'High' ? 'danger' : priority === 'Medium' ? 'warning' : 'info'}>
      {priority}
    </Badge>
  );

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (campFilter) params.set('camp', campFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (gapFilter) params.set('gap', 'true');
    setSearchParams(params);
  };

  useEffect(() => {
    updateSearchParams();
  }, [search, campFilter, priorityFilter, gapFilter]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            Camp Needs
          </h1>
          <p className="page-subtitle">Track and manage relief supply requirements</p>
        </div>
        <Button onClick={() => openCreateModal(campFilter || null)} icon={<Plus className="w-4 h-4" />}>
          Add Need
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search by camp name or item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Search needs"
              />
            </div>
            <Select
              value={campFilter}
              onChange={e => setCampFilter(e.target.value)}
              options={[{ value: '', label: 'All Camps' }, ...camps.map(c => ({ value: c.id, label: c.name }))]}
              className="w-56"
            />
            <Select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              options={[{ value: '', label: 'All Priorities' }, ...PRIORITY_OPTIONS]}
              className="w-40"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gapFilter}
                onChange={e => setGapFilter(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">Critical Gaps Only</span>
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : filteredNeeds.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Package className="w-12 h-12 text-slate-300" />}
              title={search || campFilter || priorityFilter || gapFilter ? 'No needs found' : 'No needs yet'}
              description={search || campFilter || priorityFilter || gapFilter 
                ? 'Try adjusting your search or filters'
                : 'Create your first camp need to get started'}
              action={!search && !campFilter && !priorityFilter && !gapFilter ? (
                <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                  Add Need
                </Button>
              ) : null}
            />
          ) : (
            <Table
              data={filteredNeeds}
              keyField="id"
              columns={[
                { key: 'camp_id', header: 'Camp', render: (v) => {
                  const camp = camps.find(c => c.id === v);
                  return camp ? (
                    <Link to={`/camps/${v}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {camp.name}
                    </Link>
                  ) : 'Unknown';
                }},
                { key: 'district', header: 'District', render: (v, row) => {
                  const camp = camps.find(c => c.id === row.camp_id);
                  return camp?.district || '-';
                }},
                { key: 'inventory_item_id', header: 'Item', render: (v) => {
                  const item = inventory.find(i => i.id === v);
                  return item ? (
                    <Link to={`/inventory/${v}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {item.name}
                    </Link>
                  ) : 'Unknown';
                }},
                { key: 'category', header: 'Category', render: (v, row) => {
                  const item = inventory.find(i => i.id === row.inventory_item_id);
                  return item ? <Badge variant="info">{item.category}</Badge> : '-';
                }},
                { key: 'priority', header: 'Priority', render: getPriorityBadge },
                { key: 'required_quantity', header: 'Required', render: (v) => formatNumber(v) },
                { key: 'fulfilled_quantity', header: 'Fulfilled', render: (v) => formatNumber(v) },
                { key: 'remaining', header: 'Remaining', render: (v, row) => {
                  const remaining = calculateRemainingDemand(row, dispatches);
                  return <span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {formatNumber(remaining)}
                  </span>;
                }},
                { key: 'percentage', header: 'Fulfilled %', render: (v, row) => {
                  const pct = calculateFulfillmentPercentage(Number(row.required_quantity), Number(row.fulfilled_quantity));
                  return (
                    <div className="flex items-center gap-2 w-48">
                      <ProgressBar value={pct} max={100} showLabel={false} size="sm" 
                        variant={pct < 40 ? 'danger' : pct < 80 ? 'warning' : 'success'} className="flex-1" />
                      <span className="text-xs font-medium">{formatPercentage(pct, 0)}</span>
                    </div>
                  );
                }},
              ]}
              renderRowActions={(row) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                    aria-label="Edit need"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(row)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete need"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              emptyMessage="No needs found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNeed ? 'Edit Need' : 'Add New Need'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingNeed ? 'Save Changes' : 'Create Need'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Camp"
            value={formData.camp_id}
            onChange={e => setFormData(prev => ({ ...prev, camp_id: e.target.value }))}
            options={camps.map(c => ({ value: c.id, label: `${c.name} (${c.district})` }))}
            error={formErrors.camp_id}
            placeholder="Select camp"
            required
          />
          
          <Select
            label="Inventory Item"
            value={formData.inventory_item_id}
            onChange={e => setFormData(prev => ({ ...prev, inventory_item_id: e.target.value }))}
            options={inventory.map(i => ({ value: i.id, label: `${i.name} (${i.category})` }))}
            error={formErrors.inventory_item_id}
            placeholder="Select item"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Required Quantity"
              type="number"
              value={formData.required_quantity}
              onChange={e => setFormData(prev => ({ ...prev, required_quantity: e.target.value }))}
              error={formErrors.required_quantity}
              placeholder="100"
              required
              min="1"
            />
            
            <Input
              label="Fulfilled Quantity"
              type="number"
              value={formData.fulfilled_quantity}
              onChange={e => setFormData(prev => ({ ...prev, fulfilled_quantity: e.target.value }))}
              error={formErrors.fulfilled_quantity}
              placeholder="0"
              min="0"
            />
          </div>
          
          <Select
            label="Priority"
            value={formData.priority}
            onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            options={PRIORITY_OPTIONS}
            error={formErrors.priority}
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
        title="Delete Need"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete this need? This action cannot be undone.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Associated dispatches will not be affected.
        </p>
      </Modal>
    </div>
  );
};

export default Needs;