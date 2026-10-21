import { useState } from 'react';

// Column sorting for tables. `accessors` maps a column's sortKey to a function
// returning the value to compare. With no column chosen, rows keep the page's
// default order. Clicking the active column flips direction.
export function useSort(rows, accessors, initial = null) {
  const [sort, setSort] = useState(initial);

  const toggle = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  let sorted = rows;
  const get = sort && accessors[sort.key];
  if (get) {
    const factor = sort.dir === 'asc' ? 1 : -1;
    sorted = [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor;
      return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * factor;
    });
  }
  return { rows: sorted, sort, onSort: toggle };
}
