import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findById, isCriticalGap, needFulfilmentPct, sameId } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { DispatchTable } from '../components/DispatchTable.jsx';
import { CampForm, FamiliesForm } from '../components/forms/CampForms.jsx';
import { DispatchForm } from '../components/forms/DispatchForm.jsx';
import { NeedForm } from '../components/forms/NeedForm.jsx';
import { Modal } from '../components/Modal.jsx';
import { NeedsTable } from '../components/NeedsTable.jsx';
import { Button, CampStatusBadge, Card, EmptyState, Notice, PageHeader, SelectField, SkillBadge, StatCard, fmt, fmtPct } from '../components/ui.jsx';
import { useAction, useData } from '../state/DataContext.jsx';
import { useDeleteCamp } from './Camps.jsx';
import { useDeleteNeed } from './Needs.jsx';

function AssignVolunteer({ camp }) {
  const { volunteers } = useData();
  const { run, busy } = useAction();
  const [volunteerId, setVolunteerId] = useState('');
  const available = volunteers.filter((v) => v.camp_id === null || v.camp_id === undefined);

  const assign = async (e) => {
    e.preventDefault();
    if (!volunteerId) return;
    const v = findById(volunteers, volunteerId);
    const res = await run(() => api.volunteers.assign(v.id, camp.id), { success: `${v.name} assigned to ${camp.name}.` });
    if (res.ok) setVolunteerId('');
  };

  if (!available.length) return <p className="px-5 py-3 text-xs text-slate-500">All registered volunteers are already assigned.</p>;
  return (
    <form onSubmit={assign} className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <SelectField
          label="Assign an unassigned volunteer"
          value={volunteerId}
          onChange={(e) => setVolunteerId(e.target.value)}
          placeholder="Select volunteer"
          options={available.map((v) => ({ value: v.id, label: `${v.name} · ${v.skill}` }))}
        />
      </div>
      <Button type="submit" busy={busy} disabled={!volunteerId}>
        Assign
      </Button>
    </form>
  );
}

export function CampDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { camps, needs, dispatches, volunteers, can } = useData();
  const { run, busy } = useAction();
  const [editing, setEditing] = useState(false);
  const [headcount, setHeadcount] = useState(false);
  const [needModal, setNeedModal] = useState(null); // null | 'new' | need
  const [dispatchFor, setDispatchFor] = useState(null);
  const [deleteDialog, askDeleteCamp] = useDeleteCamp(() => navigate('/camps'));
  const [deleteNeedDialog, askDeleteNeed] = useDeleteNeed();
  const admin = can('camp.manage');

  const camp = findById(camps, id);
  if (!camp) {
    return <EmptyState icon="camp" title="Camp not found">It may have been deleted. Go back to the camps list.</EmptyState>;
  }

  const campNeeds = needs
    .filter((n) => sameId(n.camp_id, camp.id))
    .sort((a, b) => Number(isCriticalGap(b)) - Number(isCriticalGap(a)) || needFulfilmentPct(a) - needFulfilmentPct(b));
  const campDispatches = dispatches.filter((d) => sameId(d.camp_id, camp.id)).sort((a, b) => b.id - a.id);
  const campVolunteers = volunteers.filter((v) => sameId(v.camp_id, camp.id));
  const critical = campNeeds.filter(isCriticalGap).length;
  const avgFulfilment = campNeeds.length ? campNeeds.reduce((s, n) => s + needFulfilmentPct(n), 0) / campNeeds.length : 0;
  const closed = camp.status === 'Closed';

  return (
    <>
      <PageHeader
        back={{ to: '/camps', label: 'All camps' }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {camp.name} <CampStatusBadge status={camp.status} />
          </span>
        }
        description={`${camp.district} district`}
        actions={
          <>
            {can('camp.updateFamilies') && !admin && !closed && (
              <Button variant="secondary" onClick={() => setHeadcount(true)}>
                Update families
              </Button>
            )}
            {admin && (
              <>
                <Button variant="secondary" icon="pencil" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="secondary" icon="trash" onClick={() => askDeleteCamp(camp)} className="hover:text-red-600">
                  Delete
                </Button>
              </>
            )}
          </>
        }
      />

      {closed && (
        <Notice tone="warning" className="mb-5">
          This camp is Closed: no new dispatches or volunteer assignments are accepted.
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Families" value={`${fmt(camp.current_families)} / ${fmt(camp.capacity)}`} sub={`${fmtPct(Math.round((camp.current_families / camp.capacity) * 1000) / 10)} occupied`} icon="users" />
        <StatCard label="Average need fulfilment" value={fmtPct(Math.round(avgFulfilment * 10) / 10)} sub={`${campNeeds.length} need(s)`} icon="needs" />
        <StatCard label="Critical gaps" value={critical} sub="High priority below 40%" icon="alert" tone={critical ? 'red' : 'green'} />
        <StatCard label="Volunteers on site" value={campVolunteers.length} icon="users" tone="green" />
      </div>

      <Card
        className="mt-6"
        title="Needs"
        description="Fulfilment = fulfilled ÷ required. Unreserved = required − fulfilled − open dispatches."
        bodyClassName="p-0"
        actions={
          admin &&
          !closed && (
            <Button size="sm" icon="plus" onClick={() => setNeedModal('new')}>
              Add need
            </Button>
          )
        }
      >
        {campNeeds.length ? (
          <NeedsTable needs={campNeeds} showCamp={false} onDispatch={(n) => setDispatchFor(n)} onEdit={(n) => setNeedModal(n)} onDelete={askDeleteNeed} />
        ) : (
          <EmptyState icon="needs" title="No needs recorded for this camp" />
        )}
      </Card>

      <div className="mt-6 grid gap-6 2xl:grid-cols-3">
        <Card title="Dispatches to this camp" bodyClassName="p-0" className="2xl:col-span-2">
          {campDispatches.length ? <DispatchTable dispatches={campDispatches} showCamp={false} /> : <EmptyState icon="truck" title="No dispatches yet" />}
        </Card>
        <Card title="Volunteers" description={`${campVolunteers.length} assigned`} bodyClassName="p-0">
          {campVolunteers.length ? (
            <ul className="divide-y divide-slate-100">
              {campVolunteers.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <SkillBadge skill={v.skill} />
                  </div>
                  {can('volunteer.manage') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => run(() => api.volunteers.assign(v.id, null), { success: `${v.name} unassigned from ${camp.name}.` })}
                    >
                      Unassign
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="users" title="No volunteers assigned" />
          )}
          {can('volunteer.manage') && !closed && <AssignVolunteer camp={camp} />}
        </Card>
      </div>

      <Modal open={editing} title={`Edit ${camp.name}`} onClose={() => setEditing(false)}>
        {editing && <CampForm camp={camp} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />}
      </Modal>
      <Modal open={headcount} title={`Update headcount · ${camp.name}`} onClose={() => setHeadcount(false)} size="sm">
        {headcount && <FamiliesForm camp={camp} onDone={() => setHeadcount(false)} onCancel={() => setHeadcount(false)} />}
      </Modal>
      <Modal open={!!needModal} title={needModal === 'new' ? `Add need · ${camp.name}` : 'Edit need'} onClose={() => setNeedModal(null)}>
        {needModal && (
          <NeedForm need={needModal === 'new' ? null : needModal} campId={camp.id} onDone={() => setNeedModal(null)} onCancel={() => setNeedModal(null)} />
        )}
      </Modal>
      <Modal open={!!dispatchFor} title="New dispatch" description="Stock is reserved immediately." onClose={() => setDispatchFor(null)}>
        {dispatchFor && (
          <DispatchForm initialCampId={camp.id} initialNeedId={dispatchFor.id} onDone={() => setDispatchFor(null)} onCancel={() => setDispatchFor(null)} />
        )}
      </Modal>
      {deleteDialog}
      {deleteNeedDialog}
    </>
  );
}
