import { useState } from "react";
import { api } from "../api";
import { describeError } from "../utils";
import FormField from "./FormField";

export default function ApplyForm({ gigId, onApplied }) {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const text = message.trim();
    if (text.length < 5 || text.length > 500) {
      setErrors({ message: "Message must be 5 to 500 characters" });
      return;
    }

    setSaving(true);
    try {
      const application = await api.createApplication({
        gig_id: gigId,
        message: text,
      });
      onApplied(application);
    } catch (err) {
      const result = describeError(err);
      setErrors(result.fieldErrors);
      setFormError(result.formError);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3>Apply for this gig</h3>
      {formError && <div className="alert">{formError}</div>}
      <FormField label="Your message" error={errors.message}>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          placeholder="Tell the poster why you are a good fit..."
        />
      </FormField>
      <div className="muted small counter">{message.length}/500</div>
      <button className="btn" type="submit" disabled={saving}>
        {saving ? "Sending..." : "Send application"}
      </button>
    </form>
  );
}
