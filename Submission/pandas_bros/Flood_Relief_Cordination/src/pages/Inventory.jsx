import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Package,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { inventoryApi } from '../api/inventory.api';
import { needsApi } from '../api/needs.api';
import { dispatchesApi } from '../api/dispatches.api';
import { donationsApi } from '../api/donations.api';
import { validateInventoryItem } from '../utils/validation';
import { formatNumber } from '../utils/formatting';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES = ['Food', 'Water', 'Medicine', 'Shelter', 'Hygiene', 'Other'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    stock: '0',
    reorder_level: '0',
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
      const [itemsRes] = await Promise.all([
        inventoryApi.getAll(),
      ]);
      setItems(itemsRes.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const isLowStock = (Number(item.stock) || 0) <= (Number(item.reorder_level) || 0);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesLowStock = !lowStockFilter || isLowStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', unit: '', stock: '0', reorder_level: '0' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: item.stock.toString(),
      reorder_level: item.reorder_level.toString(),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateInventoryItem(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim(),
        stock: Number(formData.stock),
        reorder_level: Number(formData.reorder_level),
      };
      
      if (editingItem) {
        await inventoryApi.update(editingItem.id, payload);
      } else {
        await inventoryApi.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save item:', err);
      setFormErrors({ submit: 'Failed to save item. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const checkReferences = async (itemId) => {
    const [needsRes, dispatchesRes, donationsRes] = await Promise.all([
      needsApi.getByItem(itemId),
      dispatchesApi.getAll(),
      donationsApi.getByItem(itemId),
    ]);
    
    const referencedByDispatches = dispatchesRes.data.some(d => {
      const need = d.need;
      return need && need.inventory_item_id === itemId && ['Pending', 'In Transit'].includes(d.status);
    });
    
    return {
      needsCount: needsRes.data.length,
      activeDispatches: referencedByDispatches,
      donationsCount: donationsRes.data.length,
    };
  };

  const confirmDelete = async (item) => {
    const refs = await checkReferences(item.id);
    if (refs.needsCount > 0 || refs.activeDispatches || refs.donationsCount > 0) {
      alert(`Cannot delete this item. It is referenced by:\n- ${refs.needsCount} camp needs\n- ${refs.activeDispatches ? 'Active dispatches' : 'No active dispatches'}\n- ${refs.donationsCount} in-kind donations`);
      return;
    }
    setDeleteConfirm(item);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await inventoryApi.delete(deleteConfirm.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getStatusBadge = (_, row) => {
    const isLowStock = (Number(row?.stock) || 0) <= (Number(row?.reorder_level) || 0);
    if (isLowStock) {
      return <Badge variant="danger">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            Warehouse Inventory
          </h1>
          <p className="page-subtitle">Manage relief supplies and stock levels</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Total Items</p>
              <p className="kpi-value">{items.length}</p>
            </div>
            <div className="kpi-icon bg-primary-100 text-primary-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Low Stock Items</p>
              <p className="kpi-value text-red-600">
                {items.filter(i => (Number(i.stock) || 0) <= (Number(i.reorder_level) || 0)).length}
              </p>
            </div>
            <div className="kpi-icon bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Categories</p>
              <p className="kpi-value">
                {[...new Set(items.map(i => i.category))].length}
              </p>
            </div>
            <div className="kpi-icon bg-blue-100 text-blue-600">
              <ArrowUp className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-label">Total Units in Stock</p>
              <p className="kpi-value">
                {formatNumber(items.reduce((sum, i) => sum + (Number(i.stock) || 0), 0))}
              </p>
            </div>
            <div className="kpi-icon bg-green-100 text-green-600">
              <ArrowDown className="w-6 h-6" />
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
                placeholder="Search items by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-10"
                aria-label="Search inventory"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
              className="w-44"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={e => setLowStockFilter(e.target.checked)}
                className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700">Low Stock Only</span>
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
          ) : filteredItems.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Package className="w-12 h-12 text-surface-300" />}
              title={search || categoryFilter || lowStockFilter ? 'No items found' : 'No inventory items yet'}
              description={search || categoryFilter || lowStockFilter 
                ? 'Try adjusting your search or filters'
                : 'Add your first inventory item to get started'}
              action={!search && !categoryFilter && !lowStockFilter ? (
                <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                  Add Item
                </Button>
              ) : null}
            />
          ) : (
            <Table
              data={filteredItems}
              keyField="id"
              columns={[
                { key: 'name', header: 'Item Name' },
                { key: 'category', header: 'Category', render: (v) => <Badge variant="info">{v}</Badge> },
                { key: 'unit', header: 'Unit' },
                { key: 'stock', header: 'Current Stock', render: (v, row) => (
                  <span className={(Number(v) || 0) <= (Number(row.reorder_level) || 0) ? 'text-red-600 font-medium' : 'font-medium'}>
                    {formatNumber(v)} {row.unit}
                  </span>
                )},
                { key: 'reorder_level', header: 'Reorder Level', render: (v) => formatNumber(v) },
                { key: 'status', header: 'Status', render: getStatusBadge },
              ]}
              renderRowActions={(row) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                    aria-label="Edit item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(row)}
                    className="p-1.5 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              emptyMessage="No inventory items found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g., Rice Bags (25kg)"
            required
            maxLength={100}
          />
          
          <Select
            label="Category"
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            error={formErrors.category}
            placeholder="Select category"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit"
              value={formData.unit}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              error={formErrors.unit}
              placeholder="e.g., bags, units, packets"
              required
              maxLength={20}
            />
            
            <Input
              label="Reorder Level"
              type="number"
              value={formData.reorder_level}
              onChange={e => setFormData(prev => ({ ...prev, reorder_level: e.target.value }))}
              error={formErrors.reorder_level}
              placeholder="100"
              required
              min="0"
            />
          </div>
          
          <Input
            label="Current Stock"
            type="number"
            value={formData.stock}
            onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
            error={formErrors.stock}
            placeholder="0"
            required
            min="0"
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
        title="Delete Inventory Item"
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

export default Inventory;