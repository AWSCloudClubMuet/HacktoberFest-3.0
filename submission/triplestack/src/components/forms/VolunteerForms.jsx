import { SKILLS, findById, validateVolunteer } from '../../../shared/domain.js';
import { api } from '../../api/client.js';
import { useForm } from '../../hooks/useForm.js';
import { useData } from '../../state/DataContext.jsx';
import { ModalActions } from '../Modal.jsx';
import { Button, SelectField, TextField } from '../ui.jsx';

// Closed camps are listed but disabled so the rule is visible, not hidden.
export function campOptions(camps) {
  return camps.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.district})${c.status === 'Closed' ? ' — Closed' : c.status === 'Full' ? ' — Full' : ''}`,
    disabled: c.status === 'Closed',
  }));
}

export function VolunteerForm({ volunteer, onDone, onCancel }) {
  const { camps } = useData();
  const { values, set, errors, busy, onSubmit } = useForm(
    { name: volunteer?.name ?? '', skill: volunteer?.skill ?? '', camp_id: volunteer?.camp_id ?? '' },
    {
      validate: (v) => validateVolunteer(v, { camps }),
      submit: (value) => (volunteer ? api.volunteers.update(volunteer.id, value) : api.volunteers.create(value)),
      success: (saved) => `${saved.name} ${volunteer ? 'updated' : 'registered'}.`,
      onDone,
    },
  );
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField label="Full name" required value={values.name} onChange={set('name')} error={errors.name} maxLength={80} autoFocus />
      <SelectField label="Skill" required value={values.skill} onChange={set('skill')} error={errors.skill} options={SKILLS} placeholder="Select skill" />
      <SelectField
        label="Camp assignment"
        value={values.camp_id ?? ''}
        onChange={set('camp_id')}
        error={errors.camp_id}
        options={campOptions(camps)}
        placeholder="Unassigned"
        hint="A volunteer can be assigned to one camp at a time."
      />
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {volunteer ? 'Save changes' : 'Register volunteer'}
        </Button>
      </ModalActions>
    </form>
  );
}

export function AssignForm({ volunteer, onDone, onCancel }) {
  const { camps } = useData();
  const { values, set, errors, busy, onSubmit } = useForm(
    { camp_id: volunteer.camp_id ?? '' },
    {
      validate: (v) => {
        const check = validateVolunteer({ ...volunteer, camp_id: v.camp_id }, { camps });
        if (check.ok && check.value.camp_id === null) return { ok: false, errors: { camp_id: 'Choose a camp.' } };
        return check;
      },
      submit: (value) => api.volunteers.assign(volunteer.id, value.camp_id),
      success: (saved) => `${saved.name} assigned to ${findById(camps, saved.camp_id)?.name}.`,
      onDone,
    },
  );
  const current = findById(camps, volunteer.camp_id);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {current && (
        <p className="text-sm text-slate-600">
          Currently assigned to <strong>{current.name}</strong>. Assigning a new camp replaces this assignment.
        </p>
      )}
      <SelectField label="Camp" required value={values.camp_id} onChange={set('camp_id')} error={errors.camp_id} options={campOptions(camps)} placeholder="Select camp" autoFocus />
      <ModalActions>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          Assign
        </Button>
      </ModalActions>
    </form>
  );
}
