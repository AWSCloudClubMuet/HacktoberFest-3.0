import { useState } from "react";
import {
  CATEGORIES,
  FILTER_KEYS,
  GIG_STATUSES,
  GIG_TYPES,
  PAYMENT_TYPES,
} from "../constants";

export default function GigFilters({ values, onApply }) {
  const [draft, setDraft] = useState(values);
  const [error, setError] = useState("");

  const apply = (next) => {
    const min = next.min_budget;
    const max = next.max_budget;
    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
      setError("Budget cannot be negative");
      return;
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setError("Min budget cannot be greater than max budget");
      return;
    }
    setError("");
    onApply(next);
  };

  const handleText = (e) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  // dropdowns apply immediately
  const handleSelect = (e) => {
    const next = { ...draft, [e.target.name]: e.target.value };
    setDraft(next);
    apply(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    apply(draft);
  };

  const handleClear = () => {
    const empty = {};
    FILTER_KEYS.forEach((key) => {
      empty[key] = "";
    });
    setDraft(empty);
    setError("");
    onApply(empty);
  };

  return (
    <form className="card filters" onSubmit={handleSubmit}>
      <div className="search-row">
        <input
          type="search"
          name="q"
          value={draft.q}
          onChange={handleText}
          placeholder="Search title or description..."
          maxLength={100}
        />
        <button className="btn" type="submit">
          Search
        </button>
      </div>

      <div className="filter-grid">
        <label className="field">
          <span className="field-label">Category</span>
          <select
            name="category"
            value={draft.category}
            onChange={handleSelect}
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Offering / Requesting</span>
          <select name="type" value={draft.type} onChange={handleSelect}>
            <option value="">All</option>
            {GIG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Payment</span>
          <select
            name="payment_type"
            value={draft.payment_type}
            onChange={handleSelect}
          >
            <option value="">All</option>
            {PAYMENT_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select name="status" value={draft.status} onChange={handleSelect}>
            <option value="">All</option>
            {GIG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Min budget</span>
          <input
            type="number"
            name="min_budget"
            min="0"
            value={draft.min_budget}
            onChange={handleText}
          />
        </label>

        <label className="field">
          <span className="field-label">Max budget</span>
          <input
            type="number"
            name="max_budget"
            min="0"
            value={draft.max_budget}
            onChange={handleText}
          />
        </label>
      </div>

      <p className="muted small">
        Budget filters show Paid gigs only. Press Enter or Search to apply text
        and budget.
      </p>
      {error && <p className="error-text">{error}</p>}

      <button
        type="button"
        className="btn btn-outline btn-small"
        onClick={handleClear}
      >
        Clear filters
      </button>
    </form>
  );
}
