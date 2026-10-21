import { ApiError } from "./api";

// "2026-11-15" -> "15 Nov 2026" (no timezone shifting)
export function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// today as "YYYY-MM-DD" in the user's local time
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function paymentLabel(value) {
  return value === "SkillSwap" ? "Skill Swap" : value;
}

// Turns any error into { fieldErrors, formError } for forms
export function describeError(err) {
  if (err instanceof ApiError) {
    const hasField = Object.keys(err.fieldErrors).length > 0;
    let formError = err.generalErrors.join(" ");
    if (!formError) {
      formError = hasField ? "Please fix the highlighted fields." : err.message;
    }
    return { fieldErrors: err.fieldErrors, formError };
  }
  return {
    fieldErrors: {},
    formError: "Something went wrong. Please try again.",
  };
}

// "2026-10-21T06:12:00Z" -> "21 Oct 2026, 11:12 am" (in the user's local time)
export function formatDateTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
