import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ITEM_CATEGORIES, PRIORITIES, findById, isCriticalGap, needFulfilmentPct, reservedForNeed } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { DispatchForm } from '../components/forms/DispatchForm.jsx';
import { NeedForm } from '../components/forms/NeedForm.jsx';
import { Modal, useConfirm } from '../components/Modal.jsx';
import { NeedsTable } from '../components/NeedsTable.jsx';
import { Button, Card, EmptyState, FilterChips, ListFooter, PageHeader, SearchInput, Toolbar, ToolbarCheckbox, ToolbarSelect } from '../components/ui.jsx';
import { useAction, useData } from '../state/DataContext.jsx';

export function useDeleteNeed() {
  const { inventory, dispatches } = useData();
  const { run } = useAction();
  const [dialog, ask] = useConfirm();
  const askDelete = (need) => {
    const item = findById(inventory, need.inventory_item_id);
    const open = reservedForNeed(need.id, dispatches);
    ask({
      title: `Remove need for ${item?.name ?? 'item'}?`,
      message: open ? (
        <p>
          {open} {item?.unit} are reserved by open dispatches for this need. The API will refuse until those dispatches are cancelled or delivered.
        </p>
      ) : (
        <p>The need and its delivered/cancelled dispatch history will be permanently removed.</p>
      ),
      confirmLabel: 'Remove need',
      onConfirm: () => run(() => api.needs.remove(need.id), { success: 'Need removed.' }),
    });
  };
  return [dialog, askDelete];
}

export function Needs() {
  const { needs, camps, inventory, can } = useData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  // Category and "critical only" live in the URL so the dashboard can link here.
  const category = params.get('category') || '';
  const criticalOnly = params.get('critical') === '1';
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const [modal, setModal] = useState(null); // null | 'new' | need
  const [dispatchFor, setDispatchFor] = useState(null);
  const [deleteDialog, askDelete] = useDeleteNeed();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return needs
      .filter((n) => {
        const camp = findById(camps, n.camp_id);
        const item = findById(inventory, n.inventory_item_id);
        if (criticalOnly && !isCriticalGap(n)) return false;
        if (priority !== 'All' && n.priority !== priority) return false;
        if (category && item?.category !== category) return false;
        if (!q) return true;
        return [camp?.name, camp?.district, item?.name].some((s) => s?.toLowerCase().includes(q));
      })
      .sort((a, b) => Number(isCriticalGap(b)) - Number(isCriticalGap(a)) || needFulfilmentPct(a) - needFulfilmentPct(b));
  }, [needs, camps, inventory, query, priority, category, criticalOnly]);

  const criticalCount = needs.filter(isCriticalGap).length;
  const filtering = query.trim() !== '' || priority !== 'All' || !!category || criticalOnly;
  const clearFilters = () => {
    setQuery('');
    setPriority('All');
    setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Camp needs"
        description="What each camp still needs, linked to warehouse items. Fulfilment rises only when dispatches are delivered."
        actions={can('need.manage') && <Button icon="plus" onClick={() => setModal('new')}>Add need</Button>}
      />
      <Card bodyClassName="p-0">
        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search camp, district or item" label="Search needs" />
          <FilterChips label="Filter by priority" options={['All', ...PRIORITIES]} value={priority} onChange={setPriority} />
          <ToolbarSelect label="Filter by category" value={category} onChange={(v) => setParam('category', v)} options={ITEM_CATEGORIES} allLabel="All categories" />
          <ToolbarCheckbox checked={criticalOnly} onChange={(on) => setParam('critical', on ? '1' : '')}>
            Critical gaps only ({criticalCount})
          </ToolbarCheckbox>
        </Toolbar>
        {filtered.length ? (
          <NeedsTable needs={filtered} onDispatch={setDispatchFor} onEdit={setModal} onDelete={askDelete} />
        ) : (
          <EmptyState
            icon="needs"
            title={needs.length ? 'No needs match these filters' : 'No needs recorded'}
            action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          />
        )}
        <ListFooter shown={filtered.length} total={needs.length} noun="needs" onClear={filtering ? clearFilters : undefined}>
          Critical gap = High priority below 40% fulfilled
        </ListFooter>
      </Card>

      <Modal open={!!modal} title={modal === 'new' ? 'Add need' : 'Edit need'} onClose={() => setModal(null)}>
        {modal && <NeedForm need={modal === 'new' ? null : modal} onDone={() => setModal(null)} onCancel={() => setModal(null)} />}
      </Modal>
      <Modal open={!!dispatchFor} title="New dispatch" description="Stock is reserved immediately." onClose={() => setDispatchFor(null)}>
        {dispatchFor && (
          <DispatchForm initialCampId={dispatchFor.camp_id} initialNeedId={dispatchFor.id} onDone={() => setDispatchFor(null)} onCancel={() => setDispatchFor(null)} />
        )}
      </Modal>
      {deleteDialog}
    </>
  );
}
