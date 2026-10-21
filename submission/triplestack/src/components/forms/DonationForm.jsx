import { CASH_CATEGORIES, ITEM_CATEGORIES, findById, toInt, validateDonation } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, FilterChips, SelectField, TextField, fmt, fmtPKR } from '../ui.jsx';

export function DonationForm({ onDone, onCancel }) {
  const { inventory } = useData();
  const { values, setValues, set, errors, busy, onSubmit } = useForm(
    { type: 'Cash', donor: '', amount_or_quantity: '', category: 'General', item_id: '' },
    {
      validate: (v) => validateDonation(v, { inventory }),
      submit: (value) => api.donations.create(value),
      success: (d) =>
        d.type === 'Cash'
          ? `Cash donation of ${fmtPKR(d.amount_or_quantity)} recorded.`
          : `In-kind donation recorded; ${findById(inventory, d.item_id)?.name ?? 'item'} stock increased by ${fmt(d.amount_or_quantity)}.`,
      onDone,
    },
  );
  const item = findById(inventory, values.item_id);
  const qty = toInt(values.amount_or_quantity);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Donation type</p>
        <FilterChips
          label="Donation type"
          options={['Cash', 'In-Kind']}
          value={values.type}
          onChange={(type) => setValues((v) => ({ ...v, type, amount_or_quantity: '', category: type === 'Cash' ? 'General' : '', item_id: '' }))}
        />
      </div>
      <TextField label="Donor" value={values.donor} onChange={set('donor')} error={errors.donor} placeholder="Leave blank for Anonymous" maxLength={80} />
      {values.type === 'Cash' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Amount (PKR)"
            required
            type="number"
            min="1"
            step="any"
            inputMode="decimal"
            value={values.amount_or_quantity}
            onChange={set('amount_or_quantity')}
            error={errors.amount_or_quantity}
            autoFocus
          />
          <SelectField
            label="Category"
            required
            value={values.category}
            onChange={set('category')}
            error={errors.category}
            options={CASH_CATEGORIES.map((c) => ({ value: c, label: c === 'General' ? 'General (unrestricted)' : `Earmarked: ${c}` }))}
          />
        </div>
      ) : (
        <>
          <SelectField
            label="Item donated"
            required
            value={values.item_id}
            onChange={set('item_id')}
            error={errors.item_id}
            placeholder="Select inventory item"
            options={ITEM_CATEGORIES.flatMap((cat) =>
              inventory.filter((i) => i.category === cat).map((i) => ({ value: i.id, label: `${cat} · ${i.name} (${i.unit})` })),
            )}
            hint="Category is taken from the item."
          />
          <TextField
            label={`Quantity${item ? ` (${item.unit})` : ''}`}
            required
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={values.amount_or_quantity}
            onChange={set('amount_or_quantity')}
            error={errors.amount_or_quantity}
          />
          {item && qty > 0 && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {item.name} stock will increase from <strong>{fmt(item.stock)}</strong> to <strong>{fmt(item.stock + qty)}</strong> {item.unit}.
            </p>
          )}
        </>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" icon="heart" busy={busy}>
          Record donation
        </Button>
      </ModalActions>
    </form>
  );
}
