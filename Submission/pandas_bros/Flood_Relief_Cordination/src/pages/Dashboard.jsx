import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Calendar,
  CheckCircle,
  Package,
  Truck,
  Users,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  campsApi 
} from '../api/camps.api';
import { 
  inventoryApi 
} from '../api/inventory.api';
import { 
  needsApi 
} from '../api/needs.api';
import { 
  dispatchesApi
} from '../api/dispatches.api';
import { 
  volunteersApi 
} from '../api/volunteers.api';
import {
  getActiveCampsCount,
  getTotalFamiliesSheltered,
  calculateOverallFulfillment,
  getLowStockItemsCount,
  getDeployedVolunteersCount,
  getCriticalGaps,
  getLowStockItems,
} from '../utils/calculations';
import { formatNumber, formatPercentage, formatDate } from '../utils/formatting';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import Table from '../components/ui/Table';

const KPICard = ({ icon: Icon, label, value, subtitle, iconBg, className = '' }) => (
  <Card className={`kpi-card ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value">{value}</p>
        {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      </div>
      <div className={`kpi-icon ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState({
    camps: [],
    inventory: [],
    needs: [],
    dispatches: [],
    volunteers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [campsRes, inventoryRes, needsRes, dispatchesRes, volunteersRes] = await Promise.all([
          campsApi.getAll(),
          inventoryApi.getAll(),
          needsApi.getAll(),
          dispatchesApi.getAll(),
          volunteersApi.getAll(),
        ]);
        
        setData({
          camps: campsRes.data,
          inventory: inventoryRes.data,
          needs: needsRes.data,
          dispatches: dispatchesRes.data,
          volunteers: volunteersRes.data,
        });
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please ensure the API server is running.');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
      setCurrentDate(new Date().toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const { camps, inventory, needs, dispatches, volunteers } = data;

  const activeCamps = getActiveCampsCount(camps);
  const totalFamilies = getTotalFamiliesSheltered(camps);
  const overallFulfillment = calculateOverallFulfillment(needs);
  const lowStockCount = getLowStockItemsCount(inventory);
  const deployedVolunteers = getDeployedVolunteersCount(volunteers, camps);
  const criticalGaps = getCriticalGaps(needs, inventory, camps);
  const lowStockItems = getLowStockItems(inventory);
  const recentDispatches = [...dispatches]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const getStatusBadge = (status) => {
    const variants = {
      Pending: 'warning',
      'In Transit': 'info',
      Delivered: 'success',
      Cancelled: 'neutral',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="kpi-card animate-pulse">
              <div className="h-4 bg-surface-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-surface-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse"><CardBody className="h-72" /></Card>
          <Card className="animate-pulse"><CardBody className="h-72" /></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-surface-900 mb-2">Unable to Load Dashboard</h2>
        <p className="text-surface-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of flood relief operations in Sindh</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Calendar className="w-4 h-4" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={Building2}
          label="Active Camps"
          value={formatNumber(activeCamps)}
          subtitle={`${camps.filter(c => c.status === 'Active').length} active, ${camps.filter(c => c.status === 'Full').length} full`}
          iconBg="bg-primary-100 text-primary-600"
        />
        <KPICard
          icon={Users}
          label="Families Sheltered"
          value={formatNumber(totalFamilies)}
          subtitle="Across all camps"
          iconBg="bg-primary-100 text-primary-600"
        />
        <KPICard
          icon={Package}
          label="Overall Fulfilment"
          value={formatPercentage(overallFulfillment)}
          subtitle="Total fulfilled / required"
          iconBg="bg-green-100 text-green-600"
        />
        <KPICard
          icon={AlertCircle}
          label="Low-Stock Items"
          value={formatNumber(lowStockCount)}
          subtitle={lowStockCount > 0 ? 'Needs restocking' : 'All items stocked'}
          iconBg={lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}
        />
        <KPICard
          icon={Users}
          label="Volunteers Deployed"
          value={formatNumber(deployedVolunteers)}
          subtitle="Assigned to active camps"
          iconBg="bg-primary-100 text-primary-600"
        />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Critical Gaps
              {criticalGaps.length > 0 && (
                <Badge variant="danger" className="ml-2">{criticalGaps.length}</Badge>
              )}
            </h2>
            <Link to="/needs?priority=High&gap=true" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All Needs
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {criticalGaps.length > 0 ? (
              <Table
                data={criticalGaps.slice(0, 10)}
                keyField="id"
                columns={[
                  { key: 'campName', header: 'Camp', render: (v, row) => (
                    <Link to={`/camps/${row.camp_id}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {v}
                    </Link>
                  )},
                  { key: 'campDistrict', header: 'District' },
                  { key: 'itemName', header: 'Needed Item' },
                  { key: 'percentage', header: 'Fulfilment', render: (v) => (
                    <div className="flex items-center gap-2 w-48">
                      <ProgressBar value={v} max={100} showLabel={false} size="sm" variant={v < 20 ? 'danger' : 'warning'} className="flex-1" />
                      <span className="text-xs font-medium text-red-600">{formatPercentage(v, 0)}</span>
                    </div>
                  )},
                  { key: 'shortage', header: 'Shortage', render: (v) => (
                    <span className="text-red-600 font-medium">{formatNumber(v)}</span>
                  )},
                  { key: 'action', header: 'Action', render: (v, row) => (
                    <Link to={`/camps/${row.camp_id}`} className="btn btn-sm btn-primary">
                      View Camp
                    </Link>
                  )},
                ]}
                emptyMessage="No critical gaps found"
              />
            ) : (
              <EmptyState
                className="py-12"
                icon={<CheckCircle className="w-12 h-12 text-green-500" />}
                title="No Critical Gaps"
                description="All high-priority needs have at least 40% fulfilment"
              />
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Low Stock Alerts
              </h2>
              <Link to="/inventory?lowStock=true" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View Inventory
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {lowStockItems.length > 0 ? (
                <Table
                  data={lowStockItems.slice(0, 8)}
                  keyField="id"
                  columns={[
                    { key: 'name', header: 'Item' },
                    { key: 'stock', header: 'Current Stock', render: (v, row) => (
                      <span className="font-medium text-red-600">{formatNumber(v)} {row.unit}</span>
                    )},
                    { key: 'reorder_level', header: 'Reorder Level', render: (v) => formatNumber(v) },
                    { key: 'severity', header: 'Status', render: (v, row) => {
                      const stock = Number(row.stock) || 0;
                      const reorder = Number(row.reorder_level) || 0;
                      const ratio = reorder > 0 ? stock / reorder : 1;
                      if (ratio <= 0.5) {
                        return <Badge variant="critical">Critical</Badge>;
                      } else if (ratio <= 1) {
                        return <Badge variant="low">Low</Badge>;
                      }
                      return <Badge variant="info">At Reorder</Badge>;
                    }},
                  ]}
                  emptyMessage="All items adequately stocked"
                />
              ) : (
                <EmptyState
                  className="py-12"
                  icon={<Package className="w-12 h-12 text-green-500" />}
                  title="All Items Stocked"
                  description="No items are currently below their reorder levels"
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-600" />
                Recent Dispatches
              </h2>
              <Link to="/dispatches" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View Dispatches
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {recentDispatches.length > 0 ? (
                <Table
                  data={recentDispatches}
                  keyField="id"
                  columns={[
                    { key: 'camp_id', header: 'Camp', render: (v) => {
                      const camp = camps.find(c => c.id === v);
                      return camp ? (
                        <Link to={`/camps/${v}`} className="text-primary-600 hover:text-primary-700">{camp.name}</Link>
                      ) : 'Unknown';
                    }},
                    { key: 'need_id', header: 'Item', render: (v, row) => {
                      const need = needs.find(n => n.id === v);
                      if (!need) return 'Unknown';
                      const item = inventory.find(i => i.id === need.inventory_item_id);
                      return item ? item.name : 'Unknown';
                    }},
                    { key: 'quantity', header: 'Quantity', render: (v) => formatNumber(v) },
                    { key: 'status', header: 'Status', render: (v) => getStatusBadge(v) },
                    { key: 'created_at', header: 'Date', render: (v) => formatDate(v) },
                  ]}
                  emptyMessage="No recent dispatches"
                />
              ) : (
                <EmptyState
                  className="py-12"
                  icon={<Truck className="w-12 h-12 text-surface-300" />}
                  title="No Dispatches Yet"
                  description="Create your first dispatch from the Dispatches page"
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;