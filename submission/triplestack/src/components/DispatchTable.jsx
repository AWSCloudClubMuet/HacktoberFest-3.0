import { Link } from 'react-router-dom';
import { canTransition, findById } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { useSort } from '../hooks/useSort.js';
import { useAction, useData } from '../state/DataContext.jsx';
import { useConfirm } from './Modal.jsx';
import { Button, DispatchStatusBadge, Table, Td, fmt, fmtDate } from './ui.jsx';

export function DispatchTable({ dispatches, showCamp = true }) {
  const { camps, needs, inventory, can } = useData();
  const { run, busy } = useAction();
  const [confirmDialog, ask] = useConfirm();
  const canAdvance = can('dispatch.advance');
  const canCancel = can('dispatch.cancel');

  const describe = (d) => {
    const need = findById(needs, d.need_id);
    const item = need && findById(inventory, need.inventory_item_id);
    return { need, item, label: `${fmt(d.quantity)} ${item?.unit ?? 'units'} of ${item?.name ?? 'item'}` };
  };

  const setStatus = (d, status, message) => run(() => api.dispatches.setStatus(d.id, status), { success: message });

  const markDelivered = (d) => {
    const { label } = describe(d);
    ask({
      title: `Mark dispatch #${d.id} Delivered?`,
      message: `${label} will be added to the need's fulfilled quantity. A delivered dispatch cannot be cancelled.`,
      confirmLabel: 'Mark Delivered',
      tone: 'primary',
      onConfirm: () => setStatus(d, 'Delivered', `Dispatch #${d.id} delivered; fulfilment updated.`),
    });
  };

  const cancel = (d) => {
    const { label } = describe(d);
    ask({
      title: `Cancel dispatch #${d.id}?`,
      message: `${label} will be returned to warehouse stock. This cannot be undone.`,
      confirmLabel: 'Cancel dispatch',
      onConfirm: () => setStatus(d, 'Cancelled', `Dispatch #${d.id} cancelled; stock restored.`),
    });
  };

  const STATUS_ORDER = { Pending: 0, 'In Transit': 1, Delivered: 2, Cancelled: 3 };
  const { rows, sort, onSort } = useSort(dispatches, {
    id: (d) => Number(d.id),
    camp: (d) => findById(camps, d.camp_id)?.name,
    item: (d) => describe(d).item?.name,
    quantity: (d) => Number(d.quantity),
    status: (d) => STATUS_ORDER[d.status] ?? 4,
    created: (d) => new Date(d.created_at || 0).getTime(),
    updated: (d) => new Date(d.updated_at || 0).getTime(),
  });

  const head = [
    { label: '#', sortKey: 'id' },
    ...(showCamp ? [{ label: 'Camp', className: 'min-w-48', sortKey: 'camp' }] : []),
    { label: 'Item', className: 'min-w-40', sortKey: 'item' },
    { label: 'Quantity', className: 'text-right', sortKey: 'quantity' },
    { label: 'Status', sortKey: 'status' },
    { label: 'Created', sortKey: 'created' },
    { label: 'Last update', sortKey: 'updated' },
    ...(canAdvance ? [{ label: 'Actions', sr: true }] : []),
  ];

  return (
    <>
      <Table head={head} caption="Dispatches" sort={sort} onSort={onSort}>
        {rows.map((d) => {
          const camp = findById(camps, d.camp_id);
          const { item } = describe(d);
          return (
            <tr key={d.id}>
              <Td className="tabular-nums text-slate-500">{d.id}</Td>
              {showCamp && (
                <Td>
                  {camp ? (
                    <Link to={`/camps/${camp.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                      {camp.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Deleted camp</span>
                  )}
                </Td>
              )}
              <Td>{item?.name ?? <span className="text-slate-400">Deleted item</span>}</Td>
              <Td className="whitespace-nowrap text-right tabular-nums">
                {fmt(d.quantity)} <span className="text-xs text-slate-500">{item?.unit}</span>
              </Td>
              <Td>
                <DispatchStatusBadge status={d.status} />
              </Td>
              <Td className="whitespace-nowrap text-slate-600">{fmtDate(d.created_at)}</Td>
              <Td className="whitespace-nowrap text-slate-600">{fmtDate(d.updated_at)}</Td>
              {canAdvance && (
                <Td className="whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    {canTransition(d.status, 'In Transit') && (
                      <Button size="sm" variant="secondary" icon="send" disabled={busy} onClick={() => setStatus(d, 'In Transit', `Dispatch #${d.id} is now In Transit.`)}>
                        In Transit
                      </Button>
                    )}
                    {canTransition(d.status, 'Delivered') && (
                      <Button size="sm" variant="secondary" icon="check" disabled={busy} onClick={() => markDelivered(d)}>
                        Delivered
                      </Button>
                    )}
                    {canCancel && canTransition(d.status, 'Cancelled') && (
                      <Button size="sm" variant="ghost" icon="ban" disabled={busy} onClick={() => cancel(d)} className="hover:text-red-600">
                        Cancel
                      </Button>
                    )}
                  </div>
                </Td>
              )}
            </tr>
          );
        })}
      </Table>
      {confirmDialog}
    </>
  );
}
