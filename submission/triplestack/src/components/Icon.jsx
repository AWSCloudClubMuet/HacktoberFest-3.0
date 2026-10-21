// Small inline stroke icon set (24×24 grid), so no icon library is needed.
const PATHS = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  camp: ['M3.5 21 12 4l8.5 17', 'M12 4v17', 'M8 21l4-8 4 8', 'M2 21h20'],
  needs: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 3h6v4H9z', 'M9 12h6', 'M9 16h4'],
  box: ['M21 8 12 3 3 8v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'],
  truck: ['M1 4h13v12H1z', 'M14 9h4l3 3v4h-7z', 'M5.5 19a2 2 0 1 0 0-.01', 'M17.5 19a2 2 0 1 0 0-.01'],
  heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  alert: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4', 'M12 17h.01'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  check: ['M20 6 9 17l-5-5'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  pencil: ['M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  refresh: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
  arrowRight: ['M5 12h14', 'M13 5l7 7-7 7'],
  arrowLeft: ['M19 12H5', 'M11 19l-7-7 7-7'],
  send: ['M22 2 11 13', 'M22 2l-7 20-4-9-9-4z'],
  ban: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M4.9 4.9l14.2 14.2'],
  link: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  chevronUp: ['M18 15l-6-6-6 6'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronsUpDown: ['M7 15l5 5 5-5', 'M7 9l5-5 5 5'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  compass: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z'],
};

export function Icon({ name, className = 'h-4 w-4', title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {(PATHS[name] || []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
