export default function Badge({ value }) {
  return <span className={`badge b-${String(value).replace(/\s/g, '').toLowerCase()}`}>{value}</span>;
}
