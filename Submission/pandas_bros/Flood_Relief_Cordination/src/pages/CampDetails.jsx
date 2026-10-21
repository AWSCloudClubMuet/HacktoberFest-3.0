import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Building2, 
  Users, 
  Package, 
  Truck,
  Heart,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { campsApi } from '../api/camps.api';
import { needsApi } from '../api/needs.api';
import { dispatchesApi } from '../api/dispatches.api';
import { volunteersApi } from '../api/volunteers.api';
import { inventoryApi } from '../api/inventory.api';
import { validateCamp } from '../utils/validation';
import { calculateFulfillmentPercentage, calculateRemainingDemand } from '../utils/calculations';
import { formatNumber, formatPercentage, getStatusBadgeClass, formatDate } from '../utils/formatting';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Full', label: 'Full' },
  { value: 'Closed', label: 'Closed' },
];

const DISTRICTS = [
  'Khairpur', 'Sukkur', 'Larkana', 'Dadu', 
  'Shikarpur', 'Jacobabad', 'Ghotki', 'Naushahro Feroze'
];

const CampDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [camp, setCamp] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, needsRes, dispatchesRes, volunteersRes, inventoryRes] = await Promise.all([
        campsApi.getById(id),
        needsApi.getByCamp(id),
        dispatchesApi.getByCamp(id),
        volunteersApi.getByCamp(id),
        inventoryApi.getAll(),
      ]);
      
      setCamp(campRes.data);
      setNeeds(needsRes.data);
      setDispatches(dispatchesRes.data);
      setVolunteers(volunteersRes.data);
      setInventory(inventoryRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load camp details');
      console.error('Camp details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!camp) return;
    setFormData({
      name: camp.name,
      district: camp.district,
      capacity: camp.capacity.toString(),
      current_families: camp.current_families.toString(),
      status: camp.status,
    });
    setFormErrors({});
    setEditModalOpen(true);
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
      
      await campsApi.update(id, payload);
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update camp:', err);
      setFormErrors({ submit: 'Failed to update camp. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await campsApi.delete(id);
      navigate('/camps');
    } catch (err) {
      console.error('Failed to delete camp:', err);
    } finally {
      setDeleteConfirm(false);
    }
  };

  const getStatusBadge = (status) => (
    <Badge variant={getStatusBadgeClass(status)}>{status}</Badge>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="kpi-card animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-900 mb-2">Camp Not Found</h2>
        <p className="text-slate-500 mb-4">{error || 'The camp you are looking for does not exist.'}</p>
        <Link to="/camps"><Button>Back to Camps</Button></Link>
      </div>
    );
  }

  const totalRequired = needs.reduce((sum, n) => sum + (Number(n.required_quantity) || 0), 0);
  const totalFulfilled = needs.reduce((sum, n) => sum + (Number(n.fulfilled_quantity) || 0), 0);
  const overallFulfillment = totalRequired > 0 ? (totalFulfilled / totalRequired) * 100 : 0;
  const highPriorityNeeds = needs.filter(n => n.priority === 'High').length;
  const criticalGaps = needs.filter(n => 
    n.priority === 'High' && calculateFulfillmentPercentage(Number(n.required_quantity), Number(n.fulfilled_quantity)) < 40
  ).length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link to="/camps" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              {camp.name}
            </h1>
            <p className="page-subtitle">{camp.district} District</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={openEditModal} icon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteConfirm(true)} icon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Status</p>
              <p className="kpi-value">{getStatusBadge(camp.status)}</p>
            </div>
            <div className="kpi-icon bg-primary-100 text-primary-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Capacity</p>
              <p className="kpi-value">{formatNumber(camp.capacity)}</p>
            </div>
            <div className="kpi-icon bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Current Families</p>
              <p className="kpi-value">{camp.current_families >= camp.capacity ? (
                <span className="text-red-600">{formatNumber(camp.current_families)}</span>
              ) : formatNumber(camp.current_families)}</p>
            </div>
            <div className="kpi-icon bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Overall Fulfillment</p>
              <p className="kpi-value">{formatPercentage(overallFulfillment)}</p>
            </div>
            <div className="kpi-icon bg-amber-100 text-amber-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Camp Needs
            </h2>
            <Link to={`/needs?camp=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {needs.length > 0 ? (
              <Table
                data={needs}
                keyField="id"
                columns={[
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
                  { key: 'priority', header: 'Priority', render: (v) => (
                    <Badge variant={v === 'High' ? 'danger' : v === 'Medium' ? 'warning' : 'info'}>{v}</Badge>
                  )},
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
                emptyMessage="No needs recorded for this camp"
              />
            ) : (
              <EmptyState
                className="py-12"
                icon={<Package className="w-12 h-12 text-slate-300" />}
                title="No Needs Recorded"
                description="Add needs for this camp to track required supplies"
                action={<Link to={`/needs/new?camp=${id}`}><Button>Add Need</Button></Link>}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-600" />
              Assigned Volunteers
            </h2>
            <span className="text-sm text-slate-500">{volunteers.length} volunteers</span>
          </CardHeader>
          <CardBody className="p-0">
            {volunteers.length > 0 ? (
              <Table
                data={volunteers}
                keyField="id"
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'skill', header: 'Skill', render: (v) => <Badge variant="info">{v}</Badge> },
                ]}
                emptyMessage="No volunteers assigned"
              />
            ) : (
              <EmptyState
                className="py-8"
                icon={<Users className="w-10 h-10 text-slate-300" />}
                title="No Volunteers Assigned"
                description="Assign volunteers from the Volunteers page"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" />
              Dispatch History
            </h2>
            <Link to={`/dispatches?camp=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {dispatches.length > 0 ? (
              <Table
                data={dispatches.slice(0, 10)}
                keyField="id"
                columns={[
                  { key: 'id', header: 'ID', render: (v) => <span className="font-mono text-xs">{v.slice(-8)}</span> },
                  { key: 'need_id', header: 'Item', render: (v, row) => {
                    const need = needs.find(n => n.id === v);
                    if (!need) return 'Unknown';
                    const item = inventory.find(i => i.id === need.inventory_item_id);
                    return item ? item.name : 'Unknown';
                  }},
                  { key: 'quantity', header: 'Qty', render: (v) => formatNumber(v) },
                  { key: 'status', header: 'Status', render: (v) => (
                    <Badge variant={v === 'Delivered' ? 'success' : v === 'In Transit' ? 'info' : v === 'Pending' ? 'warning' : 'neutral'}>
                      {v}
                    </Badge>
                  )},
                  { key: 'created_at', header: 'Date', render: (v) => formatDate(v) },
                ]}
                emptyMessage="No dispatches for this camp"
              />
            ) : (
              <EmptyState
                className="py-8"
                icon={<Truck className="w-10 h-10 text-slate-300" />}
                title="No Dispatches"
                description="No dispatch history for this camp yet"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Link to={`/needs/new?camp=${id}`}>
                <Button variant="secondary" className="w-full justify-start" icon={<Plus className="w-4 h-4" />}>
                  Add Camp Need
                </Button>
              </Link>
              <Link to={`/dispatches/new?camp=${id}`}>
                <Button variant="secondary" className="w-full justify-start" icon={<Truck className="w-4 h-4" />}>
                  Create Dispatch
                </Button>
              </Link>
              <Link to={`/volunteers?camp=${id}`}>
                <Button variant="secondary" className="w-full justify-start" icon={<UserPlus className="w-4 h-4" />}>
                  Assign Volunteers
                </Button>
              </Link>
              <Link to={`/donations?camp=${id}`}>
                <Button variant="secondary" className="w-full justify-start" icon={<Heart className="w-4 h-4" />}>
                  Record Donation
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Key Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">High Priority Needs</span>
                  <span className="font-medium">{highPriorityNeeds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Critical Gaps</span>
                  <span className="font-medium text-red-600">{criticalGaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Items Needed</span>
                  <span className="font-medium">{formatNumber(totalRequired)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items Fulfilled</span>
                  <span className="font-medium">{formatNumber(totalFulfilled)}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Camp"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Camp Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
            maxLength={100}
          />
          
          <Select
            label="District"
            value={formData.district}
            onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
            options={DISTRICTS.map(d => ({ value: d, label: d }))}
            error={formErrors.district}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              error={formErrors.capacity}
              required
              min="1"
            />
            
            <Input
              label="Current Families"
              type="number"
              value={formData.current_families}
              onChange={e => setFormData(prev => ({ ...prev, current_families: e.target.value }))}
              error={formErrors.current_families}
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
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete Camp"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete <strong>{camp.name}</strong>? This action cannot be undone.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          This will also remove associated needs and dispatches for this camp.
        </p>
      </Modal>
    </div>
  );
};

export default CampDetails;