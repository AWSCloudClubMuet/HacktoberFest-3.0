export default function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status.replace(/\s+/g, "-")}`}>
      {status}
    </span>
  );
}
