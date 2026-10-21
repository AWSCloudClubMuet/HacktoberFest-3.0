// Read models: how stored records are shaped for API responses. Computed values such as a
// gig's effective status (Expired) and a user's average rating are added here on every read.

import { GIG_STATUS, APPLICATION_STATUS, APPLICATION_STATUSES } from '../shared/constants.js';
import { canonical } from '../shared/validation.js';
import {
  effectiveStatus, userStats, ratingSummary, checkCanApply, checkCanReview, checkCanEdit, manualTransitions,
} from '../shared/rules.js';
import { ApiError } from './errors.js';

const { OPEN, IN_PROGRESS, COMPLETED, EXPIRED } = GIG_STATUS;
const { PENDING, ACCEPTED } = APPLICATION_STATUS;

const byId = (items, id) => items.find((item) => item.id === id) ?? null;
const newestFirst = (key) => (a, b) => (b[key] ?? '').localeCompare(a[key] ?? '') || a.id.localeCompare(b.id);

// ---------------------------------------------------------------- users

export function userSummary(user, db) {
  if (!user) return null;
  return { id: user.id, name: user.name, major: user.major, semester: user.semester, ...ratingSummary(user.id, db.reviews) };
}

export function presentUser(user, db) {
  return { ...user, ...userStats(user.id, db) };
}

/** Highest rated first; students without reviews yet come last, alphabetically. */
function byReputation(a, b) {
  return (b.average_rating ?? -1) - (a.average_rating ?? -1) || b.review_count - a.review_count || a.name.localeCompare(b.name);
}

export function listUsers(db, query = {}) {
  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';
  const users = db.users
    .filter((user) => !q || [user.name, user.major, user.bio, ...user.skills].join(' ').toLowerCase().includes(q))
    .map((user) => presentUser(user, db));
  return query.sort === 'name' ? users.sort((a, b) => a.name.localeCompare(b.name)) : users.sort(byReputation);
}

export function userProfile(user, db, now) {
  const gigsOf = (predicate) => db.gigs.filter(predicate).sort(newestFirst('created_at')).map((g) => presentGig(g, db, now));
  return {
    ...presentUser(user, db),
    posted_gigs: gigsOf((g) => g.user_id === user.id),
    working_gigs: gigsOf((g) => g.accepted_applicant_id === user.id),
    reviews_received: db.reviews
      .filter((r) => r.reviewee_id === user.id)
      .sort(newestFirst('created_at'))
      .map((r) => presentReview(r, db)),
  };
}

// ---------------------------------------------------------------- gigs

/** A compact gig for embedding inside applications, reviews and the dashboard. */
export function gigSummary(gig, db, now) {
  if (!gig) return null;
  const { id, title, type, category, payment_type, budget, deadline, user_id, accepted_applicant_id } = gig;
  return {
    id, title, type, category, payment_type, budget, deadline, user_id, accepted_applicant_id,
    status: effectiveStatus(gig, now),
    owner: userSummary(byId(db.users, user_id), db),
  };
}

export function presentGig(gig, db, now) {
  const applications = db.applications.filter((a) => a.gig_id === gig.id);
  return {
    ...gig,
    status: effectiveStatus(gig, now),
    owner: userSummary(byId(db.users, gig.user_id), db),
    application_count: applications.length,
    pending_count: applications.filter((a) => a.status === PENDING).length,
  };
}

/**
 * Full gig page. Applications are private: the owner sees all of them, an applicant
 * sees only their own. `viewer` tells the UI what the current user may do, using the
 * exact same rule functions the API enforces on writes.
 */
export function gigDetail(gig, db, viewerId, now) {
  const isOwner = Boolean(viewerId) && viewerId === gig.user_id;
  const applications = db.applications.filter((a) => a.gig_id === gig.id);
  const visible = isOwner ? applications : applications.filter((a) => a.applicant_id === viewerId);
  const mine = viewerId ? applications.find((a) => a.applicant_id === viewerId) ?? null : null;

  return {
    ...presentGig(gig, db, now),
    accepted_applicant: userSummary(byId(db.users, gig.accepted_applicant_id), db),
    applications: visible.sort(newestFirst('created_at')).map((a) => ({
      ...a,
      applicant: { ...userSummary(byId(db.users, a.applicant_id), db), skills: byId(db.users, a.applicant_id)?.skills ?? [] },
    })),
    reviews: db.reviews.filter((r) => r.gig_id === gig.id).sort(newestFirst('created_at')).map((r) => presentReview(r, db)),
    viewer: viewerId
      ? {
          user_id: viewerId,
          is_owner: isOwner,
          is_accepted_applicant: gig.accepted_applicant_id === viewerId,
          application: mine,
          can_apply: checkCanApply({ gig, userId: viewerId, applications: db.applications, now }),
          can_review: checkCanReview({ gig, userId: viewerId, reviews: db.reviews }),
          can_edit: checkCanEdit({ gig, userId: viewerId }).ok,
          status_actions: isOwner ? manualTransitions(gig, now) : [],
        }
      : null,
  };
}

// ---------------------------------------------------------------- applications

export function presentApplication(application, db, now) {
  return {
    ...application,
    applicant: userSummary(byId(db.users, application.applicant_id), db),
    gig: gigSummary(byId(db.gigs, application.gig_id), db, now),
  };
}

/** Only applications the viewer sent, or ones sent to the viewer's own gigs. */
export function listApplications(db, viewerId, query, now) {
  let status;
  if (query.status) {
    status = canonical(query.status, APPLICATION_STATUSES);
    if (!status) {
      const message = `status must be one of: ${APPLICATION_STATUSES.join(', ')}.`;
      throw new ApiError('VALIDATION_ERROR', message, { status: message });
    }
  }
  return db.applications
    .filter((a) => a.applicant_id === viewerId || byId(db.gigs, a.gig_id)?.user_id === viewerId)
    .filter((a) => !query.applicant_id || a.applicant_id === query.applicant_id)
    .filter((a) => !query.gig_id || a.gig_id === query.gig_id)
    .filter((a) => !status || a.status === status)
    .sort(newestFirst('created_at'))
    .map((a) => presentApplication(a, db, now));
}

// ---------------------------------------------------------------- reviews

export function presentReview(review, db) {
  const gig = byId(db.gigs, review.gig_id);
  return {
    ...review,
    reviewer: userSummary(byId(db.users, review.reviewer_id), db),
    reviewee: userSummary(byId(db.users, review.reviewee_id), db),
    gig: gig ? { id: gig.id, title: gig.title, category: gig.category } : null,
  };
}

export function listReviews(db, query = {}) {
  return db.reviews
    .filter((r) => !query.user_id || r.reviewee_id === query.user_id)
    .filter((r) => !query.reviewer_id || r.reviewer_id === query.reviewer_id)
    .filter((r) => !query.gig_id || r.gig_id === query.gig_id)
    .sort(newestFirst('created_at'))
    .map((r) => presentReview(r, db));
}

// ---------------------------------------------------------------- dashboard

function activityFor(db, viewer, now) {
  const events = [];
  const gigRef = (gig) => ({ id: gig.id, title: gig.title });
  for (const a of db.applications) {
    const gig = byId(db.gigs, a.gig_id);
    if (!gig) continue;
    if (gig.user_id === viewer.id) {
      events.push({ id: `${a.id}-received`, kind: 'application_received', at: a.created_at, gig: gigRef(gig), user: userSummary(byId(db.users, a.applicant_id), db) });
    }
    if (a.applicant_id === viewer.id && a.status !== PENDING) {
      events.push({
        id: `${a.id}-decided`,
        kind: a.status === ACCEPTED ? 'application_accepted' : 'application_rejected',
        at: a.updated_at,
        gig: gigRef(gig),
        user: userSummary(byId(db.users, gig.user_id), db),
      });
    }
  }
  for (const gig of db.gigs) {
    const involved = gig.user_id === viewer.id || gig.accepted_applicant_id === viewer.id;
    if (involved && gig.status === COMPLETED && gig.completed_at) {
      events.push({ id: `${gig.id}-completed`, kind: 'gig_completed', at: gig.completed_at, gig: gigRef(gig) });
    }
  }
  for (const r of db.reviews) {
    if (r.reviewee_id !== viewer.id) continue;
    const gig = byId(db.gigs, r.gig_id);
    events.push({ id: `${r.id}-review`, kind: 'review_received', at: r.created_at, gig: gig && gigRef(gig), user: userSummary(byId(db.users, r.reviewer_id), db), rating: r.rating });
  }
  const nowIso = new Date(now).toISOString();
  return events.filter((e) => e.at && e.at <= nowIso).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

/** Everything the home screen needs for one user in a single request. */
export function dashboard(db, viewer, now) {
  const myGigs = db.gigs.filter((g) => g.user_id === viewer.id);
  const myApplications = db.applications.filter((a) => a.applicant_id === viewer.id);
  const pendingFor = (gigId) => db.applications.filter((a) => a.gig_id === gigId && a.status === PENDING).length;

  const attention = [];
  for (const gig of myGigs) {
    const status = effectiveStatus(gig, now);
    if (status === OPEN && pendingFor(gig.id) > 0) {
      attention.push({ kind: 'review_applicants', gig: gigSummary(gig, db, now), count: pendingFor(gig.id) });
    } else if (status === IN_PROGRESS) {
      attention.push({ kind: 'complete_gig', gig: gigSummary(gig, db, now), user: userSummary(byId(db.users, gig.accepted_applicant_id), db) });
    } else if (status === EXPIRED) {
      attention.push({ kind: 'expired_gig', gig: gigSummary(gig, db, now), count: pendingFor(gig.id) });
    }
  }
  for (const gig of db.gigs) {
    if (gig.status !== COMPLETED) continue;
    const check = checkCanReview({ gig, userId: viewer.id, reviews: db.reviews });
    if (check.ok) attention.push({ kind: 'leave_review', gig: gigSummary(gig, db, now), user: userSummary(byId(db.users, check.revieweeId), db) });
  }

  // Suggested gigs: open, not mine, not applied to yet; ones mentioning my skills first.
  const applied = new Set(myApplications.map((a) => a.gig_id));
  const skills = viewer.skills.map((s) => s.toLowerCase());
  const recommended = db.gigs
    .filter((g) => effectiveStatus(g, now) === OPEN && g.user_id !== viewer.id && !applied.has(g.id))
    .map((g) => {
      const text = `${g.title} ${g.description}`.toLowerCase();
      return { gig: g, matched: viewer.skills.filter((_, i) => text.includes(skills[i])) };
    })
    .sort((a, b) => b.matched.length - a.matched.length || newestFirst('created_at')(a.gig, b.gig))
    .slice(0, 4)
    .map(({ gig, matched }) => ({ ...presentGig(gig, db, now), matched_skills: matched }));

  return {
    user: presentUser(viewer, db),
    stats: {
      open_gigs: db.gigs.filter((g) => effectiveStatus(g, now) === OPEN).length,
      my_active_gigs: myGigs.filter((g) => [OPEN, IN_PROGRESS].includes(effectiveStatus(g, now))).length,
      pending_applications: myApplications.filter((a) => a.status === PENDING).length,
      working_on: db.gigs.filter((g) => g.accepted_applicant_id === viewer.id && g.status === IN_PROGRESS).length,
    },
    attention,
    recommended,
    activity: activityFor(db, viewer, now),
    top_students: db.users
      .map((u) => ({ ...userSummary(u, db), skills: u.skills }))
      .filter((u) => u.review_count > 0)
      .sort(byReputation)
      .slice(0, 4),
  };
}
