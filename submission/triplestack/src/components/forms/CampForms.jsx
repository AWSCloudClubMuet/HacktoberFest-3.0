import { deriveCampStatus, toInt, validateCamp } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, CampStatusBadge, Notice, SelectField, TextField } from '../ui.jsx';

export const SINDH_DISTRICTS = [
  'Badin', 'Dadu', 'Ghotki', 'Hyderabad', 'Jacobabad', 'Jamshoro', 'Kashmore', 'Khairpur', 'Larkana', 'Matiari',
  'Mirpur Khas', 'Naushahro Feroze', 'Qambar Shahdadkot', 'Sanghar', 'Shaheed Benazirabad', 'Shikarpur', 'Sujawal',
  'Sukkur', 'Tando Allahyar', 'Thatta', 'Tharparkar', 'Umerkot',
];

export function CampForm({ camp, onDone, onCancel }) {
  const { camps, volunteers } = useData();
  const form = useForm(
    {
      name: camp?.name ?? '',
      district: camp?.district ?? '',
      capacity: camp?.capacity ?? '',
      current_families: camp?.current_families ?? 0,
      status: camp?.status === 'Closed' ? 'Closed' : 'Active',
    },
    {
      validate: (v) => validateCamp(v, { camps, id: camp?.id }),
      submit: (value) => (camp ? api.camps.update(camp.id, value) : api.camps.create(value)),
      success: (saved) =>
        camp
          ? `Camp "${saved.name}" updated${saved.unassigned_volunteers ? `; ${saved.unassigned_volunteers} volunteer(s) unassigned` : ''}.`
          : `Camp "${saved.name}" created as ${saved.status}.`,
      onDone,
    },
  );
  const { values, set, errors, busy, onSubmit } = form;

  const capacity = toInt(values.capacity);
  const families = toInt(values.current_families);
  const preview = Number.isNaN(capacity) || Number.isNaN(families) ? null : deriveCampStatus(values.status, families, capacity);
  const assigned = camp ? volunteers.filter((v) => String(v.camp_id) === String(camp.id)).length : 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField label="Camp name" required value={values.name} onChange={set('name')} error={errors.name} placeholder="e.g. Govt. Boys School Camp, Mehar" maxLength={80} autoFocus />
      <TextField
        label="District"
        required
        value={values.district}
        onChange={set('district')}
        error={errors.district}
        list="sindh-districts"
        placeholder="Start typing a district"
      />
      <datalist id="sindh-districts">
        {SINDH_DISTRICTS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Capacity (families)" required type="number" min="1" step="1" inputMode="numeric" value={values.capacity} onChange={set('capacity')} error={errors.capacity} />
        <TextField
          label="Current families"
          required
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={values.current_families}
          onChange={set('current_families')}
          error={errors.current_families}
        />
      </div>
      <SelectField
        label="Operating status"
        value={values.status}
        onChange={set('status')}
        error={errors.status}
        options={[
          { value: 'Active', label: 'Open (Active / Full set automatically)' },
          { value: 'Closed', label: 'Closed' },
        ]}
        hint="A camp becomes Full automatically when current families reach capacity."
      />
      {preview && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          Will be saved as <CampStatusBadge status={preview} />
        </p>
      )}
      {values.status === 'Closed' && assigned > 0 && camp?.status !== 'Closed' && (
        <Notice tone="warning">
          Closing this camp will unassign its {assigned} volunteer(s); volunteers cannot be assigned to a Closed camp.
        </Notice>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {camp ? 'Save changes' : 'Create camp'}
        </Button>
      </ModalActions>
    </form>
  );
}

// Field Volunteers may only report the current headcount.
export function FamiliesForm({ camp, onDone, onCancel }) {
  const { camps } = useData();
  const form = useForm(
    { current_families: camp.current_families },
    {
      validate: (v) => {
        const check = validateCamp({ ...camp, current_families: v.current_families }, { camps, id: camp.id });
        return { ...check, value: { current_families: check.value.current_families } };
      },
      submit: (value) => api.camps.update(camp.id, value),
      success: (saved) => `${saved.name}: ${saved.current_families} families (${saved.status}).`,
      onDone,
    },
  );
  const { values, set, errors, busy, onSubmit } = form;
  const families = toInt(values.current_families);
  const preview = Number.isNaN(families) ? null : deriveCampStatus(camp.status, families, camp.capacity);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        label={`Current families (capacity ${camp.capacity})`}
        type="number"
        min="0"
        max={camp.capacity}
        step="1"
        inputMode="numeric"
        value={values.current_families}
        onChange={set('current_families')}
        error={errors.current_families}
        autoFocus
      />
      {preview && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          Status after update <CampStatusBadge status={preview} />
        </p>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          Update headcount
        </Button>
      </ModalActions>
    </form>
  );
}
