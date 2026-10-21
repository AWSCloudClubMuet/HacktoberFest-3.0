import { findById, maxDispatchable, needFulfilmentPct, remainingUnreserved, sameId, validateDispatch } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, Notice, SelectField, TextField, fmt } from '../ui.jsx';

// initialQuantity is a suggestion only (e.g. from the Allocation Advisor); it is
// validated like any typed value before anything is sent.
export function DispatchForm({ initialCampId, initialNeedId, initialQuantity, onDone, onCancel }) {
  const data = useData();
  const { camps, needs, inventory, dispatches } = data;
  const { values, setValues, set, errors, busy, onSubmit } = useForm(
    { camp_id: initialCampId ?? '', need_id: initialNeedId ?? '', quantity: initialQuantity != null ? String(initialQuantity) : '' },
    {
      validate: (v) => validateDispatch(v, data),
      submit: (value) => api.dispatches.create(value),
      success: (d) => `Dispatch #${d.id} created: ${fmt(d.quantity)} units reserved from stock.`,
      onDone,
    },
  );

  const campNeeds = needs.filter((n) => sameId(n.camp_id, values.camp_id));
  const need = findById(needs, values.need_id);
  const item = need && findById(inventory, need.inventory_item_id);
  const max = maxDispatchable(need, item, dispatches);
  const remaining = need ? remainingUnreserved(need, dispatches) : 0;

  const onCampChange = (e) => {
    setValues((v) => ({ ...v, camp_id: e.target.value, need_id: '', quantity: '' }));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <SelectField
        label="Camp"
        required
        value={values.camp_id}
        onChange={onCampChange}
        error={errors.camp_id}
        placeholder="Select camp"
        options={camps.map((c) => ({
          value: c.id,
          label: `${c.name} (${c.district})${c.status === 'Closed' ? ' — Closed' : ''}`,
          disabled: c.status === 'Closed',
        }))}
      />
      <SelectField
        label="Need"
        required
        value={values.need_id}
        onChange={set('need_id')}
        error={errors.need_id}
        disabled={!values.camp_id}
        placeholder={values.camp_id ? (campNeeds.length ? 'Select need' : 'This camp has no needs') : 'Select a camp first'}
        options={campNeeds.map((n) => {
          const it = findById(inventory, n.inventory_item_id);
          const left = remainingUnreserved(n, dispatches);
          return {
            value: n.id,
            label: `${it?.name ?? 'Unknown item'} · ${n.priority} · ${Math.round(needFulfilmentPct(n))}% fulfilled · ${fmt(left)} ${it?.unit ?? ''} open`,
            disabled: left === 0,
          };
        })}
      />
      {need && item && (
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center text-xs">
          <div>
            <dt className="text-slate-500">In stock</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(item.stock)} {item.unit}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Unreserved need</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(remaining)} {item.unit}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Max dispatch</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-brand-700">{fmt(max)} {item.unit}</dd>
          </div>
        </dl>
      )}
      {need && item && max === 0 && (
        <Notice tone="warning">
          {item.stock === 0 ? `${item.name} is out of stock.` : 'This need is fully fulfilled or already covered by open dispatches.'}
        </Notice>
      )}
      <TextField
        label={`Quantity${item ? ` (${item.unit})` : ''}`}
        required
        type="number"
        min="1"
        max={max || undefined}
        step="1"
        inputMode="numeric"
        value={values.quantity}
        onChange={set('quantity')}
        error={errors.quantity}
        disabled={!need || max === 0}
        data-autofocus={initialNeedId ? true : undefined}
        hint={need && max > 0 ? `Stock is reserved as soon as the dispatch is created. Maximum ${fmt(max)}.` : undefined}
      />
      {need && max > 0 && (
        <button type="button" className="-mt-2 text-xs font-medium text-brand-700 hover:underline" onClick={() => set('quantity')(String(max))}>
          Use maximum ({fmt(max)})
        </button>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" icon="truck" busy={busy} disabled={!need || max === 0}>
          Create dispatch
        </Button>
      </ModalActions>
    </form>
  );
}
