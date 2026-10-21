import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DISPATCH_STATUSES, findById } from '../../shared/domain.js';
import { DispatchTable } from '../components/DispatchTable.jsx';
import { DispatchForm } from '../components/forms/DispatchForm.jsx';
import { Modal } from '../components/Modal.jsx';
import { Button, Card, EmptyState, FilterChips, ListFooter, PageHeader, SearchInput, Toolbar } from '../components/ui.jsx';
import { useData } from '../state/DataContext.jsx';

export function Dispatches() {
  const { dispatches, camps, needs, inventory, can } = useData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const status = params.get('status') || 'All';
  // ?camp=&need= (from Critical Gaps) opens the form pre-filled.
  const prefill = params.get('need') ? { camp: params.get('camp'), need: params.get('need') } : null;
  const [creating, setCreating] = useState(false);
  const formOpen = creating || (!!prefill && can('dispatch.create'));

  const closeForm = () => {
    setCreating(false);
    if (prefill) setParams(status === 'All' ? {} : { status }, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dispatches
      .filter((d) => status === 'All' || d.status === status)
      .filter((d) => {
        if (!q) return true;
        const camp = findById(camps, d.camp_id);
        const need = findById(needs, d.need_id);
        const item = need && findById(inventory, need.inventory_item_id);
        return [camp?.name, camp?.district, item?.name, `#${d.id}`].some((s) => s?.toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id);
  }, [dispatches, camps, needs, inventory, status, query]);

  const filtering = query.trim() !== '' || status !== 'All';
  const clearFilters = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  const options = [
    { value: 'All', label: 'All', count: dispatches.length },
    ...DISPATCH_STATUSES.map((s) => ({ value: s, label: s, count: dispatches.filter((d) => d.status === s).length })),
  ];

  return (
    <>
      <PageHeader
        title="Dispatches"
        description="Stock is reserved when a dispatch is created, returned if it is cancelled, and counted as fulfilled when delivered."
        actions={can('dispatch.create') && <Button icon="plus" onClick={() => setCreating(true)}>New dispatch</Button>}
      />
      <Card bodyClassName="p-0">
        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search camp, item or #id" label="Search dispatches" />
          <FilterChips
            label="Filter by status"
            options={options}
            value={status}
            onChange={(v) => setParams(v === 'All' ? {} : { status: v }, { replace: true })}
          />
        </Toolbar>
        {filtered.length ? (
          <DispatchTable dispatches={filtered} />
        ) : (
          <EmptyState
            icon="truck"
            title={dispatches.length ? 'No dispatches match these filters' : 'No dispatches yet'}
            action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          />
        )}
        <ListFooter shown={filtered.length} total={dispatches.length} noun="dispatches" onClear={filtering ? clearFilters : undefined}>
          Pending → In Transit → Delivered, or Cancelled before delivery
        </ListFooter>
      </Card>

      <Modal open={formOpen} title="New dispatch" description="Choose a camp, one of its needs and a quantity. Stock is reserved immediately." onClose={closeForm}>
        {formOpen && <DispatchForm initialCampId={prefill?.camp} initialNeedId={prefill?.need} onDone={closeForm} onCancel={closeForm} />}
      </Modal>
    </>
  );
}
