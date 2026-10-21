import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ITEM_CATEGORIES, OPEN_DISPATCH_STATUSES, findById, isLowStock, sameId } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { InventoryForm } from '../components/forms/InventoryForm.jsx';
import { Modal, useConfirm } from '../components/Modal.jsx';
import { Badge, Button, Card, EmptyState, FilterChips, ListFooter, LowStockBadge, PageHeader, SearchInput, Table, Td, Toolbar, ToolbarCheckbox, fmt } from '../components/ui.jsx';
import { useSort } from '../hooks/useSort.js';
import { useAction, useData } from '../state/DataContext.jsx';

export function Inventory() {
  const { inventory, needs, dispatches, donations, can } = useData();
  const { run } = useAction();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const lowOnly = params.get('low') === '1';
  const [modal, setModal] = useState(null);
  const [confirmDialog, ask] = useConfirm();
  const admin = can('inventory.manage');

  // Quantity of each item currently reserved by Pending / In Transit dispatches.
  const reservedByItem = useMemo(() => {
    const map = {};
    for (const d of dispatches) {
      if (!OPEN_DISPATCH_STATUSES.includes(d.status)) continue;
      const need = findById(needs, d.need_id);
      if (need) map[need.inventory_item_id] = (map[need.inventory_item_id] || 0) + Number(d.quantity);
    }
    return map;
  }, [dispatches, needs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory
      .filter((i) => (category === 'All' || i.category === category) && (!lowOnly || isLowStock(i)) && (!q || i.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(isLowStock(b)) - Number(isLowStock(a)) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [inventory, query, category, lowOnly]);

  const lowCount = inventory.filter(isLowStock).length;
  const { rows, sort, onSort } = useSort(filtered, {
    name: (i) => i.name,
    category: (i) => i.category,
    stock: (i) => Number(i.stock),
    reserved: (i) => reservedByItem[i.id] || 0,
    reorder: (i) => Number(i.reorder_level),
    status: (i) => (isLowStock(i) ? 0 : 1),
  });
  const filtering = query.trim() !== '' || category !== 'All' || lowOnly;
  const clearFilters = () => {
    setQuery('');
    setCategory('All');
    setParams({}, { replace: true });
  };

  const askDelete = (item) => {
    const refs = needs.filter((n) => sameId(n.inventory_item_id, item.id)).length + donations.filter((d) => sameId(d.item_id, item.id)).length;
    ask({
      title: `Delete ${item.name}?`,
      message: refs ? (
        <p>This item is referenced by {refs} need(s)/donation(s). The API will refuse to delete it so those records stay valid.</p>
      ) : (
        <p>The item will be permanently removed from the warehouse.</p>
      ),
      confirmLabel: 'Delete item',
      onConfirm: () => run(() => api.inventory.remove(item.id), { success: `${item.name} deleted.` }),
    });
  };

  return (
    <>
      <PageHeader
        title="Warehouse inventory"
        description="Available stock excludes quantities already reserved by Pending and In Transit dispatches."
        actions={admin && <Button icon="plus" onClick={() => setModal('new')}>Add item</Button>}
      />
      <Card bodyClassName="p-0">
        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search items" label="Search inventory" />
          <FilterChips label="Filter by category" options={['All', ...ITEM_CATEGORIES]} value={category} onChange={setCategory} />
          <ToolbarCheckbox checked={lowOnly} onChange={(on) => setParams(on ? { low: '1' } : {}, { replace: true })}>
            Low stock only ({lowCount})
          </ToolbarCheckbox>
        </Toolbar>
        {filtered.length === 0 ? (
          <EmptyState
            icon="box"
            title={inventory.length ? 'No items match these filters' : 'No inventory items yet'}
            action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <Table
            caption="Inventory"
            sort={sort}
            onSort={onSort}
            head={[
              { label: 'Item', className: 'min-w-44', sortKey: 'name' },
              { label: 'Category', sortKey: 'category' },
              { label: 'Available', className: 'text-right', sortKey: 'stock' },
              { label: 'Reserved', className: 'text-right', sortKey: 'reserved' },
              { label: 'Reorder level', className: 'text-right', sortKey: 'reorder' },
              { label: 'Status', sortKey: 'status' },
              ...(admin ? [{ label: 'Actions', sr: true }] : []),
            ]}
          >
            {rows.map((i) => {
              const low = isLowStock(i);
              return (
                <tr key={i.id} className={low ? 'bg-amber-50/70' : 'hover:bg-slate-50'}>
                  <Td className="font-medium text-slate-900">{i.name}</Td>
                  <Td>
                    <Badge>{i.category}</Badge>
                  </Td>
                  <Td className={`whitespace-nowrap text-right tabular-nums ${low ? 'font-semibold text-amber-800' : ''}`}>
                    {fmt(i.stock)} <span className="text-xs font-normal text-slate-500">{i.unit}</span>
                  </Td>
                  <Td className="text-right tabular-nums text-slate-600">{reservedByItem[i.id] ? fmt(reservedByItem[i.id]) : '—'}</Td>
                  <Td className="text-right tabular-nums text-slate-600">{fmt(i.reorder_level)}</Td>
                  <Td>{low ? <LowStockBadge /> : <Badge tone="green">In stock</Badge>}</Td>
                  {admin && (
                    <Td className="whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" icon="pencil" onClick={() => setModal(i)} aria-label={`Edit ${i.name}`} />
                        <Button size="sm" variant="ghost" icon="trash" onClick={() => askDelete(i)} aria-label={`Delete ${i.name}`} className="hover:text-red-600" />
                      </div>
                    </Td>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
        <ListFooter shown={filtered.length} total={inventory.length} noun="items" onClear={filtering ? clearFilters : undefined}>
          Low Stock = available stock at or below the reorder level
        </ListFooter>
      </Card>

      <Modal open={!!modal} title={modal === 'new' ? 'Add inventory item' : `Edit ${modal?.name ?? ''}`} onClose={() => setModal(null)}>
        {modal && <InventoryForm item={modal === 'new' ? null : modal} onDone={() => setModal(null)} onCancel={() => setModal(null)} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
