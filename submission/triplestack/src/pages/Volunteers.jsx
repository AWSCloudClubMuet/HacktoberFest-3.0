import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SKILLS, findById } from '../../shared/domain.js';
import { api } from '../api/client.js';
import { AssignForm, VolunteerForm } from '../components/forms/VolunteerForms.jsx';
import { Modal, useConfirm } from '../components/Modal.jsx';
import { Button, Card, EmptyState, FilterChips, ListFooter, PageHeader, SearchInput, SkillBadge, Table, Td, Toolbar } from '../components/ui.jsx';
import { useSort } from '../hooks/useSort.js';
import { useAction, useData } from '../state/DataContext.jsx';

export function Volunteers() {
  const { volunteers, camps, can } = useData();
  const { run, busy } = useAction();
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('All');
  const [assignment, setAssignment] = useState('All');
  const [modal, setModal] = useState(null); // null | 'new' | volunteer
  const [assigning, setAssigning] = useState(null);
  const [confirmDialog, ask] = useConfirm();
  const admin = can('volunteer.manage');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return volunteers
      .filter((v) => skill === 'All' || v.skill === skill)
      .filter((v) => assignment === 'All' || (assignment === 'Assigned' ? v.camp_id != null : v.camp_id == null))
      .filter((v) => {
        if (!q) return true;
        const camp = findById(camps, v.camp_id);
        return [v.name, v.skill, camp?.name].some((s) => s?.toLowerCase().includes(q));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [volunteers, camps, query, skill, assignment]);

  const deployed = volunteers.filter((v) => v.camp_id != null).length;
  const { rows, sort, onSort } = useSort(filtered, {
    name: (v) => v.name,
    skill: (v) => v.skill,
    // Unassigned volunteers sort after every camp name.
    camp: (v) => findById(camps, v.camp_id)?.name ?? '￿',
  });
  const filtering = query.trim() !== '' || skill !== 'All' || assignment !== 'All';
  const clearFilters = () => {
    setQuery('');
    setSkill('All');
    setAssignment('All');
  };

  const askDelete = (v) =>
    ask({
      title: `Remove ${v.name}?`,
      message: <p>The volunteer record and any camp assignment will be deleted.</p>,
      confirmLabel: 'Remove volunteer',
      onConfirm: () => run(() => api.volunteers.remove(v.id), { success: `${v.name} removed.` }),
    });

  return (
    <>
      <PageHeader
        title="Volunteers"
        description={`${deployed} of ${volunteers.length} deployed. Each volunteer holds at most one camp assignment; Closed camps cannot receive volunteers.`}
        actions={admin && <Button icon="plus" onClick={() => setModal('new')}>Register volunteer</Button>}
      />
      <Card bodyClassName="p-0">
        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, skill or camp" label="Search volunteers" />
          <FilterChips
            label="Filter by skill"
            options={[{ value: 'All', label: 'All skills' }, ...SKILLS.map((s) => ({ value: s, label: s, count: volunteers.filter((v) => v.skill === s).length }))]}
            value={skill}
            onChange={setSkill}
          />
          <FilterChips label="Filter by assignment" options={['All', 'Assigned', 'Unassigned']} value={assignment} onChange={setAssignment} />
        </Toolbar>
        {filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title={volunteers.length ? 'No volunteers match these filters' : 'No volunteers registered'}
            action={filtering && <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <Table
            caption="Volunteers"
            sort={sort}
            onSort={onSort}
            head={[
              { label: 'Name', className: 'min-w-40', sortKey: 'name' },
              { label: 'Skill', sortKey: 'skill' },
              { label: 'Assignment', className: 'min-w-48', sortKey: 'camp' },
              ...(admin ? [{ label: 'Actions', sr: true }] : []),
            ]}
          >
            {rows.map((v) => {
              const camp = findById(camps, v.camp_id);
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{v.name}</Td>
                  <Td>
                    <SkillBadge skill={v.skill} />
                  </Td>
                  <Td>
                    {camp ? (
                      <Link to={`/camps/${camp.id}`} className="text-slate-900 hover:text-brand-700 hover:underline">
                        {camp.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </Td>
                  {admin && (
                    <Td className="whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="subtle" onClick={() => setAssigning(v)}>
                          {camp ? 'Reassign' : 'Assign'}
                        </Button>
                        {camp && (
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => api.volunteers.assign(v.id, null), { success: `${v.name} unassigned.` })}>
                            Unassign
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon="pencil" onClick={() => setModal(v)} aria-label={`Edit ${v.name}`} />
                        <Button size="sm" variant="ghost" icon="trash" onClick={() => askDelete(v)} aria-label={`Remove ${v.name}`} className="hover:text-red-600" />
                      </div>
                    </Td>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
        <ListFooter shown={filtered.length} total={volunteers.length} noun="volunteers" onClear={filtering ? clearFilters : undefined}>
          One assignment per volunteer · Closed camps can't receive volunteers
        </ListFooter>
      </Card>

      <Modal open={!!modal} title={modal === 'new' ? 'Register volunteer' : `Edit ${modal?.name ?? ''}`} onClose={() => setModal(null)}>
        {modal && <VolunteerForm volunteer={modal === 'new' ? null : modal} onDone={() => setModal(null)} onCancel={() => setModal(null)} />}
      </Modal>
      <Modal open={!!assigning} title={`Assign ${assigning?.name ?? ''}`} onClose={() => setAssigning(null)} size="sm">
        {assigning && <AssignForm volunteer={assigning} onDone={() => setAssigning(null)} onCancel={() => setAssigning(null)} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
