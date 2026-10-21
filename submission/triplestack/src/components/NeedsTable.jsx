import { Link } from 'react-router-dom';
import { findById, isCriticalGap, needFulfilmentPct, remainingUnreserved, reservedForNeed } from '../../shared/domain.js';
import { useSort } from '../hooks/useSort.js';
import { useData } from '../state/DataContext.jsx';
import { Badge, Button, PriorityBadge, ProgressBar, Table, Td, fmt } from './ui.jsx';

// Shared by the Needs page and Camp detail. Callbacks receive the need record.
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export function NeedsTable({ needs, showCamp = true, onDispatch, onEdit, onDelete }) {
  const { camps, inventory, dispatches, can } = useData();
  const admin = can('need.manage');
  const { rows, sort, onSort } = useSort(needs, {
    camp: (n) => findById(camps, n.camp_id)?.name,
    item: (n) => findById(inventory, n.inventory_item_id)?.name,
    priority: (n) => PRIORITY_RANK[n.priority] ?? 3,
    fulfilment: (n) => needFulfilmentPct(n),
    reserved: (n) => reservedForNeed(n.id, dispatches),
    unreserved: (n) => remainingUnreserved(n, dispatches),
  });

  const head = [
    ...(showCamp ? [{ label: 'Camp', className: 'min-w-48', sortKey: 'camp' }] : []),
    { label: 'Item', className: 'min-w-44', sortKey: 'item' },
    { label: 'Priority', sortKey: 'priority' },
    { label: 'Fulfilment', className: 'min-w-48', sortKey: 'fulfilment' },
    { label: 'Fulfilled / Required', className: 'text-right' },
    { label: 'In transit / pending', className: 'text-right', sortKey: 'reserved' },
    { label: 'Unreserved', className: 'text-right', sortKey: 'unreserved' },
    ...(admin ? [{ label: 'Actions', sr: true }] : []),
  ];

  return (
    <Table head={head} caption="Camp needs" sort={sort} onSort={onSort}>
      {rows.map((n) => {
        const camp = findById(camps, n.camp_id);
        const item = findById(inventory, n.inventory_item_id);
        const critical = isCriticalGap(n);
        const reserved = reservedForNeed(n.id, dispatches);
        const remaining = remainingUnreserved(n, dispatches);
        const unit = item?.unit ?? '';
        return (
          <tr key={n.id} className={critical ? 'bg-red-50/60' : undefined}>
            {showCamp && (
              <Td>
                {camp ? (
                  <Link to={`/camps/${camp.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                    {camp.name}
                  </Link>
                ) : (
                  <span className="text-slate-400">Deleted camp</span>
                )}
                {camp && <p className="text-xs text-slate-500">{camp.district}</p>}
              </Td>
            )}
            <Td>
              <p className="font-medium text-slate-900">{item?.name ?? 'Deleted item'}</p>
              <p className="text-xs text-slate-500">{item?.category}</p>
            </Td>
            <Td>
              <div className="flex flex-wrap items-center gap-1">
                <PriorityBadge priority={n.priority} />
                {critical && (
                  <Badge tone="red" icon="alert">
                    Critical gap
                  </Badge>
                )}
              </div>
            </Td>
            <Td>
              <ProgressBar value={needFulfilmentPct(n)} critical={critical} label={`${item?.name ?? 'Need'} fulfilment`} />
            </Td>
            <Td className="whitespace-nowrap text-right tabular-nums">
              {fmt(n.fulfilled_quantity)} / {fmt(n.required_quantity)} <span className="text-xs text-slate-500">{unit}</span>
            </Td>
            <Td className="text-right tabular-nums text-slate-600">{reserved ? fmt(reserved) : '—'}</Td>
            <Td className="text-right tabular-nums">{fmt(remaining)}</Td>
            {admin && (
              <Td className="whitespace-nowrap text-right">
                <div className="flex justify-end gap-1">
                  {onDispatch && (
                    <Button
                      size="sm"
                      variant="subtle"
                      icon="truck"
                      onClick={() => onDispatch(n)}
                      disabled={remaining === 0 || camp?.status === 'Closed' || !item?.stock}
                      title={remaining === 0 ? 'Nothing left to dispatch' : !item?.stock ? 'Out of stock' : undefined}
                    >
                      Dispatch
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" icon="pencil" onClick={() => onEdit(n)} aria-label={`Edit need for ${item?.name}`} />
                  <Button size="sm" variant="ghost" icon="trash" onClick={() => onDelete(n)} aria-label={`Delete need for ${item?.name}`} className="hover:text-red-600" />
                </div>
              </Td>
            )}
          </tr>
        );
      })}
    </Table>
  );
}
