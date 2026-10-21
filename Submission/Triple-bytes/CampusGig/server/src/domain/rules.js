export function todayIso(clock = () => new Date()) {
  const timeZone = process.env.APP_TIME_ZONE || "Asia/Karachi";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(clock());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function effectiveGigStatus(gig, today = todayIso()) {
  if (gig.status === "Open" && gig.deadline < today) return "Expired";
  return gig.status;
}

export function withEffectiveStatus(gig, today = todayIso()) {
  return { ...gig, status: effectiveGigStatus(gig, today) };
}

export function isAllowedGigTransition(from, to) {
  return (from === "In Progress" && to === "Completed") ||
    (from === "Open" && to === "Cancelled");
}

export function deriveReviewee(gig, reviewerId) {
  if (reviewerId === gig.user_id) return gig.accepted_applicant_id;
  if (reviewerId === gig.accepted_applicant_id) return gig.user_id;
  return null;
}

export function roundRating(value) {
  if (value == null) return null;
  return Math.round(Number(value) * 10) / 10;
}
