import { useState } from "react";
import FormField from "./FormField";
import { describeError } from "../utils";

export default function ProfileForm({ initial, submitLabel, onSubmit }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    major: initial?.major ?? "",
    semester: initial?.semester ? String(initial.semester) : "",
    bio: initial?.bio ?? "",
    skills: initial?.skills ? initial.skills.join(", ") : "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const semester = Number(form.semester);
    const clientErrors = {};
    if (form.name.trim().length < 2)
      clientErrors.name = "Name must be at least 2 characters";
    if (form.major.trim().length < 2)
      clientErrors.major = "Major must be at least 2 characters";
    if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
      clientErrors.semester = "Semester must be a whole number from 1 to 12";
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      major: form.major.trim(),
      semester,
      bio: form.bio.trim(),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const result = describeError(err);
      setErrors(result.fieldErrors);
      setFormError(result.formError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert">{formError}</div>}

      <FormField label="Full name" error={errors.name}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={100}
        />
      </FormField>

      <div className="row">
        <FormField label="Major" error={errors.major}>
          <input
            name="major"
            value={form.major}
            onChange={handleChange}
            maxLength={100}
          />
        </FormField>
        <FormField label="Semester" error={errors.semester}>
          <input
            type="number"
            name="semester"
            min="1"
            max="12"
            value={form.semester}
            onChange={handleChange}
          />
        </FormField>
      </div>

      <FormField label="Bio (optional)" error={errors.bio}>
        <textarea
          name="bio"
          rows={3}
          value={form.bio}
          onChange={handleChange}
          maxLength={500}
        />
      </FormField>

      <FormField
        label="Skills"
        error={errors.skills}
        hint="Separate with commas, for example: React, Django, UI Design"
      >
        <input name="skills" value={form.skills} onChange={handleChange} />
      </FormField>

      <button className="btn" type="submit" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
