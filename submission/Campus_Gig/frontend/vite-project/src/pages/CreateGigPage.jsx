import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import FormField from "../components/FormField";
import { CATEGORIES, GIG_TYPES, PAYMENT_TYPES } from "../constants";
import { describeError, todayString } from "../utils";
import "../styles/CreateGigPage.css";

export default function CreateGigPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: "",
    deadline: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "payment_type" && value !== "Paid") {
        next.budget = "";
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const title = form.title.trim();
    const description = form.description.trim();
    const isPaid = form.payment_type === "Paid";
    const budget = Number(form.budget);
    const clientErrors = {};

    if (title.length < 5 || title.length > 120) {
      clientErrors.title = "Title must be 5 to 120 characters";
    }

    if (description.length < 10 || description.length > 2000) {
      clientErrors.description = "Description must be 10 to 2000 characters";
    }

    if (isPaid && (!form.budget || !Number.isFinite(budget) || budget <= 0)) {
      clientErrors.budget = "Enter a budget greater than 0 for a Paid gig";
    }

    if (!form.deadline) {
      clientErrors.deadline = "Choose a deadline";
    } else if (form.deadline < todayString()) {
      clientErrors.deadline = "Deadline cannot be in the past";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      title,
      description,
      type: form.type,
      category: form.category,
      payment_type: form.payment_type,
      budget: isPaid ? budget : null,
      deadline: form.deadline,
    };

    setSaving(true);

    try {
      const gig = await api.createGig(payload);
      navigate(`/gigs/${gig.id}`);
    } catch (err) {
      const result = describeError(err);
      setErrors(result.fieldErrors);
      setFormError(result.formError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-gig-page">
      <header className="create-gig-hero">
        <div className="create-gig-hero-copy">
          <span className="create-gig-eyebrow">
            <span className="create-gig-eyebrow-dot" />
            CAMPUS GIG MARKETPLACE
          </span>

          <h1>
            Post a gig.
            <br />
            <span>Open a door.</span>
          </h1>

          <p>
            Share a skill, find the right help, or exchange knowledge with
            students who are ready to collaborate.
          </p>

          <div className="create-gig-hero-tags">
            <span>Paid work</span>
            <span>Skill swaps</span>
            <span>Free help</span>
          </div>
        </div>

        <div className="create-gig-hero-art" aria-hidden="true">
          <div className="create-gig-art-ring create-gig-art-ring-outer" />
          <div className="create-gig-art-ring create-gig-art-ring-inner" />
          <div className="create-gig-art-center">+</div>
          <span className="create-gig-art-bubble create-gig-art-bubble-one">
            ✦
          </span>
          <span className="create-gig-art-bubble create-gig-art-bubble-two">
            ↗
          </span>
        </div>
      </header>

      <div className="create-gig-layout">
        <section className="create-gig-panel">
          <div className="create-gig-panel-heading">
            <div>
              <span className="create-gig-section-kicker">NEW OPPORTUNITY</span>
              <h2>Gig details</h2>
              <p>Give students everything they need to get started.</p>
            </div>

            <span className="create-gig-required-note">* Required fields</span>
          </div>

          <form className="create-gig-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="create-gig-error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{formError}</p>
              </div>
            )}

            <FormField label="Gig title *" error={errors.title}>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g. Need help fixing my React project"
                aria-invalid={Boolean(errors.title)}
                required
              />
              <span className="create-gig-field-meta">
                Keep it clear and specific
              </span>
            </FormField>

            <FormField
              label="Description *"
              error={errors.description}
              hint="Explain the task, expected outcome and any useful details."
            >
              <textarea
                name="description"
                rows={5}
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                placeholder="Describe what you need or what you can offer..."
                aria-invalid={Boolean(errors.description)}
                required
              />
              <span className="create-gig-character-count">
                {form.description.length}/2000 characters
              </span>
            </FormField>

            <div className="create-gig-fields-2">
              <FormField
                label="Gig type *"
                error={errors.type}
                hint="Are you offering a skill or requesting help?"
              >
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  {GIG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Category *" error={errors.category}>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="create-gig-fields-2">
              <FormField
                label="Payment arrangement *"
                error={errors.payment_type}
                hint="Choose how the collaboration will work."
              >
                <select
                  name="payment_type"
                  value={form.payment_type}
                  onChange={handleChange}
                  required
                >
                  {PAYMENT_TYPES.map((payment) => (
                    <option key={payment.value} value={payment.value}>
                      {payment.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {form.payment_type === "Paid" ? (
                <FormField
                  label="Budget *"
                  error={errors.budget}
                  hint="Enter the amount for the entire gig."
                >
                  <input
                    type="number"
                    name="budget"
                    min="0.01"
                    step="0.01"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    aria-invalid={Boolean(errors.budget)}
                    required
                  />
                </FormField>
              ) : (
                <div className="create-gig-payment-note">
                  <span className="create-gig-payment-icon" aria-hidden="true">
                    {form.payment_type === "Free" ? "♡" : "⇄"}
                  </span>
                  <div>
                    <strong>
                      {form.payment_type === "Free"
                        ? "No payment required"
                        : "Exchange skills"}
                    </strong>
                    <p>
                      {form.payment_type === "Free"
                        ? "This gig is offered without a budget."
                        : "Agree on the skills each person will contribute."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <FormField
              label="Deadline *"
              error={errors.deadline}
              hint="Choose the latest date for completing this gig."
            >
              <input
                type="date"
                name="deadline"
                min={todayString()}
                value={form.deadline}
                onChange={handleChange}
                aria-invalid={Boolean(errors.deadline)}
                required
              />
            </FormField>

            <div className="create-gig-form-footer">
              <p>
                <span aria-hidden="true">✦</span>
                Review your details before publishing.
              </p>

              <div className="create-gig-form-actions">
                <Link to="/" className="create-gig-cancel-button">
                  Cancel
                </Link>

                <button
                  className="create-gig-submit-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="create-gig-button-spinner" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish gig <span aria-hidden="true">↗</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="create-gig-sidebar">
          <div className="create-gig-tips-card">
            <div className="create-gig-tips-icon" aria-hidden="true">
              ✦
            </div>
            <span className="create-gig-section-kicker">A LITTLE GUIDANCE</span>
            <h3>Great gigs start with clarity.</h3>
            <p>
              A thoughtful post helps the right students understand what you
              need and how they can contribute.
            </p>

            <div className="create-gig-tip">
              <span>01</span>
              <div>
                <strong>Write a useful title</strong>
                <p>Say what the task is about in a few words.</p>
              </div>
            </div>

            <div className="create-gig-tip">
              <span>02</span>
              <div>
                <strong>Explain the details</strong>
                <p>Include the deliverable, expectations and scope.</p>
              </div>
            </div>

            <div className="create-gig-tip">
              <span>03</span>
              <div>
                <strong>Set a realistic deadline</strong>
                <p>Give students enough time to do their best work.</p>
              </div>
            </div>
          </div>

          <div className="create-gig-trust-card">
            <span className="create-gig-trust-mark" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>Made for student collaboration</strong>
              <p>
                Start with clear expectations and treat every collaboration with
                respect.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
