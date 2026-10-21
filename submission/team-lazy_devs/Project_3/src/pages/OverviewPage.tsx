import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  DashboardSummary,
  CategoryFulfilment,
  CriticalGap,
  Camp,
  CampNeed,
  InventoryItem,
  Dispatch,
  SmartRecommendation,
} from '../types/index.ts';
import { KpiCard } from '../components/ui/KpiCard.tsx';
import { DispatchModal } from '../components/modals/DispatchModal.tsx';
import { SituationReportModal } from '../components/modals/SituationReportModal.tsx';
import { TableSkeleton } from '../components/ui/Skeleton.tsx';
import {
  Tent,
  Users,
  Percent,
  AlertTriangle,
  UserCheck,
  Truck,
  ArrowRight,
  TrendingUp,
  Package,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Layers,
  HeartHandshake,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const { refreshKey, triggerRefresh, setActiveTab, setPreselectedCampFilter } = useApp();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryFulfilment[]>([]);
  const [criticalGaps, setCriticalGaps] = useState<CriticalGap[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [needs, setNeeds] = useState<CampNeed[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentDispatches, setRecentDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Dispatch Modal & Situation Report Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeDispatchNeedId, setActiveDispatchNeedId] = useState<string | null>(null);
  const [gapDistrictFilter, setGapDistrictFilter] = useState('all');
  const [recFilter, setRecFilter] = useState<'all' | 'high_priority' | 'in_stock'>('all');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sumRes, catRes, gapsRes, campsRes, needsRes, invRes, dispRes, recsRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getCategoryFulfilment(),
          api.getCriticalGaps(),
          api.getCamps(),
          api.getNeeds(),
          api.getInventory(),
          api.getDispatches(),
          api.getSmartRecommendations(),
        ]);

        if (mounted) {
          setSummary(sumRes);
          setCategories(catRes);
          setCriticalGaps(gapsRes);
          setCamps(campsRes);
          setNeeds(needsRes);
          setInventory(invRes);
          setRecentDispatches(dispRes.slice(0, 5));
          setRecommendations(recsRes);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleOpenDispatchForNeed = (needId: string) => {
    setActiveDispatchNeedId(needId);
    setIsDispatchModalOpen(true);
  };

  const getBarColor = (pct: number) => {
    if (pct < 40) return '#dc2626'; // Accessible Critical Red
    if (pct < 70) return '#D6A85F'; // Muted Antique Gold (Palette D)
    return '#16a34a'; // Accessible Emerald Green
  };

  const gapDistricts = React.useMemo(() => {
    const list = Array.from(new Set(criticalGaps.map((g) => g.district))).sort();
    return ['all', ...list];
  }, [criticalGaps]);

  const filteredCriticalGaps = React.useMemo(() => {
    if (gapDistrictFilter === 'all') return criticalGaps;
    return criticalGaps.filter((g) => g.district === gapDistrictFilter);
  }, [criticalGaps, gapDistrictFilter]);

  const filteredRecommendations = React.useMemo(() => {
    if (recFilter === 'high_priority') {
      return recommendations.filter((r) => r.priority === 'High');
    }
    if (recFilter === 'in_stock') {
      return recommendations.filter((r) => r.stock_status !== 'Insufficient stock');
    }
    return recommendations;
  }, [recommendations, recFilter]);

  const totalCampCapacity = React.useMemo(() => {
    return camps.reduce((sum, c) => sum + (c.capacity || 0), 0);
  }, [camps]);

  const totalShelteredFamilies = React.useMemo(() => {
    return camps.reduce((sum, c) => sum + (c.current_families || 0), 0);
  }, [camps]);

  const overallOccupancyPct = totalCampCapacity > 0
    ? Math.round((totalShelteredFamilies / totalCampCapacity) * 100)
    : 0;

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Executive Command Welcome Area with Cinematic Charcoal Overlay & Photography */}
      <div className="relative overflow-hidden rounded-xl border border-[#29384B] shadow-sm bg-[#172232]">
        {/* Cinematic Photography with strong dark charcoal overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=1600&auto=format&fit=crop')`,
          }}
        />
        {/* Deep Charcoal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#172232]/95 via-[#202B3C]/92 to-[#172232]/96" />
        {/* Subtle Topographic texture */}
        <div className="absolute inset-0 bg-topo-pattern opacity-[0.10] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-6 text-white space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D6A85F] animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Relief Operations Command
                </h1>
                <span className="text-[11px] font-semibold text-[#E8C98E] bg-[#D6A85F]/20 border border-[#D6A85F]/40 px-2 py-0.5 rounded-md hidden sm:inline font-mono">
                  Live Provincial Feed · Sindh Basin
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Coordinated flood emergency telemetry across all verified relief camps in Sindh.
                Monitoring real-time displaced family rosters, inventory reserves, active convoys, and critical shortages.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <span className="text-[11px] font-mono text-[#E8C98E] bg-[#202B3C]/90 border border-[#29384B] px-2.5 py-1.5 rounded-lg hidden lg:inline">
                {todayFormatted}
              </span>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#202B3C] hover:bg-[#29384B] border border-[#344354] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                title="Generate unified provincial humanitarian situation report"
              >
                <FileText className="w-4 h-4 text-[#D6A85F]" />
                <span>Situation Report</span>
              </button>
              <button
                onClick={() => {
                  setActiveDispatchNeedId(null);
                  setIsDispatchModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#172232] bg-[#D6A85F] hover:bg-[#c9994f] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs font-bold"
              >
                <Truck className="w-4 h-4" />
                <span>Create Dispatch</span>
              </button>
              <button
                onClick={triggerRefresh}
                className="p-2 text-slate-300 hover:text-white bg-[#202B3C] hover:bg-[#29384B] border border-[#344354] rounded-lg transition-colors"
                title="Refresh live metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Operational Response Status Directive & Provincial Load Sub-bar */}
          <div className="pt-4 border-t border-[#29384B]/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D6A85F]/15 text-[#D6A85F] border border-[#D6A85F]/30 shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-100">Sindh Emergency Directive</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                    Stage 2 Inundation
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">· Joint PDMA / ReliefHub Operations</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Active humanitarian aid corridors: <strong className="text-[#E8C98E]">Dadu</strong>, <strong className="text-[#E8C98E]">Badin</strong>, <strong className="text-[#E8C98E]">Sukkur</strong>, <strong className="text-[#E8C98E]">Larkana</strong>, <strong className="text-[#E8C98E]">Jamshoro</strong>, <strong className="text-[#E8C98E]">Mirpur Khas</strong>.
                </p>
              </div>
            </div>

            {/* Provincial Shelter Occupancy Bar */}
            <div className="w-full lg:w-72 bg-[#202B3C]/80 p-3 rounded-lg border border-[#344354] shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5 text-[11px]">
                  <Tent className="w-3.5 h-3.5 text-[#D6A85F]" />
                  <span>Provincial Shelter Load</span>
                </span>
                <span className="font-mono font-bold text-[#E8C98E] tabular-nums text-xs">
                  {overallOccupancyPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#172232] rounded-full overflow-hidden border border-[#29384B]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallOccupancyPct >= 100
                      ? 'bg-rose-500'
                      : overallOccupancyPct > 80
                      ? 'bg-amber-400'
                      : 'bg-[#D6A85F]'
                  }`}
                  style={{ width: `${Math.min(100, overallOccupancyPct)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{totalShelteredFamilies.toLocaleString()} Sheltered</span>
                <span>{totalCampCapacity.toLocaleString()} Capacity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Primary Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Active Relief Camps"
          value={isLoading ? '—' : summary?.active_camps ?? 0}
          subtitle={`Out of ${summary?.total_camps ?? 0} total registered`}
          icon={<Tent className="w-4 h-4" />}
          accentColor="gold"
          badgeText="Sindh"
          isLoading={isLoading}
          onClick={() => setActiveTab('camps')}
        />

        <KpiCard
          title="Families Sheltered"
          value={isLoading ? '—' : (summary?.families_sheltered ?? 0).toLocaleString()}
          subtitle="Displaced evacuees"
          icon={<Users className="w-4 h-4" />}
          accentColor="charcoal"
          badgeText="Active"
          isLoading={isLoading}
          onClick={() => setActiveTab('camps')}
        />

        <KpiCard
          title="Overall Fulfilment"
          value={isLoading ? '—' : `${summary?.overall_fulfilment ?? 0}%`}
          subtitle="Delivered / required demand"
          icon={<Percent className="w-4 h-4" />}
          accentColor={
            (summary?.overall_fulfilment ?? 0) < 50
              ? 'rose'
              : (summary?.overall_fulfilment ?? 0) < 75
              ? 'amber'
              : 'emerald'
          }
          badgeText="Weighted"
          isLoading={isLoading}
          onClick={() => setActiveTab('needs')}
        />

        <KpiCard
          title="Low-Stock Supplies"
          value={isLoading ? '—' : summary?.low_stock_items ?? 0}
          subtitle="At or below reorder level"
          icon={<AlertTriangle className="w-4 h-4" />}
          accentColor="amber"
          badgeText="Depot Alert"
          isLoading={isLoading}
          onClick={() => setActiveTab('inventory')}
        />

        <KpiCard
          title="Volunteers Deployed"
          value={isLoading ? '—' : summary?.volunteers_deployed ?? 0}
          subtitle={`Of ${summary?.total_volunteers ?? 0} total personnel`}
          icon={<UserCheck className="w-4 h-4" />}
          accentColor="gold"
          badgeText="Frontline"
          isLoading={isLoading}
          onClick={() => setActiveTab('volunteers')}
        />
      </div>

      {/* FEATURE 1: SMART PRIORITY RECOMMENDATIONS (DECISION SUPPORT) */}
      <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E1D9] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FFFFFF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#D6A85F]/15 text-[#a87a2a] border border-[#D6A85F]/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-[#263242] tracking-tight">
                Smart Priority Recommendations
              </h2>
              <span className="text-[10px] font-semibold text-[#263242] bg-[#F0ECE3] border border-[#E5E1D9] px-2 py-0.5 rounded-full font-mono">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-[#697586] mt-0.5">
              Transparent rule-based urgency scoring evaluating priority, fulfilment deficits, sheltered families, and unreserved warehouse inventory.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'high_priority', 'in_stock'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setRecFilter(filterKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  recFilter === filterKey
                    ? 'bg-[#202B3C] text-white font-semibold shadow-xs'
                    : 'bg-[#F0ECE3] text-[#697586] hover:bg-[#E5E1D9] hover:text-[#263242]'
                }`}
              >
                {filterKey === 'all' && `All (${recommendations.length})`}
                {filterKey === 'high_priority' && 'High Priority Only'}
                {filterKey === 'in_stock' && 'In-Stock Only'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#697586]">Loading priority recommendations...</div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#697586]">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-[#263242]">No Pending Shortage Recommendations</p>
            <p className="text-[11px] text-[#697586] mt-0.5">
              All active camp requirements are currently satisfied or fully reserved.
            </p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-[#FFFFFF]">
            {filteredRecommendations.slice(0, 6).map((rec) => {
              const stockBadge = {
                Sufficient: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                Partial: 'bg-amber-50 text-amber-800 border-amber-200',
                'Insufficient stock': 'bg-rose-50 text-rose-800 border-rose-200',
              }[rec.stock_status];

              return (
                <div
                  key={rec.need_id}
                  className="p-4 rounded-xl border border-[#E5E1D9] bg-[#FFFFFF] hover:border-[#D6A85F]/60 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-[#697586] block truncate">
                          {rec.district} Sector
                        </span>
                        <h4 className="text-sm font-bold text-[#263242] truncate">{rec.camp_name}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${
                          rec.priority === 'High'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : rec.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-[#F0ECE3] text-[#263242] border-[#E5E1D9]'
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>

                    {/* Supply item and category */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#263242]">{rec.item_name}</span>
                      <span className="text-[10px] text-[#697586] bg-[#F0ECE3] px-1.5 py-0.5 rounded border border-[#E5E1D9]">
                        {rec.category}
                      </span>
                    </div>

                    {/* Fulfilment Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#697586]">Fulfilment Progress</span>
                        <span className="font-mono font-bold text-[#263242] tabular-nums">
                          {rec.fulfilment_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F0ECE3] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rec.fulfilment_percentage < 40
                              ? 'bg-rose-600'
                              : rec.fulfilment_percentage < 70
                              ? 'bg-[#D6A85F]'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, rec.fulfilment_percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantities & Stock Availability */}
                    <div className="p-2.5 bg-[#F0ECE3]/40 rounded-lg border border-[#E5E1D9] text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#697586]">Unreserved Need:</span>
                        <span className="font-mono font-bold text-[#263242]">
                          {rec.remaining_unreserved_quantity} {rec.item_unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#697586]">Warehouse Stock:</span>
                        <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] border ${stockBadge}`}>
                          {rec.stock_status === 'Insufficient stock'
                            ? 'Insufficient stock (0 avail)'
                            : `${rec.available_stock} ${rec.item_unit} (${rec.stock_status})`}
                        </span>
                      </div>
                    </div>

                    {/* Rule-based Explanation */}
                    <p className="text-[11px] text-[#263242] leading-relaxed bg-[#F0ECE3]/60 p-2.5 rounded-md border border-[#E5E1D9]">
                      {rec.explanation}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E5E1D9] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedCampFilter(rec.camp_id);
                        setActiveTab('needs');
                      }}
                      className="text-xs text-[#697586] hover:text-[#263242] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View Camp</span>
                      <ExternalLink className="w-3 h-3 text-[#697586]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDispatchForNeed(rec.need_id)}
                      disabled={rec.available_stock === 0}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                        rec.available_stock === 0
                          ? 'bg-[#E5E1D9] text-[#697586] cursor-not-allowed'
                          : 'bg-[#202B3C] hover:bg-[#172232] text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{rec.available_stock === 0 ? 'Out of Stock' : 'Dispatch Aid'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main 2-Column Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Chart + Critical Gaps Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Fulfilment Chart Card */}
          <div className="bg-white rounded-xl border border-[#E5E1D9] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D9]">
              <div>
                <h2 className="text-sm font-bold text-[#263242] tracking-tight">
                  Fulfilment Ratio by Supply Sector
                </h2>
                <p className="text-xs text-[#697586]">
                  Aggregate fulfilled versus required supplies across all active Sindh camps.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-rose-700 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  &lt;40% Critical
                </span>
                <span className="flex items-center gap-1.5 text-[#a87a2a] font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#D6A85F]" />
                  40-75% Moderate
                </span>
                <span className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Healthy
                </span>
              </div>
            </div>

            <div className="h-64 mt-4 w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading telemetry...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Fulfilled']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#E5E1D9',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      }}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E1D9] flex items-center justify-between text-xs text-[#697586]">
              <span>Calculated from {needs.length} verified camp demand records</span>
              <button
                onClick={() => setActiveTab('needs')}
                className="text-[#202B3C] hover:text-[#172232] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View all camp needs</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D6A85F]" />
              </button>
            </div>
          </div>

          {/* Critical Gaps Table */}
          <div className="bg-white rounded-xl border border-[#E5E1D9] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E1D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                  <h2 className="text-sm font-bold text-[#263242] tracking-tight">
                    Critical Supply Gaps in Relief Camps
                  </h2>
                </div>
                <p className="text-xs text-[#697586] mt-0.5">
                  High-priority shortages with less than 40% fulfilment. Sorted by urgency with direct aid dispatch.
                </p>
              </div>

              <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md shrink-0">
                {criticalGaps.length} Urgent Shortages Active
              </span>
            </div>

            {/* Quick District Filter Chips */}
            {gapDistricts.length > 2 && (
              <div className="px-5 py-2.5 bg-[#F0ECE3]/50 border-b border-[#E5E1D9] flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-[#697586] mr-1">District:</span>
                {gapDistricts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setGapDistrictFilter(d)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      gapDistrictFilter === d
                        ? 'bg-[#202B3C] text-white shadow-xs font-semibold'
                        : 'bg-white text-[#697586] border border-[#E5E1D9] hover:bg-[#F0ECE3] hover:text-[#263242]'
                    }`}
                  >
                    {d === 'all' ? `All (${criticalGaps.length})` : d}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : filteredCriticalGaps.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#697586]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-[#263242]">No Critical Shortages in Selected Filter</p>
                <p className="text-[11px] text-[#697586] mt-0.5">Try selecting All Districts or refreshing data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0ECE3]/80 text-[#263242] font-semibold border-b border-[#E5E1D9]">
                    <tr>
                      <th className="px-5 py-3">Relief Camp</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">Shortage Item</th>
                      <th className="px-4 py-3 text-right">Required</th>
                      <th className="px-4 py-3 text-right">Remaining Gap</th>
                      <th className="px-5 py-3">Fulfilment Status</th>
                      <th className="px-5 py-3 text-right">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D9] font-medium text-[#263242]">
                    {filteredCriticalGaps.map((gap) => (
                      <tr key={gap.need_id} className="hover:bg-[#F0ECE3]/40 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[#263242]">
                          {gap.camp_name}
                        </td>
                        <td className="px-4 py-3.5 text-[#697586]">
                          {gap.district}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#263242]">{gap.item_name}</span>
                            <span className="text-[10px] text-[#697586]">{gap.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#263242]">
                          {gap.required_quantity} {gap.item_unit}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-rose-700">
                          {gap.remaining_quantity} {gap.item_unit}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-mono font-bold text-rose-700 tabular-nums">
                                {gap.fulfilment_percentage}%
                              </span>
                              <span className="text-[#697586] text-[10px]">&lt;40%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F0ECE3] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-600 rounded-full"
                                style={{ width: `${Math.min(100, gap.fulfilment_percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenDispatchForNeed(gap.need_id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#202B3C] hover:bg-[#172232] rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <Truck className="w-3 h-3 text-[#D6A85F]" />
                            <span>Dispatch Aid</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Warehouse Shortages + Recent Convoy History */}
        <div className="space-y-6">
          {/* Warehouse Low Stock Panel */}
          <div className="bg-white rounded-xl border border-[#E5E1D9] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D9]">
              <h2 className="text-sm font-bold text-[#263242] tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Warehouse Shortage Alerts</span>
              </h2>
              <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {inventory.filter((i) => i.stock <= i.reorder_level).length} Depleted
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {inventory
                .filter((i) => i.stock <= i.reorder_level)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-amber-50/50 border border-amber-200/70 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[#263242] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Stock: <span className="font-mono font-bold tabular-nums">{item.stock}</span> {item.unit} · Reorder: {item.reorder_level}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded shrink-0">
                      Low
                    </span>
                  </div>
                ))}

              {inventory.filter((i) => i.stock <= i.reorder_level).length === 0 && (
                <p className="text-center text-xs text-[#697586] py-4">
                  Warehouse stock levels are currently nominal.
                </p>
              )}
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="mt-4 w-full py-2 text-xs font-semibold text-[#263242] bg-[#F0ECE3] hover:bg-[#E5E1D9] border border-[#E5E1D9] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Manage Warehouse Stock</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D6A85F]" />
            </button>
          </div>

          {/* Recent Dispatches Activity Panel */}
          <div className="bg-white rounded-xl border border-[#E5E1D9] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D9]">
              <h2 className="text-sm font-bold text-[#263242] tracking-tight flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#202B3C]" />
                <span>Recent Convoys & Dispatches</span>
              </h2>
              <span className="text-[11px] font-mono text-[#697586]">
                {recentDispatches.length} recent
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {recentDispatches.map((d) => {
                const statusBadge = {
                  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
                  'In Transit': 'bg-blue-50 text-blue-800 border-blue-200',
                  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  Cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
                }[d.status];

                return (
                  <div
                    key={d.id}
                    className="p-2.5 bg-[#F0ECE3]/40 border border-[#E5E1D9] rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#263242] truncate max-w-[160px]">
                        {d.camp_name}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded border ${statusBadge}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#697586] font-mono">
                      <span>
                        {d.quantity} {d.item_unit || 'units'} · {d.item_name}
                      </span>
                      <span>#{d.id.slice(-6)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('dispatches')}
              className="mt-4 w-full py-2 text-xs font-semibold text-[#263242] bg-[#F0ECE3] hover:bg-[#E5E1D9] border border-[#E5E1D9] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>View Fleet Logistics</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D6A85F]" />
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setActiveDispatchNeedId(null);
        }}
        camps={camps}
        needs={needs}
        inventory={inventory}
        preselectedNeedId={activeDispatchNeedId}
      />

      {/* Feature 5: One-Click Situation Report Modal */}
      <SituationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        summary={summary}
        camps={camps}
        needs={needs}
        inventory={inventory}
        dispatches={recentDispatches}
        recommendations={recommendations}
        criticalGaps={criticalGaps}
      />
    </div>
  );
};
