import { useMemo, useState } from 'react';
import { DONATION_TYPES, donationTotals, findById } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { DonationForm } from '../components/forms/DonationForm.jsx';
import { Modal, useConfirm } from '../components/Modal.jsx';
import { Badge, Button, Card, EmptyState, FilterChips, ListFooter, PageHeader, SearchInput, StatCard, Table, Td, Toolbar, fmt, fmtDate, fmtPKR } from '../components/ui.jsx';
import { useSort } from '../hooks/useSort.js';
import { useAction, useData } from '../state/DataContext.jsx';

export function Donations() {
  const { donations, inventory, can } = useData();
  const { run } = useAction();
  const [type, setType] = useState('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmDialog, ask] = useConfirm();
  const admin = can('donation.manage');

  const totals = useMemo(() => donationTotals(donations), [donations]);
  const inKind = donations.filter((d) => d.type === 'In-Kind');
  const q = query.trim().toLowerCase();
  const filtered = donations
    .filter((d) => type === 'All' || d.type === type)
    .filter((d) => !q || [d.donor, d.category, findById(inventory, d.item_id)?.name].some((s) => s?.toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id);
  const { rows, sort, onSort } = useSort(filtered, {
    date: (d) => new Date(d.created_at || 0).getTime(),
    donor: (d) => d.donor || 'Anonymous',
    type: (d) => d.type,
    category: (d) => d.category,
    amount: (d) => Number(d.amount_or_quantity),
  });
  const filtering = q !== '' || type !== 'All';
  const clearFilters = () => {
    setQuery('');
    setType('All');
  };

  const askDelete = (d) => {
    const item = findById(inventory, d.item_id);
    ask({
      title: 'Delete this donation?',
      message:
        d.type === 'In-Kind' ? (
          <p>
            {fmt(d.amount_or_quantity)} {item?.unit} will be removed from {item?.name ?? 'the item'}'s stock again. The API refuses if that stock has already been dispatched.
          </p>
        ) : (
          <p>{fmtPKR(d.amount_or_quantity)} will be removed from the cash total.</p>
        ),
      confirmLabel: 'Delete donation',
      onConfirm: () => run(() => api.donations.remove(d.id), { success: 'Donation deleted.' }),
    });
  };

  return (
    <>
      <PageHeader
        title="Donations"
        description="Cash and in-kind contributions. In-kind donations are added to warehouse stock immediately."
        actions={admin && <Button icon="plus" onClick={() => setOpen(true)}>Record donation</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cash received" value={fmtPKR(totals.cash)} sub={`${donations.length - inKind.length} cash donation(s)`} icon="heart" tone="green" />
        <StatCard label="In-kind donations" value={fmt(inKind.length)} sub={`${fmt(inKind.reduce((s, d) => s + Number(d.amount_or_quantity), 0))} units added to stock`} icon="box" />
        <StatCard label="Donations recorded" value={fmt(donations.length)} sub={`${totals.byCategory.length} categories`} icon="needs" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Totals by category" description="In-kind units are summed across each category's items" bodyClassName="p-0">
          {totals.byCategory.length ? (
            <Table
              caption="Donation totals by category"
              head={[{ label: 'Category' }, { label: 'Cash', className: 'text-right' }, { label: 'In-kind units', className: 'text-right' }, { label: '#', className: 'text-right' }]}
            >
              {totals.byCategory.map((r) => (
                <tr key={r.category}>
                  <Td className="font-medium">{r.category}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">{r.cash ? fmtPKR(r.cash) : '—'}</Td>
                  <Td className="text-right tabular-nums">{r.inKindUnits ? fmt(r.inKindUnits) : '—'}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{r.count}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No donations yet" />
          )}
        </Card>

        <Card title="Donation log" bodyClassName="p-0" className="xl:col-span-2">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search donor, category or item" label="Search donations" />
            <FilterChips
              label="Filter by type"
              options={[{ value: 'All', label: 'All', count: donations.length }, ...DONATION_TYPES.map((t) => ({ value: t, label: t, count: donations.filter((d) => d.type === t).length }))]}
              value={type}
              onChange={setType}
            />
          </Toolbar>
          {filtered.length ? (
            <Table
              caption="Donation log"
              sort={sort}
              onSort={onSort}
              head={[
                { label: 'Date', sortKey: 'date' },
                { label: 'Donor', className: 'min-w-40', sortKey: 'donor' },
                { label: 'Type', sortKey: 'type' },
                { label: 'Category', sortKey: 'category' },
                { label: 'Amount / quantity', className: 'text-right', sortKey: 'amount' },
                ...(admin ? [{ label: 'Actions', sr: true }] : []),
              ]}
            >
              {rows.map((d) => {
                const item = findById(inventory, d.item_id);
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <Td className="whitespace-nowrap text-slate-600">{fmtDate(d.created_at)}</Td>
                    <Td className="font-medium">{d.donor || 'Anonymous'}</Td>
                    <Td>
                      <Badge tone={d.type === 'Cash' ? 'green' : 'blue'}>{d.type}</Badge>
                    </Td>
                    <Td className="text-slate-600">{d.category}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {d.type === 'Cash' ? (
                        fmtPKR(d.amount_or_quantity)
                      ) : (
                        <>
                          {fmt(d.amount_or_quantity)} {item?.unit} <span className="text-xs text-slate-500">{item?.name ?? 'deleted item'}</span>
                        </>
                      )}
                    </Td>
                    {admin && (
                      <Td className="text-right">
                        <Button size="sm" variant="ghost" icon="trash" onClick={() => askDelete(d)} aria-label="Delete donation" className="hover:text-red-600" />
                      </Td>
                    )}
                  </tr>
                );
              })}
            </Table>
          ) : (
            <EmptyState
              icon="heart"
              title={donations.length ? 'No donations match these filters' : 'No donations yet'}
              action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
            />
          )}
          <ListFooter shown={filtered.length} total={donations.length} noun="donations" onClear={filtering ? clearFilters : undefined} />
        </Card>
      </div>

      <Modal open={open} title="Record donation" onClose={() => setOpen(false)}>
        {open && <DonationForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
