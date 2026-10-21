export default function FormField({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="muted small">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </label>
  );
}
