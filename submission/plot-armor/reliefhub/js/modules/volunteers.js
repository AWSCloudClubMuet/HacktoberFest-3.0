/* MODULE: Volunteers (Milestone 4, part B) — OWNER: Syeda Anusha Ali (@SyedaAnushaAli)
 *
 * Rules from the issue:
 *  - Register volunteers: name + skill. Skills are exactly:
 *    Medical, Logistics, Cooking, Driving, Counselling.
 *  - Search by name and filter by skill.
 *  - Assign / unassign volunteers to camps:
 *      * A volunteer may hold only ONE assignment at a time (camp_id is single).
 *      * Cannot be assigned to a Closed camp (validate against camp status).
 *  - Show assigned camp name in the list; badge or icon for assigned/available.
 *  - Coordinator-only mutations (App.canEdit()); volunteers read-only.
 */
(() => {
  if (!document.getElementById('anusha-css')) {
    const link = document.createElement('link');
    link.id = 'anusha-css';
    link.rel = 'stylesheet';
    link.href = 'js/modules/anusha.css';
    document.head.append(link);
  }

  const SKILLS = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
  let searchQuery = '';
  let skillFilter = 'All';

  const mod = {
    id: 'volunteers', title: 'Volunteers', icon: '🤝', order: 6,
    subtitle: 'Skills registry and camp assignments',

    async render() {
      const [volunteers, camps] = await Promise.all([
        API.list('volunteers'), API.list('camps'),
      ]);
      const campById = Object.fromEntries(camps.map(c => [c.id, c]));

      const root = UI.h('div');

      /* live search + skill filter (no full re-render, keeps input focus) */
      const searchInput = UI.h('input', { type: 'text', placeholder: 'Search by name…', value: searchQuery });
      const skillSelect = UI.h('select', {}, ['All', ...SKILLS].map(s => {
        const opt = UI.h('option', { value: s }, s === 'All' ? 'All Skills' : s);
        opt.selected = s === skillFilter;
        return opt;
      }));
      const tableBox = UI.h('div');

      function visibleRows() {
        const q = searchQuery.trim().toLowerCase();
        return volunteers
          .filter(v => (!q || v.name.toLowerCase().includes(q)))
          .filter(v => skillFilter === 'All' || v.skill === skillFilter)
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));
      }

      function drawTable() {
        tableBox.innerHTML = '';
        const rows = visibleRows();
        const columns = [
          { label: 'Name', render: v => UI.h('strong', {}, v.name) },
          { label: 'Skill', render: v => UI.badge(v.skill, 'info') },
          { label: 'Assigned Camp', render: v => {
              const camp = campById[v.camp_id];
              if (!camp) return UI.h('span', { class: 'muted' }, '—');
              return camp.name + (camp.status === 'Closed' ? ' (Closed)' : '');
            } },
          { label: 'Status', render: v => v.camp_id != null
              ? UI.badge('Assigned', 'ok')
              : UI.badge('Available', 'muted') },
        ];
        if (App.canEdit()) {
          columns.push({ label: 'Actions', render: v => UI.h('span', { class: 'row-actions' }, [
            UI.h('button', { class: 'btn btn-sm btn-primary', onclick: () => mod.openAssign(v) },
              v.camp_id != null ? 'Reassign' : 'Assign'),
            v.camp_id != null
              ? UI.h('button', { class: 'btn btn-sm btn-danger', onclick: () => mod.unassign(v) }, 'Unassign')
              : null,
          ]) });
        }
        tableBox.append(UI.h('div', { class: 'panel' }, [
          UI.h('h3', {}, `Volunteers (${rows.length})`),
          UI.table(columns, rows, 'No volunteers match your search.'),
        ]));
      }

      searchInput.addEventListener('input', () => { searchQuery = searchInput.value; drawTable(); });
      skillSelect.addEventListener('change', () => { skillFilter = skillSelect.value; drawTable(); });
      drawTable();

      root.append(UI.h('div', { class: 'toolbar' }, [
        searchInput,
        skillSelect,
        App.canEdit()
          ? UI.h('button', { class: 'btn btn-primary', onclick: () => mod.openRegister() }, '+ Register Volunteer')
          : null,
      ]));
      root.append(tableBox);

      return root;
    },

    /* ---------- register: name + one of the five fixed skills ---------- */
    openRegister() {
      const form = UI.form([
        { name: 'name', label: 'Full Name', placeholder: 'e.g. Ayesha Siddiqui' },
        { name: 'skill', label: 'Skill', options: SKILLS },
      ]);
      const { close } = UI.modal('Register Volunteer', UI.h('div', {}, [
        form.el,
        UI.h('div', { class: 'form-actions' }, [
          UI.h('button', { class: 'btn btn-ghost', onclick: () => close() }, 'Cancel'),
          UI.h('button', { class: 'btn btn-primary', onclick: async () => {
              const values = form.getValues();
              if (!values) return;
              try {
                await API.create('volunteers', { name: values.name, skill: values.skill, camp_id: null });
                UI.toast(`${values.name} registered as a ${values.skill} volunteer`, 'success');
                close();
                App.render();
              } catch (err) {
                UI.toast('Could not register volunteer: ' + err.message, 'error');
              }
            } }, 'Register'),
        ]),
      ]));
    },
  };

  App.registerModule(mod);
})();
