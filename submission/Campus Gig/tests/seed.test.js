import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedData } from '../server/seed.js';
import { CATEGORIES, GIG_TYPES, PAYMENT_TYPES, GIG_STATUSES } from '../shared/constants.js';
import { effectiveStatus, checkCanReview } from '../shared/rules.js';
import { validateGig, validateProfile, validateApplication, validateReview } from '../shared/validation.js';
import { NOW } from './helpers.js';

const data = buildSeedData(NOW);
const { users, gigs, applications, reviews } = data;
const byId = (list, id) => list.find((x) => x.id === id);

describe('seed data', () => {
  test('meets the minimum counts', () => {
    assert.ok(users.length >= 12, 'users');
    assert.ok(gigs.length >= 25, 'gigs');
    assert.ok(applications.length >= 20, 'applications');
    assert.ok(reviews.length >= 8, 'reviews');
  });

  test('covers every category, gig type, payment type and status', () => {
    assert.deepEqual(new Set(gigs.map((g) => g.category)), new Set(CATEGORIES));
    assert.deepEqual(new Set(gigs.map((g) => g.type)), new Set(GIG_TYPES));
    assert.deepEqual(new Set(gigs.map((g) => g.payment_type)), new Set(PAYMENT_TYPES));
    assert.deepEqual(new Set(gigs.map((g) => effectiveStatus(g, NOW))), new Set(GIG_STATUSES));
  });

  test('uses unique, stable ids', () => {
    for (const [list, prefix] of [[users, 'u'], [gigs, 'g'], [applications, 'a'], [reviews, 'r']]) {
      assert.equal(new Set(list.map((x) => x.id)).size, list.length);
      list.forEach((item, i) => assert.equal(item.id, `${prefix}${i + 1}`));
    }
  });

  test('every record passes the same validation the API applies', () => {
    for (const user of users) assert.deepEqual(validateProfile(user).errors, {}, user.id);
    for (const gig of gigs) assert.deepEqual(validateGig(gig, { now: NOW, checkDeadline: false }).errors, {}, gig.id);
    for (const a of applications) assert.deepEqual(validateApplication(a).errors, {}, a.id);
    for (const r of reviews) assert.deepEqual(validateReview(r).errors, {}, r.id);
  });

  test('applications are never to your own gig or duplicated', () => {
    const seen = new Set();
    for (const a of applications) {
      const gig = byId(gigs, a.gig_id);
      assert.ok(gig && byId(users, a.applicant_id), `${a.id} references`);
      assert.notEqual(a.applicant_id, gig.user_id, `${a.id} self-application`);
      const key = `${a.gig_id}:${a.applicant_id}`;
      assert.ok(!seen.has(key), `${a.id} duplicate`);
      seen.add(key);
    }
  });

  test('gig statuses agree with their applications', () => {
    for (const gig of gigs) {
      const apps = applications.filter((a) => a.gig_id === gig.id);
      const accepted = apps.filter((a) => a.status === 'Accepted');
      if (gig.status === 'In Progress' || gig.status === 'Completed') {
        assert.equal(accepted.length, 1, `${gig.id} needs one accepted application`);
        assert.equal(accepted[0].applicant_id, gig.accepted_applicant_id, gig.id);
        assert.ok(!apps.some((a) => a.status === 'Pending'), `${gig.id} still has pending applications`);
      } else {
        assert.equal(accepted.length, 0, `${gig.id} should have no accepted application`);
        assert.equal(gig.accepted_applicant_id, null, gig.id);
      }
      if (gig.status === 'Cancelled') assert.ok(apps.every((a) => a.status === 'Rejected'), gig.id);
    }
  });

  test('reviews come from the two participants of completed gigs, once each', () => {
    const applied = [];
    for (const review of reviews) {
      const gig = byId(gigs, review.gig_id);
      const check = checkCanReview({ gig, userId: review.reviewer_id, reviews: applied });
      assert.ok(check.ok, `${review.id}: ${check.message}`);
      assert.equal(review.reviewee_id, check.revieweeId, review.id);
      applied.push(review);
    }
  });

  test('timestamps are in a sensible order', () => {
    const nowIso = new Date(NOW).toISOString();
    for (const a of applications) {
      const gig = byId(gigs, a.gig_id);
      assert.ok(gig.created_at <= a.created_at && a.created_at <= a.updated_at && a.updated_at <= nowIso, a.id);
    }
    for (const r of reviews) assert.ok(byId(gigs, r.gig_id).completed_at <= r.created_at, r.id);
  });
});
