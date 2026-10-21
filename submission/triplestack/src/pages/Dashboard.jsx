import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CRITICAL_THRESHOLD, OPEN_DISPATCH_STATUSES, computeDashboard, findById, isLowStock } from '../../shared/domain.js';
import { recommendAllocations } from '../../shared/advisor.js';
import { DispatchForm } from '../components/forms/DispatchForm.jsx';
import { Icon } from '../components/Icon.jsx';
import { Modal } from '../components/Modal.jsx';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, StatCard, Table, Td, fmt, fmtPct } from '../components/ui.jsx';
import { useData } from '../state/DataContext.jsx';

const BAR = '#2a78d6';
const BAR_HOVER = '#1c5cab';

function timeSince(iso) {
  if (!iso) return '';
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 36e5);
  if (hours < 1) return 'under 1h';
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

// --- Critical Actions Center ----------------------------------------------------

const TILE_TONES = {
  red: { ring: 'border-red-200', icon: 'bg-red-50 text-red-700', count: 'text-red-700' },
  amber: { ring: 'border-amber-200', icon: 'bg-amber-50 text-amber-700', count: 'text-amber-800' },
  brand: { ring: 'border-brand-200', icon: 'bg-brand-50 text-brand-700', count: 'text-brand-800' },
};

function ActionTile({ tone, icon, title, count, summary, items, action, clearText }) {
  const clear = count === 0;
  const t = clear ? { ring: 'border-slate-200', icon: 'bg-teal-50 text-teal-700', count: 'text-slate-900' } : TILE_TONES[tone];
  return (
    <section className={`flex min-w-0 flex-col rounded-xl border bg-white p-4 shadow-xs ${t.ring}`} aria-label={title}>
      <div className="flex items-start gap-3">
        <span className={`rounded-lg p-2 ${t.icon}`}>
          <Icon name={clear ? 'check' : icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{clear ? clearText : summary}</p>
        </div>
        <span className={`text-2xl font-semibold leading-none tabular-nums ${t.count}`}>{count}</span>
      </div>
      {!clear && items.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {items.map((it) => (
            <li key={it.key}>
              <Link to={it.to} className="group flex items-baseline justify-between gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50">
                <span className="truncate font-medium text-slate-800 group-hover:text-brand-700 group-hover:underline">{it.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">{it.meta}</span>
              </Link>
              {it.sub && <p className="truncate px-1 text-xs text-slate-500">{it.sub}</p>}
            </li>
          ))}
        </ul>
      )}
      {action && !clear && (
        <Link to={action.to} className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-brand-700 hover:underline">
          {action.label} <Icon name="arrowRight" className="h-3 w-3" />
        </Link>
      )}
    </section>
  );
}

function ActionCenter({ metrics }) {
  const { camps, inventory, needs, dispatches } = useData();
  const lowStock = inventory.filter(isLowStock).sort((a, b) => a.stock / (a.reorder_level || 1) - b.stock / (b.reorder_level || 1));
  const open = dispatches
    .filter((d) => OPEN_DISPATCH_STATUSES.includes(d.status))
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  const pending = open.filter((d) => d.status === 'Pending').length;
  const fullCamps = camps.filter((c) => c.status === 'Full');

  const describeDispatch = (d) => {
    const need = findById(needs, d.need_id);
    const item = need && findById(inventory, need.inventory_item_id);
    const camp = findById(camps, d.camp_id);
    return { item, camp };
  };

  return (
    <Card title="Needs attention" description="Live from current API data. Each line opens the record it refers to." className="mt-6" bodyClassName="p-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActionTile
          tone="red"
          icon="alert"
          title="Critical gaps"
          count={metrics.criticalGaps.length}
          summary={`High-priority needs below ${CRITICAL_THRESHOLD}% fulfilment`}
          clearText={`Every High-priority need is at least ${CRITICAL_THRESHOLD}% fulfilled`}
          items={metrics.criticalGaps.slice(0, 3).map((g) => ({
            key: g.need.id,
            label: g.item?.name ?? 'Item',
            meta: fmtPct(Math.round(g.pct)),
            sub: g.camp?.name,
            to: g.camp ? `/camps/${g.camp.id}` : '/needs?critical=1',
          }))}
          action={{ label: `Review all ${metrics.criticalGaps.length} gaps`, to: '/needs?critical=1' }}
        />
        <ActionTile
          tone="amber"
          icon="box"
          title="Low stock"
          count={lowStock.length}
          summary="At or below reorder level"
          clearText="All items are above their reorder level"
          items={lowStock.slice(0, 3).map((i) => ({
            key: i.id,
            label: i.name,
            meta: `${fmt(i.stock)} / ${fmt(i.reorder_level)} ${i.unit}`,
            to: '/inventory?low=1',
          }))}
          action={{ label: 'Open inventory', to: '/inventory?low=1' }}
        />
        <ActionTile
          tone="brand"
          icon="truck"
          title="Awaiting delivery"
          count={open.length}
          summary={`${pending} pending · ${open.length - pending} in transit, oldest first`}
          clearText="No dispatches are pending or in transit"
          items={open.slice(0, 3).map((d) => {
            const { item, camp } = describeDispatch(d);
            return {
              key: d.id,
              label: `#${d.id} ${item?.name ?? 'Item'}`,
              meta: `${d.status} · ${timeSince(d.created_at)}`,
              sub: camp?.name,
              to: `/dispatches?status=${encodeURIComponent(d.status)}`,
            };
          })}
          action={{ label: 'Track dispatches', to: '/dispatches?status=Pending' }}
        />
        <ActionTile
          tone="amber"
          icon="camp"
          title="Camps at capacity"
          count={fullCamps.length}
          summary="New arrivals need another camp"
          clearText="Every open camp has space"
          items={fullCamps.slice(0, 3).map((c) => ({
            key: c.id,
            label: c.name,
            meta: `${fmt(c.current_families)} / ${fmt(c.capacity)}`,
            sub: c.district,
            to: `/camps/${c.id}`,
          }))}
          action={{ label: 'View full camps', to: '/camps?status=Full' }}
        />
      </div>
    </Card>
  );
}

// --- Fulfilment chart -----------------------------------------------------------

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{row.category}</p>
      <p className="mt-0.5 text-slate-700">
        <span className="font-semibold tabular-nums">{fmtPct(row.pct)}</span> average fulfilment
      </p>
      <p className="text-slate-500">
        {row.needs} need{row.needs === 1 ? '' : 's'}
        {row.critical > 0 ? ` · ${row.critical} critical gap${row.critical === 1 ? '' : 's'}` : ''}
      </p>
      <p className="mt-1 text-slate-400">Click to see these needs</p>
    </div>
  );
}

function CategoryChart({ rows }) {
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState(null);
  const navigate = useNavigate();
  const open = (category) => navigate(`/needs?category=${encodeURIComponent(category)}`);

  return (
    <Card
      title="Fulfilment by item category"
      description="Average fulfilment of the needs in each category"
      className="flex flex-col lg:col-span-3"
      bodyClassName="flex flex-1 flex-col p-5"
      actions={
        <button type="button" onClick={() => setAsTable((v) => !v)} className="rounded text-xs font-medium text-brand-700 hover:underline" aria-pressed={asTable}>
          {asTable ? 'Show chart' : 'Show as table'}
        </button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No needs recorded yet">Add camp needs to see fulfilment by category.</EmptyState>
      ) : asTable ? (
        <Table
          head={[{ label: 'Category' }, { label: 'Needs', className: 'text-right' }, { label: 'Critical gaps', className: 'text-right' }, { label: 'Avg. fulfilment', className: 'text-right' }]}
          caption="Fulfilment by category"
        >
          {rows.map((r) => (
            <tr key={r.category}>
              <Td>
                <Link to={`/needs?category=${encodeURIComponent(r.category)}`} className="font-medium text-brand-700 hover:underline">
                  {r.category}
                </Link>
              </Td>
              <Td className="text-right tabular-nums">{r.needs}</Td>
              <Td className="text-right tabular-nums">{r.critical || '—'}</Td>
              <Td className="text-right tabular-nums">{fmtPct(r.pct)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <>
          {/* Grows with the card so it lines up with the advisor beside it. */}
          <div className="h-64 sm:h-72 lg:h-auto lg:min-h-72 lg:flex-1" role="img" aria-label={`Bar chart of average fulfilment by category. ${rows.map((r) => `${r.category} ${fmtPct(r.pct)}`).join(', ')}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 22, right: 8, bottom: 0, left: -16 }} barCategoryGap="30%" onMouseLeave={() => setHover(null)}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="category" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#475569', fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine y={CRITICAL_THRESHOLD} stroke="#64748b" strokeDasharray="4 4" />
                <Bar
                  dataKey="pct"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                  cursor="pointer"
                  onClick={(entry) => open(entry.category)}
                  onMouseEnter={(_, index) => setHover(index)}
                >
                  {rows.map((r, i) => (
                    <Cell key={r.category} fill={hover === i ? BAR_HOVER : BAR} />
                  ))}
                  <LabelList dataKey="pct" position="top" formatter={(v) => fmtPct(v)} style={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAR }} aria-hidden="true" /> Average fulfilment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-slate-500" aria-hidden="true" /> {CRITICAL_THRESHOLD}% critical threshold: High-priority needs below it are critical gaps
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

// --- Allocation Advisor -----------------------------------------------------------

function AllocationAdvisor() {
  const data = useData();
  const { can } = data;
  const [review, setReview] = useState(null);
  const { recommendations, blocked } = useMemo(
    () => recommendAllocations(data),
    [data.camps, data.inventory, data.needs, data.dispatches],
  );
  const canDispatch = can('dispatch.create');

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Icon name="compass" className="h-4 w-4 text-teal-600" /> Allocation advisor
        </span>
      }
      description="Suggested next dispatches, ranked by urgency. Nothing is sent until a coordinator reviews it."
      className="lg:col-span-2"
      bodyClassName="p-0"
    >
      {recommendations.length === 0 ? (
        <EmptyState icon="check" title="No dispatch suggestions">
          Every open need is fully covered by stock already delivered or on the way, or the items are out of stock.
        </EmptyState>
      ) : (
        <ol className="divide-y divide-slate-100">
          {recommendations.map((r, idx) => (
            <li key={r.need.id} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {fmt(r.quantity)} {r.item.unit} · {r.item.name}
                  </p>
                  <p className="truncate text-xs text-slate-600">
                    to{' '}
                    <Link to={`/camps/${r.camp.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.camp.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    <span className="sr-only">Why: </span>
                    {r.reasons.join(' · ')}
                  </p>
                </div>
                {canDispatch && (
                  <Button size="sm" variant="subtle" onClick={() => setReview(r)} aria-label={`Review dispatch of ${r.quantity} ${r.item.unit} ${r.item.name} to ${r.camp.name}`}>
                    Review
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {blocked.length > 0 && (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-amber-800">
          <Icon name="alert" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
          {blocked.length} urgent need{blocked.length === 1 ? '' : 's'} can't be served from stock ({blocked.map((b) => b.item.name).join(', ')}).{' '}
          <Link to="/inventory?low=1" className="font-semibold underline">
            Check inventory
          </Link>
        </p>
      )}
      <details className="border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">How suggestions are ranked</summary>
        <p className="mt-2">
          Urgency = priority weight (High 3, Medium 2, Low 1) × the share of the need not yet delivered or on the way. Stock is then allocated in
          that order, so no suggestion exceeds the warehouse stock left after higher-ranked suggestions or the need's remaining unreserved
          quantity. Closed camps are skipped. Suggestions use only the data in ReliefHub.
        </p>
        {!canDispatch && <p className="mt-2 font-medium">A Relief Coordinator must review and approve each dispatch.</p>}
      </details>

      <Modal open={!!review} title="Review suggested dispatch" description="Adjust the quantity if needed. Stock is reserved only when you create it." onClose={() => setReview(null)}>
        {review && (
          <DispatchForm
            initialCampId={review.camp.id}
            initialNeedId={review.need.id}
            initialQuantity={review.quantity}
            onDone={() => setReview(null)}
            onCancel={() => setReview(null)}
          />
        )}
      </Modal>
    </Card>
  );
}

// --- Page -------------------------------------------------------------------------

export function Dashboard() {
  const { camps, inventory, needs, volunteers, can } = useData();
  const m = useMemo(() => computeDashboard({ camps, inventory, needs, volunteers }), [camps, inventory, needs, volunteers]);
  const openCamps = camps.filter((c) => c.status !== 'Closed');
  const openCapacity = openCamps.reduce((s, c) => s + Number(c.capacity), 0);
  const full = camps.filter((c) => c.status === 'Full').length;
  const closed = camps.filter((c) => c.status === 'Closed').length;
  const occupancy = openCapacity ? (m.familiesSheltered / openCapacity) * 100 : 0;

  // Critical gaps per category, for the chart tooltip and table view.
  const chartRows = m.byCategory.map((row) => ({ ...row, critical: m.criticalGaps.filter((g) => g.item?.category === row.category).length }));

  return (
    <>
      <PageHeader title="Operations overview" description="Flood relief across Sindh. Every figure is calculated live from the ReliefHub API." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard label="Active camps" value={fmt(m.activeCamps)} sub={`${full} at capacity · ${closed} closed`} icon="camp" to="/camps" />
        <StatCard
          label="Families sheltered"
          value={fmt(m.familiesSheltered)}
          meter={occupancy}
          sub={`${Math.round(occupancy)}% of ${fmt(openCapacity)} capacity`}
          icon="users"
        />
        <StatCard
          label="Overall fulfilment"
          value={fmtPct(m.overallFulfilment)}
          meter={m.overallFulfilment}
          sub={`average across ${needs.length} needs`}
          icon="needs"
          tone={m.overallFulfilment < CRITICAL_THRESHOLD ? 'red' : 'brand'}
          to="/needs"
        />
        <StatCard
          label="Low-stock items"
          value={fmt(m.lowStockCount)}
          sub="at or below reorder level"
          icon="box"
          tone={m.lowStockCount ? 'amber' : 'green'}
          to="/inventory?low=1"
        />
        <StatCard
          label="Volunteers deployed"
          value={fmt(m.volunteersDeployed)}
          meter={volunteers.length ? (m.volunteersDeployed / volunteers.length) * 100 : 0}
          sub={`of ${volunteers.length} registered`}
          icon="users"
          tone="green"
          to="/volunteers"
        />
      </div>

      <ActionCenter metrics={m} />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <CategoryChart rows={chartRows} />
        <AllocationAdvisor />
      </div>

      <Card
        id="critical-gaps"
        className="mt-6 scroll-mt-20"
        title={
          <span className="flex items-center gap-2">
            Critical gaps
            {m.criticalGaps.length > 0 && (
              <Badge tone="red" icon="alert">
                {m.criticalGaps.length}
              </Badge>
            )}
          </span>
        }
        description={`High-priority needs below ${CRITICAL_THRESHOLD}% fulfilment, worst first`}
        bodyClassName="p-0"
      >
        {m.criticalGaps.length === 0 ? (
          <EmptyState icon="check" title="No critical gaps">
            Every High-priority need is at least {CRITICAL_THRESHOLD}% fulfilled.
          </EmptyState>
        ) : (
          <Table
            caption="Critical gaps"
            head={[
              { label: 'Rank' },
              { label: 'Camp', className: 'min-w-48' },
              { label: 'Item', className: 'min-w-40' },
              { label: 'Fulfilment', className: 'min-w-44' },
              { label: 'Unmet', className: 'text-right' },
              { label: 'Actions', sr: true },
            ]}
          >
            {m.criticalGaps.map((g, idx) => (
              <tr key={g.need.id} className="hover:bg-slate-50">
                <Td className="font-semibold tabular-nums text-red-700">{idx + 1}</Td>
                <Td>
                  {g.camp ? (
                    <Link to={`/camps/${g.camp.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                      {g.camp.name}
                    </Link>
                  ) : (
                    'Deleted camp'
                  )}
                  <p className="text-xs text-slate-500">{g.camp?.district}</p>
                </Td>
                <Td>
                  <p className="font-medium">{g.item?.name}</p>
                  <p className="text-xs text-slate-500">{g.item?.category}</p>
                </Td>
                <Td>
                  <ProgressBar value={g.pct} critical label={`${g.item?.name} fulfilment`} />
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums">
                  {fmt(g.gap)} <span className="text-xs text-slate-500">{g.item?.unit}</span>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="flex justify-end gap-3 text-sm">
                    <Link to={`/camps/${g.need.camp_id}`} className="font-medium text-brand-700 hover:underline">
                      View camp
                    </Link>
                    {can('dispatch.create') && g.camp?.status !== 'Closed' && (
                      <Link to={`/dispatches?camp=${g.need.camp_id}&need=${g.need.id}`} className="font-medium text-brand-700 hover:underline">
                        Dispatch
                      </Link>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
