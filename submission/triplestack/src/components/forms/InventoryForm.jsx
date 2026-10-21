import { ITEM_CATEGORIES, toInt, validateInventory } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, LowStockBadge, SelectField, TextField } from '../ui.jsx';

export function InventoryForm({ item, onDone, onCancel }) {
  const { inventory } = useData();
  const { values, set, errors, busy, onSubmit } = useForm(
    {
      name: item?.name ?? '',
      category: item?.category ?? '',
      unit: item?.unit ?? '',
      stock: item?.stock ?? 0,
      reorder_level: item?.reorder_level ?? 0,
    },
    {
      validate: (v) => validateInventory(v, { inventory, id: item?.id }),
      submit: (value) => (item ? api.inventory.update(item.id, value) : api.inventory.create(value)),
      success: (saved) => `${saved.name} ${item ? 'updated' : 'added to the warehouse'}.`,
      onDone,
    },
  );
  const stock = toInt(values.stock);
  const reorder = toInt(values.reorder_level);
  const low = !Number.isNaN(stock) && !Number.isNaN(reorder) && stock <= reorder;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField label="Item name" required value={values.name} onChange={set('name')} error={errors.name} maxLength={80} autoFocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Category" required value={values.category} onChange={set('category')} error={errors.category} options={ITEM_CATEGORIES} placeholder="Select category" />
        <TextField label="Unit" required value={values.unit} onChange={set('unit')} error={errors.unit} placeholder="kg, litre, kit…" maxLength={20} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Available stock"
          required
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={values.stock}
          onChange={set('stock')}
          error={errors.stock}
          hint={item ? 'Excludes quantities reserved by open dispatches.' : undefined}
        />
        <TextField label="Reorder level" required type="number" min="0" step="1" inputMode="numeric" value={values.reorder_level} onChange={set('reorder_level')} error={errors.reorder_level} />
      </div>
      {low && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          This item will be flagged <LowStockBadge />
        </p>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {item ? 'Save changes' : 'Add item'}
        </Button>
      </ModalActions>
    </form>
  );
}
