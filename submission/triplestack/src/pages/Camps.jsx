import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CAMP_STATUSES, OPEN_DISPATCH_STATUSES, isCriticalGap, sameId } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { CampForm, FamiliesForm } from '../components/forms/CampForms.jsx';
import { Modal, useConfirm } from '../components/Modal.jsx';
import { Badge, Button, CampStatusBadge, Card, EmptyState, FilterChips, ListFooter, PageHeader, ProgressBar, SearchInput, Table, Td, Toolbar, fmt } from '../components/ui.jsx';
import { useSort } from '../hooks/useSort.js';
import { useAction, useData } from '../state/DataContext.jsx';

// Delete with a clear statement of what goes with the camp.
export function useDeleteCamp(onDeleted) {
  const { needs, dispatches, volunteers } = useData();
  const { run } = useAction();
  const [dialog, ask] = useConfirm();
  const askDelete = (camp) => {
    const open = dispatches.filter((d) => sameId(d.camp_id, camp.id) && OPEN_DISPATCH_STATUSES.includes(d.status)).length;
    const needCount = needs.filter((n) => sameId(n.camp_id, camp.id)).length;
    const volCount = volunteers.filter((v) => sameId(v.camp_id, camp.id)).length;
    ask({
      title: `Delete ${camp.name}?`,
      message: open ? (
        <p>
          This camp has <strong>{open} open dispatch(es)</strong>. The API will refuse the deletion until they are cancelled or delivered, so
          reserved stock is never lost.
        </p>
      ) : (
        <p>
          This permanently removes the camp, its {needCount} need(s) and their dispatch history, and unassigns {volCount} volunteer(s).
        </p>
      ),
      confirmLabel: 'Delete camp',
      onConfirm: async () => {
        const res = await run(() => api.camps.remove(camp.id), { success: `${camp.name} deleted.` });
        if (res.ok) onDeleted?.();
      },
    });
  };
  return [dialog, askDelete];
}

export function Camps() {
  const { camps, needs, volunteers, can } = useData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const status = params.get('status') || 'All';
  const [editing, setEditing] = useState(null); // null | 'new' | camp
  const [headcount, setHeadcount] = useState(null);
  const [deleteDialog, askDelete] = useDeleteCamp();
  const admin = can('camp.manage');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return camps
      .filter((c) => status === 'All' || c.status === status)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [camps, query, status]);

  const countFor = (list, campId) => list.filter((r) => sameId(r.camp_id, campId)).length;
  const { rows, sort, onSort } = useSort(filtered, {
    name: (c) => c.name,
    district: (c) => c.district,
    occupancy: (c) => Number(c.current_families) / Number(c.capacity),
    status: (c) => c.status,
    needs: (c) => countFor(needs, c.id),
    volunteers: (c) => countFor(volunteers, c.id),
  });
  const filtering = query.trim() !== '' || status !== 'All';
  const clearFilters = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  const statusOptions = [
    { value: 'All', label: 'All', count: camps.length },
    ...CAMP_STATUSES.map((s) => ({ value: s, label: s, count: camps.filter((c) => c.status === s).length })),
  ];

  return (
    <>
      <PageHeader
        title="Camps"
        description="Registry of relief camps, occupancy and operating status."
        actions={admin && <Button icon="plus" onClick={() => setEditing('new')}>New camp</Button>}
      />
      <Card bodyClassName="p-0">
        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or district" label="Search camps" />
          <FilterChips
            label="Filter by status"
            options={statusOptions}
            value={status}
            onChange={(v) => setParams(v === 'All' ? {} : { status: v }, { replace: true })}
          />
        </Toolbar>
        {filtered.length === 0 ? (
          <EmptyState
            icon="camp"
            title={camps.length ? 'No camps match these filters' : 'No camps yet'}
            action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          >
            {camps.length ? 'Try a different search or status.' : admin ? 'Create the first camp to get started.' : 'A Relief Coordinator can add camps.'}
          </EmptyState>
        ) : (
          <Table
            caption="Camps"
            sort={sort}
            onSort={onSort}
            head={[
              { label: 'Camp', className: 'min-w-52', sortKey: 'name' },
              { label: 'District', sortKey: 'district' },
              { label: 'Occupancy', className: 'min-w-52', sortKey: 'occupancy' },
              { label: 'Status', sortKey: 'status' },
              { label: 'Needs', sortKey: 'needs' },
              { label: 'Volunteers', className: 'text-right', sortKey: 'volunteers' },
              { label: 'Actions', sr: true },
            ]}
          >
            {rows.map((c) => {
              const campNeeds = needs.filter((n) => sameId(n.camp_id, c.id));
              const critical = campNeeds.filter(isCriticalGap).length;
              const vols = volunteers.filter((v) => sameId(v.camp_id, c.id)).length;
              const occupancy = (Number(c.current_families) / Number(c.capacity)) * 100;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <Td>
                    <Link to={`/camps/${c.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                  </Td>
                  <Td className="text-slate-600">{c.district}</Td>
                  <Td>
                    <ProgressBar value={occupancy} label={`${c.name} occupancy`} variant="occupancy" />
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {fmt(c.current_families)} / {fmt(c.capacity)} families
                    </p>
                  </Td>
                  <Td>
                    <CampStatusBadge status={c.status} />
                  </Td>
                  <Td>
                    <span className="tabular-nums text-slate-700">{campNeeds.length}</span>
                    {critical > 0 && (
                      <Badge tone="red" icon="alert" className="ml-2">
                        {critical} critical
                      </Badge>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{vols}</Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      {can('camp.updateFamilies') && c.status !== 'Closed' && !admin && (
                        <Button size="sm" variant="secondary" onClick={() => setHeadcount(c)}>
                          Update families
                        </Button>
                      )}
                      {admin && (
                        <>
                          <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} />
                          <Button size="sm" variant="ghost" icon="trash" onClick={() => askDelete(c)} aria-label={`Delete ${c.name}`} className="hover:text-red-600" />
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
        <ListFooter shown={filtered.length} total={camps.length} noun="camps" onClear={filtering ? clearFilters : undefined}>
          Full = families at capacity (set automatically)
        </ListFooter>
      </Card>

      <Modal open={!!editing} title={editing === 'new' ? 'New camp' : `Edit ${editing?.name ?? ''}`} onClose={() => setEditing(null)}>
        {editing && <CampForm camp={editing === 'new' ? null : editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={!!headcount} title={`Update headcount · ${headcount?.name ?? ''}`} onClose={() => setHeadcount(null)} size="sm">
        {headcount && <FamiliesForm camp={headcount} onDone={() => setHeadcount(null)} onCancel={() => setHeadcount(null)} />}
      </Modal>
      {deleteDialog}
    </>
  );
}
