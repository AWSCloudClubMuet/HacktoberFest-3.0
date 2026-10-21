import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Heart,
  DollarSign,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { donationsApi } from '../api/donations.api';
import { inventoryApi } from '../api/inventory.api';
import { validateDonation } from '../utils/validation';
import { formatNumber, formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatting';
import { donationsService } from '../services/donations.service';
import { getTotalCashDonations, getDonationsByCategory } from '../utils/calculations';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

const TYPE_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'In-Kind', label: 'In-Kind' },
];

const CATEGORIES = [
  'Emergency Relief',
  'Medical Supplies',
  'Food',
  'Water',
  'Shelter',
  'Hygiene',
  'General Relief',
  'Other',
];

const Donations = () => {
  const [donations, setDonations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Cash',
    amount_or_quantity: '',
    item_id: '',
    category: '',
    donor: '',
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
      const [donationsRes, inventoryRes] = await Promise.all([
        donationsApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setDonations(donationsRes.data);
      setInventory(inventoryRes.data);
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter(donation => {
    const item = inventory.find(i => i.id === donation.item_id);
    const matchesSearch = donation.donor.toLowerCase().includes(search.toLowerCase()) ||
      item?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || donation.type === typeFilter;
    const matchesCategory = !categoryFilter || donation.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const openCreateModal = () => {
    setFormData({ type: 'Cash', amount_or_quantity: '', item_id: '', category: '', donor: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, type, item_id: type === 'In-Kind' ? '' : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDonation(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        amount_or_quantity: Number(formData.amount_or_quantity),
        item_id: formData.type === 'In-Kind' ? formData.item_id : null,
        category: formData.category.trim(),
        donor: formData.donor.trim(),
      };
      
      await donationsService.createDonation(payload);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save donation:', err);
      setFormErrors({ submit: err.message || 'Failed to save donation. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (donation) => {
    setDeleteConfirm(donation);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await donationsApi.delete(deleteConfirm.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete donation:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const totalCash = getTotalCashDonations(donations);
  const donationsByCategory = getDonationsByCategory(donations);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600" />
            Donations
          </h1>
          <p className="page-subtitle">Track cash and in-kind donations</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Record Donation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Total Cash Donations</p>
              <p className="kpi-value">{formatCurrency(totalCash)}</p>
            </div>
            <div className="kpi-icon bg-green-100 text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Total Donations</p>
              <p className="kpi-value">{donations.length}</p>
            </div>
            <div className="kpi-icon bg-blue-100 text-blue-600">
              <Heart className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">In-Kind Items</p>
              <p className="kpi-value">
                {donations.filter(d => d.type === 'In-Kind').reduce((sum, d) => sum + Number(d.amount_or_quantity), 0)}
              </p>
            </div>
            <div className="kpi-icon bg-teal-100 text-teal-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Donations by Category</h2>
          </CardHeader>
          <CardBody>
            {donationsByCategory.length > 0 ? (
              <div className="space-y-3">
                {donationsByCategory.map(cat => (
                  <div key={cat.category} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-900">{cat.category}</span>
                      <Badge variant="info">{formatCurrency(cat.cash)}</Badge>
                    </div>
                    {cat.inKind > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>In-Kind: {formatNumber(cat.inKind)} units</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                className="py-8"
                icon={<Heart className="w-10 h-10 text-slate-300" />}
                title="No donation data"
                description="Record donations to see category breakdown"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Quick Stats</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Donations</span>
                <span className="font-medium">{donations.filter(d => d.type === 'Cash').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In-Kind Donations</span>
                <span className="font-medium">{donations.filter(d => d.type === 'In-Kind').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unique Donors</span>
                <span className="font-medium">
                  {[...new Set(donations.map(d => d.donor))].length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Categories</span>
                <span className="font-medium">{donationsByCategory.length}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search by donor or item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Search donations"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...TYPE_OPTIONS]}
              className="w-36"
            />
            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
              className="w-48"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mx-auto" />
            </div>
          ) : filteredDonations.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Heart className="w-12 h-12 text-slate-300" />}
              title={search || typeFilter || categoryFilter ? 'No donations found' : 'No donations yet'}
              description={search || typeFilter || categoryFilter 
                ? 'Try adjusting your search or filters'
                : 'Record your first donation to get started'}
              action={!search && !typeFilter && !categoryFilter ? (
                <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                  Record Donation
                </Button>
              ) : null}
            />
          ) : (
            <Table
              data={filteredDonations}
              keyField="id"
              columns={[
                { key: 'type', header: 'Type', render: (v) => (
                  <Badge variant={v === 'Cash' ? 'info' : 'success'}>
                    {v === 'Cash' ? <DollarSign className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                    {v}
                  </Badge>
                )},
                { key: 'amount_or_quantity', header: 'Amount / Qty', render: (v, row) => 
                  row.type === 'Cash' ? formatCurrency(v) : formatNumber(v)
                },
                { key: 'donor', header: 'Donor' },
                { key: 'category', header: 'Category', render: (v) => <Badge variant="info">{v}</Badge> },
                { key: 'item_id', header: 'Item', render: (v) => {
                  if (!v) return '-';
                  const item = inventory.find(i => i.id === v);
                  return item ? item.name : 'Unknown';
                }},
                { key: 'created_at', header: 'Date', render: (v) => formatDate(v) },
              ]}
              renderRowActions={(row) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => confirmDelete(row)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete donation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              emptyMessage="No donations found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record New Donation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Record Donation</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            {TYPE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="donationType"
                  value={opt.value}
                  checked={formData.type === opt.value}
                  onChange={e => handleTypeChange(e.target.value)}
                  className="sr-only peer"
                />
                <div className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  formData.type === opt.value 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="text-lg font-medium text-slate-900">{opt.label}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {opt.value === 'Cash' ? 'Monetary contribution' : 'Physical goods'}
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          <Input
            label="Amount / Quantity"
            type="number"
            value={formData.amount_or_quantity}
            onChange={e => setFormData(prev => ({ ...prev, amount_or_quantity: e.target.value }))}
            error={formErrors.amount_or_quantity}
            placeholder={formData.type === 'Cash' ? '50000' : '100'}
            required
            min="1"
            step={formData.type === 'Cash' ? '1' : '1'}
          />
          
          {formData.type === 'In-Kind' && (
            <Select
              label="Inventory Item"
              value={formData.item_id}
              onChange={e => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
              options={inventory.map(i => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
              error={formErrors.item_id}
              placeholder="Select item"
              required
            />
          )}
          
          <Select
            label="Category"
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            error={formErrors.category}
            placeholder="Select category"
            required
          />
          
          <Input
            label="Donor Name"
            value={formData.donor}
            onChange={e => setFormData(prev => ({ ...prev, donor: e.target.value }))}
            error={formErrors.donor}
            placeholder="e.g., Sindh Government, NGO Alliance"
            required
            maxLength={100}
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
        title="Delete Donation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete this donation? This action cannot be undone.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Note: Deleting an in-kind donation will not automatically reduce inventory stock.
        </p>
      </Modal>
    </div>
  );
};

export default Donations;