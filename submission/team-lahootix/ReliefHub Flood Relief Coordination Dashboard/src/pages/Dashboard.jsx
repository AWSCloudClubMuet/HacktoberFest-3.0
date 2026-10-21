import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { campsApi, inventoryApi, needsApi, volunteersApi } from '../api/client';
import { PriorityBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { useTheme } from '../context/ThemeContext';
import { SindhCultureSlideshow } from '../components/SindhCultureSlideshow';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  MapPin,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
  Tent,
  Truck,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';

const CATEGORIES = ['Food', 'Water', 'Medicine', 'Shelter', 'Hygiene'];

export function Dashboard() {
  const { isDark } = useTheme();
  const [camps, setCamps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [campsData, invData, needsData, volsData] = await Promise.all([
        campsApi.getAll(),
        inventoryApi.getAll(),
        needsApi.getAll(),
        volunteersApi.getAll()
      ]);
      setCamps(campsData);
      setInventory(invData);
      setNeeds(needsData);
      setVolunteers(volsData);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data. Verify mock API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  // Fast lookups
  const campsMap = useMemo(() => {
    const map = {};
    camps.forEach(c => { map[c.id] = c; });
    return map;
  }, [camps]);

  const itemsMap = useMemo(() => {
    const map = {};
    inventory.forEach(i => { map[i.id] = i; });
    return map;
  }, [inventory]);

  // 1. Top KPI Calculations (FR-5.1)
  const kpis = useMemo(() => {
    // Active camps = camps where status !== 'Closed'
    const activeCampsList = camps.filter(c => c.status !== 'Closed');
    const activeCamps = activeCampsList.length;

    // Sheltered families = sum of current_families across active camps
    const shelteredFamilies = activeCampsList.reduce(
      (sum, c) => sum + (Number(c.current_families) || 0),
      0
    );

    // Overall fulfilment % = total fulfilled ÷ total required across all needs
    const totalRequired = needs.reduce(
      (sum, n) => sum + (Number(n.required_quantity) || 0),
      0
    );
    const totalFulfilled = needs.reduce(
      (sum, n) => sum + (Number(n.fulfilled_quantity) || 0),
      0
    );
    const overallFulfilment =
      totalRequired > 0 ? Math.round((totalFulfilled / totalRequired) * 100) : 0;

    // Low stock items count: stock <= reorder_level
    const lowStockCount = inventory.filter(
      i => Number(i.stock) <= Number(i.reorder_level)
    ).length;

    // Volunteers deployed: camp_id !== null
    const deployedVolunteers = volunteers.filter(v => v.camp_id !== null).length;

    return {
      activeCamps,
      shelteredFamilies,
      overallFulfilment,
      lowStockCount,
      deployedVolunteers,
      totalNeedsCount: needs.length
    };
  }, [camps, inventory, needs, volunteers]);

  // 2. Fulfilment by Category Chart Data (FR-5.2)
  const categoryChartData = useMemo(() => {
    return CATEGORIES.map(category => {
      // Find all items belonging to this category
      const itemIds = new Set(
        inventory.filter(i => i.category === category).map(i => i.id)
      );

      // Find all needs referencing those items
      const catNeeds = needs.filter(n => itemIds.has(n.inventory_item_id));

      const required = catNeeds.reduce(
        (sum, n) => sum + (Number(n.required_quantity) || 0),
        0
      );
      const fulfilled = catNeeds.reduce(
        (sum, n) => sum + (Number(n.fulfilled_quantity) || 0),
        0
      );
      const fulfilmentRate =
        required > 0 ? Math.round((fulfilled / required) * 100) : 0;

      return {
        category,
        fulfilmentRate,
        fulfilled,
        required,
        needsCount: catNeeds.length
      };
    });
  }, [inventory, needs]);

  // 3. Critical Gaps Table (FR-5.3):
  // High-priority needs with fulfilment < 40%, sorted ascending by fulfilment
  const criticalGaps = useMemo(() => {
    return needs
      .filter(n => {
        const ratio =
          Number(n.required_quantity) > 0
            ? Number(n.fulfilled_quantity) / Number(n.required_quantity)
            : 0;
        return n.priority === 'High' && ratio < 0.4;
      })
      .map(n => {
        const ratio =
          Number(n.required_quantity) > 0
            ? Number(n.fulfilled_quantity) / Number(n.required_quantity)
            : 0;
        return {
          ...n,
          ratio,
          percentage: Math.round(ratio * 100)
        };
      })
      .sort((a, b) => a.ratio - b.ratio);
  }, [needs]);

  // Dynamic bar colors based on fulfilment
  function getBarColor(rate) {
    if (rate < 40) return '#dc2626'; // High shortage
    if (rate < 75) return '#f59e0b'; // Moderate
    return '#16a34a'; // Healthy
  }

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: isDark ? 'var(--bg-card-white)' : '#0f172a',
            color: isDark ? 'var(--text-main)' : '#fff',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            border: isDark ? '1px solid var(--border-subtle)' : 'none',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: isDark ? 'var(--accent)' : '#38bdf8' }}>
            {data.category} Aid
          </div>
          <div>
            Fulfilment Rate: <strong>{data.fulfilmentRate}%</strong>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Delivered: {data.fulfilled.toLocaleString()} / {data.required.toLocaleString()} units
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            Across {data.needsCount} camp needs
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header dashboard-header">
        <div>
          <div className="page-eyebrow"><Activity size={14} /> Live response overview</div>
          <h1 className="page-title">Sindh Flood Relief Command Dashboard</h1>
          <p className="page-subtitle">
            A clear operational picture of camps, supplies, people, and urgent relief gaps.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            Refresh metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="banner-alert warning">
          <AlertTriangle size={17} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className="dashboard-hero-grid" aria-label="Sindh response highlights">
        <SindhCultureSlideshow />
        <aside className="response-brief-card">
          <div className="response-brief-topline">
            <span className="live-status"><span className="live-status-dot" /> Operations live</span>
            <span>Province-wide</span>
          </div>
          <div>
            <p className="response-brief-kicker">Today’s response brief</p>
            <h2>Move critical aid where it matters most.</h2>
            <p>Monitor shortages, coordinate field teams, and keep relief moving across Sindh from one command view.</p>
          </div>
          <div className="response-brief-stats">
            <div><strong>{loading ? '—' : criticalGaps.length}</strong><span>Critical gaps</span></div>
            <div><strong>{loading ? '—' : `${kpis.overallFulfilment}%`}</strong><span>Aid fulfilled</span></div>
          </div>
          <Link to="/dispatches" className="brief-action">
            Open dispatch centre <Truck size={16} />
          </Link>
        </aside>
      </section>

      {/* Top KPI Summary Cards (FR-5.1) */}
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">At a glance</p>
          <h2>Response health</h2>
        </div>
        <span className="section-note">Updated from current field records</span>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-card-top"><span className="kpi-title">Active Camps</span><span className="kpi-icon blue"><Tent size={18} /></span></div>
          <span className="kpi-value">{loading ? '...' : kpis.activeCamps}</span>
          <span className="kpi-sub">
            {camps.length - kpis.activeCamps} closed / {camps.length} total
          </span>
        </div>

        <div className="kpi-card green">
          <div className="kpi-card-top"><span className="kpi-title">Sheltered Families</span><span className="kpi-icon green"><UsersRound size={18} /></span></div>
          <span className="kpi-value">
            {loading ? '...' : kpis.shelteredFamilies.toLocaleString()}
          </span>
          <span className="kpi-sub">Across active camps</span>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-card-top"><span className="kpi-title">Overall Fulfilment</span><span className="kpi-icon amber"><Gauge size={18} /></span></div>
          <span className="kpi-value">
            {loading ? '...' : `${kpis.overallFulfilment}%`}
          </span>
          <span className="kpi-sub">Across {kpis.totalNeedsCount} relief needs</span>
        </div>

        <div className="kpi-card red">
          <div className="kpi-card-top"><span className="kpi-title">Low Stock Items</span><span className="kpi-icon red"><PackageSearch size={18} /></span></div>
          <span className="kpi-value">
            {loading ? '...' : kpis.lowStockCount}
          </span>
          <span className="kpi-sub">At or below reorder level</span>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-card-top"><span className="kpi-title">Volunteers Deployed</span><span className="kpi-icon purple"><UserRoundCheck size={18} /></span></div>
          <span className="kpi-value">
            {loading ? '...' : kpis.deployedVolunteers}
          </span>
          <span className="kpi-sub">
            {volunteers.length - kpis.deployedVolunteers} reserve standby
          </span>
        </div>
      </div>

      {/* Category Fulfilment Chart Section (FR-5.2) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <span className="card-title">
              <BarChart3 size={18} /> Aid fulfilment by category
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
              Percentage of required emergency supplies delivered to camps by category (Food, Water, Medicine, Shelter, Hygiene)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, background: '#dc2626', borderRadius: 2 }} />
              &lt; 40% (Critical)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }} />
              40–75% (Moderate)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 10, height: 10, background: '#16a34a', borderRadius: 2 }} />
              &ge; 75% (Healthy)
            </span>
          </div>
        </div>

        <div className="card-body" style={{ minHeight: '320px', paddingTop: '1.5rem' }}>
          {loading ? (
            <div className="state-box">
              <div className="spinner" />
              <p>Analyzing category fulfilment data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--border-subtle)' : '#e2e8f0'} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: isDark ? 'var(--text-main)' : '#475569', fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: isDark ? 'var(--border-strong)' : '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: isDark ? 'var(--text-muted)' : '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: isDark ? 'var(--border-strong)' : '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="fulfilmentRate"
                  radius={[6, 6, 0, 0]}
                  barSize={48}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.fulfilmentRate)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Critical Gaps Table (FR-5.3) */}
      <div className="card">
        <div
          className="card-header"
          style={{
            background: isDark ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2',
            borderBottom: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecdd3'
          }}
        >
          <div>
            <span className="card-title" style={{ color: isDark ? '#f87171' : '#be123c' }}>
              <ShieldAlert size={18} /> Critical relief gaps
            </span>
            <span style={{ fontSize: '0.8rem', color: isDark ? '#fca5a5' : '#9f1239', display: 'block', marginTop: '0.2rem' }}>
              Urgent unmet camp shortages sorted ascending by fulfilment rate (worst deficit first)
            </span>
          </div>
          <span
            style={{
              background: isDark ? 'rgba(220, 38, 38, 0.25)' : '#ffe4e6',
              color: isDark ? '#fca5a5' : '#9f1239',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: isDark ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid #fecdd3'
            }}
          >
            {criticalGaps.length} Critical Deficits
          </span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Scanning relief gaps...</p>
          </div>
        ) : criticalGaps.length === 0 ? (
          <div className="state-box">
            <p style={{ color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Outstanding! No high-priority critical gaps below 40% detected.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Camp Location</th>
                  <th>Urgent Aid Item</th>
                  <th>Priority</th>
                  <th>Fulfilled / Required</th>
                  <th>Fulfilment Rate</th>
                  <th style={{ textAlign: 'right' }}>Direct Action</th>
                </tr>
              </thead>
              <tbody>
                {criticalGaps.map(gap => {
                  const camp = campsMap[gap.camp_id] || {
                    id: gap.camp_id,
                    name: `Camp #${gap.camp_id}`,
                    district: 'Unknown'
                  };
                  const item = itemsMap[gap.inventory_item_id] || {
                    name: `Item #${gap.inventory_item_id}`,
                    unit: 'Units',
                    category: 'General'
                  };

                  return (
                    <tr key={gap.id}>
                      <td>
                        <Link
                          to="/camps"
                          style={{
                            color: isDark ? 'var(--accent)' : '#0284c7',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                          title={`Navigate to ${camp.name}`}
                        >
                          {camp.name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />
                          District: <strong>{camp.district}</strong>
                        </div>
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Category: {item.category}
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={gap.priority} />
                      </td>
                      <td>
                        <strong>{gap.fulfilled_quantity}</strong> / {gap.required_quantity} {item.unit}
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <ProgressBar
                          current={gap.fulfilled_quantity}
                          total={gap.required_quantity}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to="/dispatches"
                          className="btn btn-primary btn-sm"
                          style={{ textDecoration: 'none' }}
                          title={`Initiate dispatch for ${item.name} to ${camp.name}`}
                        >
                          <Truck size={14} /> Dispatch aid
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
