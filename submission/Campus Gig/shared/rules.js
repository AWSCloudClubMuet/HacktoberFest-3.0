// Business rules as pure functions: no database, no HTTP, so they are easy to test and
// the API and UI can never disagree. "check*" functions return { ok: true } or
// { ok: false, code, message }; the API turns a failed check into an HTTP error.

import { GIG_STATUS, APPLICATION_STATUS } from './constants.js';

const { OPEN, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED } = GIG_STATUS;
const ALLOW = Object.freeze({ ok: true });
const deny = (code, message) => ({ ok: false, code, message });

// ---------------------------------------------------------------- lifecycle

/**
 * Lifecycle of a gig. "In Progress" is only reachable by accepting an applicant, and
 * "Expired" is never stored: an Open gig whose deadline has passed simply reads as Expired.
 */
export const STATUS_TRANSITIONS = {
  [OPEN]: [IN_PROGRESS, CANCELLED],
  [EXPIRED]: [CANCELLED],
  [IN_PROGRESS]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

export function isPastDeadline(gig, now = Date.now()) {
  return new Date(gig.deadline).getTime() < now;
}

export function effectiveStatus(gig, now = Date.now()) {
  return gig.status === OPEN && isPastDeadline(gig, now) ? EXPIRED : gig.status;
}

function closedReason(status) {
  switch (status) {
    case EXPIRED: return "This gig's deadline has passed, so it no longer accepts applications.";
    case IN_PROGRESS: return 'This gig already has an accepted applicant and is closed to new applications.';
    case COMPLETED: return 'This gig has been completed.';
    case CANCELLED: return 'This gig was cancelled by its owner.';
    default: return `This gig is ${status}.`;
  }
}

/** Status changes the owner may make directly (PATCH /gigs/:id). */
export function manualTransitions(gig, now = Date.now()) {
  return STATUS_TRANSITIONS[effectiveStatus(gig, now)].filter((s) => s !== IN_PROGRESS);
}

export function checkStatusChange({ gig, userId, nextStatus, now = Date.now() }) {
  if (gig.user_id !== userId) return deny('NOT_OWNER', 'Only the gig owner can change its status.');
  const current = effectiveStatus(gig, now);
  if (nextStatus === current) return deny('INVALID_TRANSITION', `This gig is already ${current}.`);
  if (nextStatus === EXPIRED) return deny('INVALID_TRANSITION', 'Gigs expire automatically when their deadline passes.');
  if (nextStatus === IN_PROGRESS) {
    return deny('INVALID_TRANSITION', 'Accept an applicant to start this gig. Accepting moves it to In Progress.');
  }
  if (nextStatus === COMPLETED && current !== IN_PROGRESS) {
    return deny('INVALID_TRANSITION', `Only In Progress gigs can be completed. This gig is ${current}.`);
  }
  if (!STATUS_TRANSITIONS[current].includes(nextStatus)) {
    return deny('INVALID_TRANSITION', `A ${current} gig cannot be changed to ${nextStatus}.`);
  }
  return ALLOW;
}

/** Details (title, budget, deadline...) can be edited while the gig is Open or Expired. */
export function checkCanEdit({ gig, userId }) {
  if (gig.user_id !== userId) return deny('NOT_OWNER', 'Only the gig owner can edit this gig.');
  if (gig.status !== OPEN) return deny('INVALID_TRANSITION', `Only open gigs can be edited. This gig is ${gig.status}.`);
  return ALLOW;
}

// ---------------------------------------------------------------- applications

export function checkCanApply({ gig, userId, applications, now = Date.now() }) {
  if (gig.user_id === userId) return deny('OWN_GIG', "You can't apply to your own gig.");
  const existing = applications.find((a) => a.gig_id === gig.id && a.applicant_id === userId);
  if (existing) {
    return deny('DUPLICATE_APPLICATION', `You already applied to this gig (status: ${existing.status}).`);
  }
  const status = effectiveStatus(gig, now);
  if (status !== OPEN) return deny('GIG_CLOSED', closedReason(status));
  return ALLOW;
}

/** The owner accepts or rejects a Pending application. */
export function checkDecision({ gig, application, userId, decision, now = Date.now() }) {
  if (gig.user_id !== userId) return deny('NOT_OWNER', 'Only the gig owner can accept or reject applicants.');
  if (application.status !== APPLICATION_STATUS.PENDING) {
    return deny('INVALID_TRANSITION', `This application was already ${application.status.toLowerCase()}.`);
  }
  if (decision === APPLICATION_STATUS.ACCEPTED) {
    const status = effectiveStatus(gig, now);
    if (status === EXPIRED) {
      return deny('GIG_CLOSED', 'This gig has expired. Extend its deadline to reopen it before accepting someone.');
    }
    if (status !== OPEN || gig.accepted_applicant_id) {
      return deny('GIG_CLOSED', `This gig is ${status}, so no other applicant can be accepted.`);
    }
  }
  return ALLOW;
}

// ---------------------------------------------------------------- reviews

/** On success also returns who is being reviewed: the other side of the gig. */
export function checkCanReview({ gig, userId, reviews }) {
  const isOwner = gig.user_id === userId;
  const isWorker = Boolean(gig.accepted_applicant_id) && gig.accepted_applicant_id === userId;
  if (!isOwner && !isWorker) {
    return deny('NOT_PARTICIPANT', 'Only the gig owner and the accepted applicant can review this gig.');
  }
  if (gig.status !== COMPLETED) return deny('GIG_NOT_COMPLETED', 'Reviews open once the gig is marked Completed.');
  if (reviews.some((r) => r.gig_id === gig.id && r.reviewer_id === userId)) {
    return deny('ALREADY_REVIEWED', 'You have already reviewed this gig.');
  }
  return { ok: true, revieweeId: isOwner ? gig.accepted_applicant_id : gig.user_id };
}

// ---------------------------------------------------------------- reputation

/** Average rating is always calculated from stored reviews, never stored on the user. */
export function ratingSummary(userId, reviews) {
  const received = reviews.filter((r) => r.reviewee_id === userId);
  if (received.length === 0) return { average_rating: null, review_count: 0 };
  const total = received.reduce((sum, r) => sum + r.rating, 0);
  return { average_rating: Math.round((total / received.length) * 10) / 10, review_count: received.length };
}

export function userStats(userId, { gigs, reviews }) {
  const posted = gigs.filter((g) => g.user_id === userId);
  const completed = gigs.filter(
    (g) => g.status === COMPLETED && (g.user_id === userId || g.accepted_applicant_id === userId),
  );
  return { gigs_posted: posted.length, gigs_completed: completed.length, ...ratingSummary(userId, reviews) };
}

// ---------------------------------------------------------------- discovery

/** Every search word must appear in the title or description ("react tutor" finds both words). */
export function matchesSearch(gig, q) {
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${gig.title} ${gig.description}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * Applies the GET /gigs filters. A budget range only matches Paid gigs, because
 * Skill Swap and Free gigs have no budget to compare.
 */
export function filterGigs(gigs, filters = {}, now = Date.now()) {
  const { q, category, type, payment_type, status, user_id, min_budget, max_budget } = filters;
  const hasBudgetFilter = min_budget !== undefined || max_budget !== undefined;
  return gigs.filter((gig) => {
    if (category && gig.category !== category) return false;
    if (type && gig.type !== type) return false;
    if (payment_type && gig.payment_type !== payment_type) return false;
    if (user_id && gig.user_id !== user_id) return false;
    if (status && effectiveStatus(gig, now) !== status) return false;
    if (hasBudgetFilter) {
      if (gig.payment_type !== 'Paid' || typeof gig.budget !== 'number') return false;
      if (min_budget !== undefined && gig.budget < min_budget) return false;
      if (max_budget !== undefined && gig.budget > max_budget) return false;
    }
    return matchesSearch(gig, q);
  });
}

const byNewest = (a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id);

export function sortGigs(gigs, sort = 'newest') {
  const list = [...gigs];
  // Gigs without a budget always sort after paid ones when sorting by budget.
  const budget = (g, fallback) => (typeof g.budget === 'number' ? g.budget : fallback);
  switch (sort) {
    case 'deadline':
      return list.sort((a, b) => a.deadline.localeCompare(b.deadline) || byNewest(a, b));
    case 'budget_desc':
      return list.sort((a, b) => budget(b, -Infinity) - budget(a, -Infinity) || byNewest(a, b));
    case 'budget_asc':
      return list.sort((a, b) => budget(a, Infinity) - budget(b, Infinity) || byNewest(a, b));
    default:
      return list.sort(byNewest);
  }
}
