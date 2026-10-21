import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveStatus, checkCanApply, checkDecision, checkStatusChange, checkCanEdit, checkCanReview,
  ratingSummary, userStats, filterGigs, sortGigs, manualTransitions,
} from '../shared/rules.js';
import { NOW, DAY_MS } from './helpers.js';

const at = (days) => new Date(NOW + days * DAY_MS).toISOString();

function gig(overrides = {}) {
  return {
    id: 'g1', user_id: 'owner', title: 'Build a React dashboard', description: 'Charts and filters for survey data.',
    type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: 5000,
    deadline: at(5), status: 'Open', accepted_applicant_id: null, created_at: at(-1),
    ...overrides,
  };
}

describe('deadline expiry', () => {
  test('an Open gig past its deadline reads as Expired', () => {
    assert.equal(effectiveStatus(gig({ deadline: at(-0.01) }), NOW), 'Expired');
    assert.equal(effectiveStatus(gig({ deadline: at(1) }), NOW), 'Open');
  });

  test('only Open gigs expire', () => {
    for (const status of ['In Progress', 'Completed', 'Cancelled']) {
      assert.equal(effectiveStatus(gig({ status, deadline: at(-3) }), NOW), status);
    }
  });

  test('a gig expires as time passes, without any stored change', () => {
    const g = gig({ deadline: at(2) });
    assert.equal(effectiveStatus(g, NOW), 'Open');
    assert.equal(effectiveStatus(g, NOW + 3 * DAY_MS), 'Expired');
    assert.equal(g.status, 'Open');
  });
});

describe('applying', () => {
  const apps = [{ id: 'a1', gig_id: 'g1', applicant_id: 'alice', status: 'Pending' }];

  test('cannot apply to your own gig', () => {
    assert.equal(checkCanApply({ gig: gig(), userId: 'owner', applications: [], now: NOW }).code, 'OWN_GIG');
  });

  test('cannot apply twice to the same gig', () => {
    assert.equal(checkCanApply({ gig: gig(), userId: 'alice', applications: apps, now: NOW }).code, 'DUPLICATE_APPLICATION');
  });

  test('cannot apply to expired or closed gigs', () => {
    const cases = [gig({ deadline: at(-1) }), gig({ status: 'In Progress' }), gig({ status: 'Completed' }), gig({ status: 'Cancelled' })];
    for (const g of cases) {
      assert.equal(checkCanApply({ gig: g, userId: 'bob', applications: apps, now: NOW }).code, 'GIG_CLOSED');
    }
  });

  test('anyone else can apply to an open gig', () => {
    assert.equal(checkCanApply({ gig: gig(), userId: 'bob', applications: apps, now: NOW }).ok, true);
  });
});

describe('accepting and rejecting applicants', () => {
  const pending = { id: 'a1', gig_id: 'g1', applicant_id: 'alice', status: 'Pending' };

  test('only the owner decides', () => {
    const r = checkDecision({ gig: gig(), application: pending, userId: 'mallory', decision: 'Accepted', now: NOW });
    assert.equal(r.code, 'NOT_OWNER');
  });

  test('only Pending applications can be decided', () => {
    const r = checkDecision({ gig: gig(), application: { ...pending, status: 'Rejected' }, userId: 'owner', decision: 'Accepted', now: NOW });
    assert.equal(r.code, 'INVALID_TRANSITION');
  });

  test('cannot accept on an expired or already assigned gig', () => {
    const expired = checkDecision({ gig: gig({ deadline: at(-1) }), application: pending, userId: 'owner', decision: 'Accepted', now: NOW });
    assert.equal(expired.code, 'GIG_CLOSED');
    assert.match(expired.message, /Extend its deadline/);
    const taken = checkDecision({ gig: gig({ status: 'In Progress', accepted_applicant_id: 'bob' }), application: pending, userId: 'owner', decision: 'Accepted', now: NOW });
    assert.equal(taken.code, 'GIG_CLOSED');
  });

  test('a pending applicant on an expired gig can still be rejected', () => {
    const r = checkDecision({ gig: gig({ deadline: at(-1) }), application: pending, userId: 'owner', decision: 'Rejected', now: NOW });
    assert.equal(r.ok, true);
  });
});

describe('status transitions', () => {
  const change = (g, nextStatus, userId = 'owner') => checkStatusChange({ gig: g, userId, nextStatus, now: NOW });

  test('only the owner can change the status', () => {
    assert.equal(change(gig({ status: 'In Progress' }), 'Completed', 'mallory').code, 'NOT_OWNER');
  });

  test('In Progress is reached only by accepting an applicant', () => {
    assert.equal(change(gig(), 'In Progress').code, 'INVALID_TRANSITION');
  });

  test('completion is only allowed from In Progress', () => {
    assert.equal(change(gig(), 'Completed').code, 'INVALID_TRANSITION');
    assert.equal(change(gig({ deadline: at(-1) }), 'Completed').code, 'INVALID_TRANSITION');
    assert.equal(change(gig({ status: 'Cancelled' }), 'Completed').code, 'INVALID_TRANSITION');
    assert.equal(change(gig({ status: 'In Progress' }), 'Completed').ok, true);
  });

  test('Open, Expired and In Progress gigs can be cancelled; finished gigs cannot', () => {
    assert.equal(change(gig(), 'Cancelled').ok, true);
    assert.equal(change(gig({ deadline: at(-1) }), 'Cancelled').ok, true);
    assert.equal(change(gig({ status: 'In Progress' }), 'Cancelled').ok, true);
    assert.equal(change(gig({ status: 'Completed' }), 'Cancelled').code, 'INVALID_TRANSITION');
    assert.equal(change(gig({ status: 'Cancelled' }), 'Open').code, 'INVALID_TRANSITION');
  });

  test('Expired cannot be set by hand and same-status changes are rejected', () => {
    assert.match(change(gig(), 'Expired').message, /automatically/);
    assert.equal(change(gig({ status: 'In Progress' }), 'In Progress').code, 'INVALID_TRANSITION');
  });

  test('the owner menu offers only legal manual transitions', () => {
    assert.deepEqual(manualTransitions(gig(), NOW), ['Cancelled']);
    assert.deepEqual(manualTransitions(gig({ status: 'In Progress' }), NOW), ['Completed', 'Cancelled']);
    assert.deepEqual(manualTransitions(gig({ status: 'Completed' }), NOW), []);
  });

  test('details can be edited only while the gig is open', () => {
    assert.equal(checkCanEdit({ gig: gig(), userId: 'owner' }).ok, true);
    assert.equal(checkCanEdit({ gig: gig(), userId: 'mallory' }).code, 'NOT_OWNER');
    assert.equal(checkCanEdit({ gig: gig({ status: 'In Progress' }), userId: 'owner' }).code, 'INVALID_TRANSITION');
  });
});

describe('review eligibility', () => {
  const done = gig({ status: 'Completed', accepted_applicant_id: 'worker' });

  test('the owner and the accepted applicant review each other', () => {
    assert.equal(checkCanReview({ gig: done, userId: 'owner', reviews: [] }).revieweeId, 'worker');
    assert.equal(checkCanReview({ gig: done, userId: 'worker', reviews: [] }).revieweeId, 'owner');
  });

  test('unrelated users cannot review', () => {
    assert.equal(checkCanReview({ gig: done, userId: 'stranger', reviews: [] }).code, 'NOT_PARTICIPANT');
  });

  test('no reviews before completion', () => {
    const active = gig({ status: 'In Progress', accepted_applicant_id: 'worker' });
    assert.equal(checkCanReview({ gig: active, userId: 'owner', reviews: [] }).code, 'GIG_NOT_COMPLETED');
  });

  test('one review per reviewer per gig', () => {
    const reviews = [{ gig_id: 'g1', reviewer_id: 'owner', reviewee_id: 'worker', rating: 5 }];
    assert.equal(checkCanReview({ gig: done, userId: 'owner', reviews }).code, 'ALREADY_REVIEWED');
    assert.equal(checkCanReview({ gig: done, userId: 'worker', reviews }).ok, true);
  });
});

describe('rating calculation', () => {
  test('no reviews means no rating yet', () => {
    assert.deepEqual(ratingSummary('u1', []), { average_rating: null, review_count: 0 });
  });

  test('average of received reviews, rounded to one decimal', () => {
    const reviews = [5, 4, 4].map((rating, i) => ({ id: `r${i}`, reviewee_id: 'u1', reviewer_id: 'x', rating }));
    reviews.push({ id: 'other', reviewee_id: 'u2', reviewer_id: 'u1', rating: 1 });
    assert.deepEqual(ratingSummary('u1', reviews), { average_rating: 4.3, review_count: 3 });
  });

  test('profile stats count posted and completed gigs on both sides', () => {
    const gigs = [
      gig({ id: 'g1', user_id: 'u1', status: 'Completed', accepted_applicant_id: 'u2' }),
      gig({ id: 'g2', user_id: 'u2', status: 'Completed', accepted_applicant_id: 'u1' }),
      gig({ id: 'g3', user_id: 'u1', status: 'Open' }),
    ];
    const stats = userStats('u1', { gigs, reviews: [] });
    assert.equal(stats.gigs_posted, 2);
    assert.equal(stats.gigs_completed, 2);
  });
});

describe('search and filtering', () => {
  const gigs = [
    gig({ id: 'g1', title: 'React tutor needed', description: 'Hooks and state', category: 'Tutoring', payment_type: 'Paid', budget: 1500, created_at: at(-3), deadline: at(9) }),
    gig({ id: 'g2', title: 'Poster design', description: 'For a REACT meetup', category: 'Design', type: 'Offering', payment_type: 'Free', budget: null, created_at: at(-1), deadline: at(2) }),
    gig({ id: 'g3', title: 'Thesis editing', description: 'APA formatting', category: 'Writing', payment_type: 'Paid', budget: 4000, created_at: at(-2), deadline: at(-1) }),
    gig({ id: 'g4', title: 'Swap Python for Figma', description: 'Skill exchange', category: 'Programming', payment_type: 'SkillSwap', budget: null, created_at: at(-4), deadline: at(4) }),
  ];
  const ids = (list) => list.map((g) => g.id);

  test('searches title and description, case-insensitively, requiring every word', () => {
    assert.deepEqual(ids(filterGigs(gigs, { q: 'react' }, NOW)), ['g1', 'g2']);
    assert.deepEqual(ids(filterGigs(gigs, { q: 'REACT tutor' }, NOW)), ['g1']);
    assert.deepEqual(ids(filterGigs(gigs, { q: 'apa' }, NOW)), ['g3']);
    assert.deepEqual(ids(filterGigs(gigs, { q: 'quantum' }, NOW)), []);
  });

  test('filters by category, type and payment type', () => {
    assert.deepEqual(ids(filterGigs(gigs, { category: 'Design' }, NOW)), ['g2']);
    assert.deepEqual(ids(filterGigs(gigs, { type: 'Offering' }, NOW)), ['g2']);
    assert.deepEqual(ids(filterGigs(gigs, { payment_type: 'SkillSwap' }, NOW)), ['g4']);
  });

  test('budget range only matches Paid gigs within the range', () => {
    assert.deepEqual(ids(filterGigs(gigs, { min_budget: 1000, max_budget: 2000 }, NOW)), ['g1']);
    assert.deepEqual(ids(filterGigs(gigs, { min_budget: 0 }, NOW)), ['g1', 'g3']);
  });

  test('status filter uses the effective status', () => {
    assert.deepEqual(ids(filterGigs(gigs, { status: 'Expired' }, NOW)), ['g3']);
    assert.deepEqual(ids(filterGigs(gigs, { status: 'Open' }, NOW)), ['g1', 'g2', 'g4']);
  });

  test('sorts by newest, deadline and budget (unbudgeted gigs last)', () => {
    assert.deepEqual(ids(sortGigs(gigs)), ['g2', 'g3', 'g1', 'g4']);
    assert.deepEqual(ids(sortGigs(gigs, 'deadline')), ['g3', 'g2', 'g4', 'g1']);
    assert.deepEqual(ids(sortGigs(gigs, 'budget_desc')), ['g3', 'g1', 'g2', 'g4']);
    assert.deepEqual(ids(sortGigs(gigs, 'budget_asc')), ['g1', 'g3', 'g2', 'g4']);
  });
});
