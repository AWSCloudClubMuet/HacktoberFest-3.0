export function Stars({ value = 0 }) {
  return (
    <span className="stars" aria-label={`${value} / 5`} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, label }) {
  return (
    <div className="stars input" role="radiogroup" aria-label={label} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
