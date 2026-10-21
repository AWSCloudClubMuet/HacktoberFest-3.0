import { ITEM_CATEGORIES, PRIORITIES, findById, reservedForNeed, validateNeed } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, SelectField, TextField, fmt } from '../ui.jsx';

export function NeedForm({ need, campId, onDone, onCancel }) {
  const data = useData();
  const { camps, inventory, dispatches } = data;
  const { values, set, errors, busy, onSubmit } = useForm(
    {
      camp_id: need?.camp_id ?? campId ?? '',
      inventory_item_id: need?.inventory_item_id ?? '',
      required_quantity: need?.required_quantity ?? '',
      priority: need?.priority ?? 'Medium',
    },
    {
      validate: (v) => validateNeed(v, { ...data, existing: need || null }),
      submit: (value) => (need ? api.needs.update(need.id, value) : api.needs.create(value)),
      success: () => (need ? 'Need updated.' : 'Need added to the camp.'),
      onDone,
    },
  );

  const item = findById(inventory, values.inventory_item_id);
  const committed = need ? Number(need.fulfilled_quantity) + reservedForNeed(need.id, dispatches) : 0;
  const campOptions = camps
    .filter((c) => c.status !== 'Closed' || String(c.id) === String(values.camp_id))
    .map((c) => ({ value: c.id, label: `${c.name} (${c.district})` }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <SelectField
        label="Camp"
        required
        value={values.camp_id}
        onChange={set('camp_id')}
        error={errors.camp_id}
        options={campOptions}
        placeholder="Select camp"
        disabled={!!campId && !need}
      />
      <div>
        <SelectField
          label="Inventory item"
          required
          value={values.inventory_item_id}
          onChange={set('inventory_item_id')}
          error={errors.inventory_item_id}
          placeholder="Select item"
          options={ITEM_CATEGORIES.flatMap((cat) =>
            inventory
              .filter((i) => i.category === cat)
              .map((i) => ({ value: i.id, label: `${cat} · ${i.name} (${fmt(i.stock)} ${i.unit} in stock)` })),
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={`Required quantity${item ? ` (${item.unit})` : ''}`}
          required
          type="number"
          min={Math.max(1, committed)}
          step="1"
          inputMode="numeric"
          value={values.required_quantity}
          onChange={set('required_quantity')}
          error={errors.required_quantity}
          hint={need ? `Fulfilled ${fmt(need.fulfilled_quantity)}; at least ${fmt(committed)} incl. open dispatches.` : undefined}
        />
        <SelectField label="Priority" required value={values.priority} onChange={set('priority')} error={errors.priority} options={PRIORITIES} />
      </div>
      {!need && <p className="text-xs text-slate-500">Fulfilled quantity starts at 0 and increases only when dispatches are marked Delivered.</p>}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {need ? 'Save changes' : 'Add need'}
        </Button>
      </ModalActions>
    </form>
  );
}
