// Write operations. Each one runs inside store.transaction(), receives the draft data (`db`),
// the acting user and the current time, and either changes the draft or throws an ApiError.
// The rules themselves live in shared/rules.js; this file applies them to the data.

import {
  GIG_STATUS, GIG_STATUSES, APPLICATION_STATUS, PAYMENT_TYPES,
} from '../shared/constants.js';
import {
  validateGig, validateApplication, validateReview, validateProfile, canonical, parseDeadline,
} from '../shared/validation.js';
import {
  checkCanApply, checkDecision, checkStatusChange, checkCanEdit, checkCanReview,
} from '../shared/rules.js';
import { ApiError, enforce, notFound, validOrThrow } from './errors.js';

const { PENDING, ACCEPTED, REJECTED } = APPLICATION_STATUS;

const EDITABLE_GIG_FIELDS = ['title', 'description', 'type', 'category', 'payment_type', 'budget', 'deadline'];
const SYSTEM_GIG_FIELDS = ['id', 'user_id', 'accepted_applicant_id', 'created_at', 'updated_at', 'completed_at'];

/** Readable, stable ids: the next id after g28 is g29. */
export function nextId(items, prefix) {
  const highest = items.reduce((max, item) => {
    const n = Number(String(item.id).slice(prefix.length));
    return Number.isInteger(n) && n > max ? n : max;
  }, 0);
  return `${prefix}${highest + 1}`;
}

export function findOr404(items, id, label) {
  const item = items.find((i) => i.id === id);
  if (!item) throw notFound(label, id);
  return item;
}

function rejectOtherPending(db, gigId, timestamp, keepId = null) {
  const rejected = [];
  for (const application of db.applications) {
    if (application.gig_id === gigId && application.status === PENDING && application.id !== keepId) {
      application.status = REJECTED;
      application.updated_at = timestamp;
      rejected.push(application.id);
    }
  }
  return rejected;
}

function mustActAsSelf(input, field, actor, what) {
  if (field in input && input[field] !== actor.id) {
    throw new ApiError('FORBIDDEN', `You can only ${what} as yourself (${field} must be "${actor.id}").`);
  }
}

// ---------------------------------------------------------------- gigs

export function createGig(db, actor, input, now) {
  mustActAsSelf(input, 'user_id', actor, 'post gigs');
  const value = validOrThrow(validateGig(input, { now }));
  const timestamp = new Date(now).toISOString();
  const gig = {
    id: nextId(db.gigs, 'g'),
    user_id: actor.id,
    ...value,
    status: GIG_STATUS.OPEN,
    accepted_applicant_id: null,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: null,
  };
  db.gigs.push(gig);
  return gig;
}

/** PATCH /gigs/:id either changes the status or edits the details, never both at once. */
export function updateGig(db, actor, gigId, patch, now) {
  const gig = findOr404(db.gigs, gigId, 'Gig');
  if (gig.user_id !== actor.id) throw new ApiError('NOT_OWNER', 'Only the gig owner can change this gig.');

  const systemFields = SYSTEM_GIG_FIELDS.filter((field) => field in patch);
  if (systemFields.length > 0) {
    throw new ApiError(
      'VALIDATION_ERROR',
      `These fields are managed by CampusConnect and can't be set directly: ${systemFields.join(', ')}.`,
      Object.fromEntries(systemFields.map((field) => [field, 'This field cannot be changed directly.'])),
    );
  }
  const editFields = EDITABLE_GIG_FIELDS.filter((field) => field in patch);
  const changesStatus = 'status' in patch;
  if (!changesStatus && editFields.length === 0) {
    throw new ApiError('VALIDATION_ERROR', 'Nothing to update. Send a new status or the gig details to change.');
  }
  if (changesStatus && editFields.length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Change the status and the gig details in separate requests.');
  }

  const timestamp = new Date(now).toISOString();

  if (changesStatus) {
    const nextStatus = canonical(patch.status, GIG_STATUSES);
    if (!nextStatus) {
      const message = `status must be one of: ${GIG_STATUSES.join(', ')}.`;
      throw new ApiError('VALIDATION_ERROR', message, { status: message });
    }
    enforce(checkStatusChange({ gig, userId: actor.id, nextStatus, now }));
    gig.status = nextStatus;
    gig.updated_at = timestamp;
    if (nextStatus === GIG_STATUS.COMPLETED) gig.completed_at = timestamp;
    // Cancelling closes the gig, so anyone still waiting gets a final answer.
    const autoRejected = nextStatus === GIG_STATUS.CANCELLED ? rejectOtherPending(db, gig.id, timestamp) : [];
    return { gig, auto_rejected_ids: autoRejected };
  }

  enforce(checkCanEdit({ gig, userId: actor.id }));
  const merged = { ...gig };
  for (const field of editFields) merged[field] = patch[field];
  // Switching a Paid gig to Skill Swap/Free drops its budget unless the client sent one.
  if ('payment_type' in patch && !('budget' in patch) && canonical(patch.payment_type, PAYMENT_TYPES) !== 'Paid') {
    merged.budget = null;
  }
  // Only re-check the deadline when it actually changes (so a near deadline doesn't block a typo fix).
  const newDeadline = 'deadline' in patch ? parseDeadline(patch.deadline) : null;
  const deadlineChanged = 'deadline' in patch && newDeadline?.getTime() !== new Date(gig.deadline).getTime();
  const value = validOrThrow(validateGig(merged, { now, checkDeadline: deadlineChanged }));
  Object.assign(gig, value, { updated_at: timestamp });
  return { gig, auto_rejected_ids: [] };
}

// ---------------------------------------------------------------- applications

export function applyToGig(db, actor, input, now) {
  mustActAsSelf(input, 'applicant_id', actor, 'apply');
  const value = validOrThrow(validateApplication(input));
  const gig = findOr404(db.gigs, value.gig_id, 'Gig');
  enforce(checkCanApply({ gig, userId: actor.id, applications: db.applications, now }));
  const timestamp = new Date(now).toISOString();
  const application = {
    id: nextId(db.applications, 'a'),
    gig_id: gig.id,
    applicant_id: actor.id,
    message: value.message,
    status: PENDING,
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.applications.push(application);
  return application;
}

/**
 * Accepting is one atomic step: the application becomes Accepted, the gig moves to
 * In Progress with that applicant, and every other Pending application is Rejected.
 */
export function decideApplication(db, actor, applicationId, input, now) {
  const application = findOr404(db.applications, applicationId, 'Application');
  const gig = findOr404(db.gigs, application.gig_id, 'Gig');
  const decision = canonical(input.status, [ACCEPTED, REJECTED]);
  if (!decision) {
    const message = 'status must be Accepted or Rejected.';
    throw new ApiError('VALIDATION_ERROR', message, { status: message });
  }
  enforce(checkDecision({ gig, application, userId: actor.id, decision, now }));

  const timestamp = new Date(now).toISOString();
  application.status = decision;
  application.updated_at = timestamp;
  let autoRejected = [];
  if (decision === ACCEPTED) {
    gig.status = GIG_STATUS.IN_PROGRESS;
    gig.accepted_applicant_id = application.applicant_id;
    gig.updated_at = timestamp;
    autoRejected = rejectOtherPending(db, gig.id, timestamp, application.id);
  }
  return { application, gig, auto_rejected_ids: autoRejected };
}

// ---------------------------------------------------------------- reviews

export function createReview(db, actor, input, now) {
  mustActAsSelf(input, 'reviewer_id', actor, 'write reviews');
  const value = validOrThrow(validateReview(input));
  const gig = findOr404(db.gigs, value.gig_id, 'Gig');
  const { revieweeId } = enforce(checkCanReview({ gig, userId: actor.id, reviews: db.reviews }));
  if ('reviewee_id' in input && input.reviewee_id !== revieweeId) {
    const message = `You can only review the other person on this gig (${revieweeId}).`;
    throw new ApiError('VALIDATION_ERROR', message, { reviewee_id: message });
  }
  const review = {
    id: nextId(db.reviews, 'r'),
    gig_id: gig.id,
    reviewer_id: actor.id,
    reviewee_id: revieweeId,
    rating: value.rating,
    comment: value.comment,
    created_at: new Date(now).toISOString(),
  };
  db.reviews.push(review);
  return review;
}

// ---------------------------------------------------------------- profiles

export function updateProfile(db, actor, userId, patch) {
  const user = findOr404(db.users, userId, 'User');
  if (user.id !== actor.id) throw new ApiError('FORBIDDEN', 'You can only edit your own profile.');
  const value = validOrThrow(validateProfile(patch));
  if (Object.keys(value).length === 0) {
    throw new ApiError('VALIDATION_ERROR', 'Nothing to update. Editable fields: name, major, semester, bio, skills.');
  }
  Object.assign(user, value);
  return user;
}
