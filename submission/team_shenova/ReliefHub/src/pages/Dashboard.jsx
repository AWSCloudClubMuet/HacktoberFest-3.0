import React from 'react';
import { 
  Tent, 
  Users, 
  Percent, 
  UserCheck, 
  AlertTriangle, 
  ArrowRight,
  Truck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { 
  calculateDashboardKPIs, 
  calculateCategoryFulfilment, 
  getCriticalGaps 
} from '../utils/calculations';

export default function Dashboard({ 
  camps = [], 
  inventory = [], 
  needs = [], 
  dispatches = [], 
  volunteers = [], 
  onNavigate,
  onSelectNeed 
}) {
  const kpis = calculateDashboardKPIs(camps, inventory, needs, volunteers);
  const categoryChartData = calculateCategoryFulfilment(inventory, needs);
  const criticalGaps = getCriticalGaps(needs, camps, inventory, dispatches);

  // Recent 5 dispatches
  const recentDispatches = [...dispatches].reverse().slice(0, 5);

  const campMap = {};
  camps.forEach(c => { campMap[String(c.id)] = c; });

  const invMap = {};
  inventory.forEach(i => { invMap[String(i.id)] = i; });

  const needMap = {};
  needs.forEach(n => { needMap[String(n.id)] = n; });

  return (
    <div className="page-dashboard">
      {/* KPI Cards Row (Exactly the 5 Required Cards) */}
      <section className="kpi-grid" aria-label="Key Performance Indicators">
        <StatCard
          title="Active Camps"
          value={kpis.activeCampsCount}
          subtitle={`${camps.length} total camps recorded`}
          icon={Tent}
          accent="teal"
          badgeText="Operational"
          onClick={() => onNavigate('camps', { filter: 'Active' })}
        />
        <StatCard
          title="Families Sheltered"
          value={kpis.totalFamiliesSheltered.toLocaleString()}
          subtitle="Sum across all registered camps"
          icon={Users}
          accent="blue"
          badgeText="Civilians"
          onClick={() => onNavigate('camps')}
        />
        <StatCard
          title="Overall Fulfilment"
          value={`${kpis.overallFulfilment}%`}
          subtitle={`${kpis.totalFulfilled.toLocaleString()} / ${kpis.totalRequired.toLocaleString()} units`}
          icon={Percent}
          accent="purple"
          badgeText="Met Demand"
          onClick={() => onNavigate('needs')}
        />
        <StatCard
          title="Low-Stock Items"
          value={kpis.lowStockCount}
          subtitle="Items at or below reorder level"
          icon={AlertTriangle}
          accent={kpis.lowStockCount > 0 ? 'amber' : 'teal'}
          badgeText={kpis.lowStockCount > 0 ? 'Attention' : 'Normal'}
          onClick={() => onNavigate('inventory', { filter: 'low_stock' })}
        />
        <StatCard
          title="Volunteers Deployed"
          value={kpis.deployedVolunteersCount}
          subtitle={`${volunteers.length} total registered personnel`}
          icon={UserCheck}
          accent="teal"
          badgeText="Assigned"
          onClick={() => onNavigate('volunteers', { filter: 'assigned' })}
        />
      </section>

      {/* Middle Section: Fulfilment by Category Chart & Operational Summary */}
      <section className="dashboard-middle-grid">
        {/* Recharts Bar Chart: Fulfilment by Category */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Fulfilment by Category</h2>
              <p className="card-subtitle">Aggregate fulfilled vs required relief commodities by sector</p>
            </div>
            <span className="badge-pill badge-neutral">Calculated Totals</span>
          </div>

          <div className="chart-container" style={{ width: '100%', height: 280 }}>
            {categoryChartData.length === 0 ? (
              <div className="chart-empty-state">
                <p>No category demand data available to display.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name, item) => [
                      `${value}% (${item.payload.fulfilled.toLocaleString()} / ${item.payload.required.toLocaleString()} units)`, 
                      'Fulfilment'
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#ffffff',
                      fontSize: '12px' 
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.percentage < 40 ? '#ef4444' : entry.percentage < 75 ? '#f59e0b' : '#0d9488'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="chart-legend-row">
            <span className="legend-item"><span className="legend-box color-red" /> &lt;40% Critical Shortage</span>
            <span className="legend-item"><span className="legend-box color-amber" /> 40% - 74% Moderate</span>
            <span className="legend-item"><span className="legend-box color-teal" /> &ge;75% Well Supplied</span>
          </div>
        </div>

        {/* Recent Dispatches Feed */}
        <div className="dashboard-card recent-dispatches-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Dispatches</h2>
              <p className="card-subtitle">Latest cargo movements between warehouse and camps</p>
            </div>
            <button 
              type="button" 
              className="btn-link"
              onClick={() => onNavigate('dispatches')}
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="recent-list">
            {recentDispatches.length === 0 ? (
              <p className="empty-subtext">No dispatches logged yet.</p>
            ) : (
              recentDispatches.map(disp => {
                const camp = campMap[String(disp.camp_id)] || {};
                const need = needMap[String(disp.need_id)] || {};
                const item = need.inventory_item_id ? invMap[String(need.inventory_item_id)] : {};
                return (
                  <div key={disp.id} className="recent-dispatch-item">
                    <div className="dispatch-icon-box">
                      <Truck size={16} className="text-teal" />
                    </div>
                    <div className="dispatch-details">
                      <div className="dispatch-main-row">
                        <span className="dispatch-camp-name">{camp.name || 'Camp'}</span>
                        <StatusBadge status={disp.status} />
                      </div>
                      <div className="dispatch-sub-row">
                        <span>{item.name || 'Relief Supplies'}: <strong>{disp.quantity}</strong> {item.unit || 'units'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Critical Gaps Table (High Priority & Fulfilment strictly < 40%) */}
      <section className="dashboard-card critical-gaps-section">
        <div className="card-header">
          <div className="critical-header-title">
            <AlertTriangle size={18} className="text-red" />
            <div>
              <h2 className="card-title">Critical Shortage Gaps</h2>
              <p className="card-subtitle">
                High-priority camp demands currently below 40% fulfilment (sorted by most severe deficit)
              </p>
            </div>
          </div>
          <span className="badge-pill badge-danger">
            {criticalGaps.length} {criticalGaps.length === 1 ? 'Critical Gap' : 'Critical Gaps'}
          </span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="relief-table">
            <thead>
              <tr>
                <th>Camp Name</th>
                <th>District</th>
                <th>Commodity Item</th>
                <th>Required</th>
                <th>Fulfilled</th>
                <th>Fulfilment %</th>
                <th>Remaining Demand</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {criticalGaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-state-cell empty">
                    <p>No outstanding critical gaps. All high-priority demands are at or above 40% fulfilment.</p>
                  </td>
                </tr>
              ) : (
                criticalGaps.map(gap => (
                  <tr key={gap.id} className="critical-gap-row">
                    <td className="font-semibold text-slate-800">{gap.campName}</td>
                    <td>{gap.district}</td>
                    <td>{gap.itemName}</td>
                    <td>{gap.required_quantity} {gap.unit}</td>
                    <td>{gap.fulfilled_quantity} {gap.unit}</td>
                    <td style={{ minWidth: '130px' }}>
                      <ProgressBar 
                        value={gap.fulfilled_quantity} 
                        max={gap.required_quantity} 
                        variant="fulfilment" 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <span className="text-red font-semibold">
                        {gap.remainingDemand} {gap.unit}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => onNavigate('dispatches', { createForNeed: gap.id, campId: gap.camp_id })}
                        title={`Create dispatch for ${gap.itemName} at ${gap.campName}`}
                      >
                        Dispatch Relief
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
