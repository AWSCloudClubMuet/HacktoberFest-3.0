import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGig, validateApplication, validateReview, validateProfile, parseGigQuery, canonical,
} from '../shared/validation.js';
import { NOW, DAY_MS, gigInput } from './helpers.js';

describe('gig creation validation', () => {
  test('accepts a valid paid gig and cleans the input', () => {
    const { value, errors } = validateGig(gigInput({ title: '  Padded title  ', budget: '4500' }), { now: NOW });
    assert.deepEqual(errors, {});
    assert.equal(value.title, 'Padded title');
    assert.equal(value.budget, 4500);
  });

  test('reports every missing required field', () => {
    const { errors } = validateGig({}, { now: NOW });
    assert.deepEqual(Object.keys(errors).sort(), ['category', 'deadline', 'description', 'payment_type', 'title', 'type']);
  });

  test('enforces title and description lengths', () => {
    const { errors } = validateGig(gigInput({ title: 'Hey', description: 'Too short' }), { now: NOW });
    assert.match(errors.title, /at least 5/);
    assert.match(errors.description, /at least 20/);
  });

  test('rejects unknown category, type and payment type', () => {
    const { errors } = validateGig(gigInput({ category: 'Cooking', type: 'Selling', payment_type: 'Crypto' }), { now: NOW });
    assert.ok(errors.category && errors.type && errors.payment_type);
  });

  test('Paid gigs require a whole-number budget within limits', () => {
    assert.match(validateGig(gigInput({ budget: null }), { now: NOW }).errors.budget, /need a budget/);
    assert.match(validateGig(gigInput({ budget: '' }), { now: NOW }).errors.budget, /need a budget/);
    assert.match(validateGig(gigInput({ budget: 50 }), { now: NOW }).errors.budget, /between/);
    assert.match(validateGig(gigInput({ budget: 9_000_000 }), { now: NOW }).errors.budget, /between/);
    assert.match(validateGig(gigInput({ budget: 1500.5 }), { now: NOW }).errors.budget, /whole number/);
    assert.match(validateGig(gigInput({ budget: 'lots' }), { now: NOW }).errors.budget, /whole number/);
  });

  test('Skill Swap and Free gigs must not carry a budget', () => {
    for (const payment_type of ['SkillSwap', 'Free']) {
      const withBudget = validateGig(gigInput({ payment_type, budget: 2000 }), { now: NOW });
      assert.match(withBudget.errors.budget, /Only Paid gigs/);
      const without = validateGig(gigInput({ payment_type, budget: null }), { now: NOW });
      assert.deepEqual(without.errors, {});
      assert.equal(without.value.budget, null);
    }
  });

  test('deadline must be a valid future date within a year', () => {
    const at = (days) => new Date(NOW + days * DAY_MS).toISOString();
    assert.match(validateGig(gigInput({ deadline: at(-1) }), { now: NOW }).errors.deadline, /future/);
    assert.match(validateGig(gigInput({ deadline: 'next friday' }), { now: NOW }).errors.deadline, /valid date/);
    assert.match(validateGig(gigInput({ deadline: at(400) }), { now: NOW }).errors.deadline, /12 months/);
    assert.deepEqual(validateGig(gigInput({ deadline: at(30) }), { now: NOW }).errors, {});
  });

  test('a date-only deadline means the end of that day', () => {
    const { value } = validateGig(gigInput({ deadline: '2026-10-30' }), { now: NOW });
    assert.equal(value.deadline, '2026-10-30T23:59:59.999Z');
  });

  test('an unchanged past deadline is allowed when editing other fields', () => {
    const past = new Date(NOW - DAY_MS).toISOString();
    assert.deepEqual(validateGig(gigInput({ deadline: past }), { now: NOW, checkDeadline: false }).errors, {});
  });

  test('labels are matched case-insensitively', () => {
    assert.equal(canonical('skill swap', ['Paid', 'SkillSwap', 'Free']), 'SkillSwap');
    assert.equal(canonical('in_progress', ['Open', 'In Progress']), 'In Progress');
    assert.equal(canonical('nope', ['Open']), undefined);
  });
});

describe('application, review and profile validation', () => {
  test('application needs a gig id and a short message', () => {
    assert.ok(validateApplication({ message: 'Hello there, I can help!' }).errors.gig_id);
    assert.match(validateApplication({ gig_id: 'g1', message: 'Hi' }).errors.message, /at least 10/);
    assert.match(validateApplication({ gig_id: 'g1', message: 'x'.repeat(501) }).errors.message, /at most 500/);
    assert.deepEqual(validateApplication({ gig_id: 'g1', message: 'I would love to help with this.' }).errors, {});
  });

  test('review rating must be an integer from 1 to 5 and the comment is required', () => {
    for (const rating of [0, 6, 4.5, 'great', null]) {
      assert.ok(validateReview({ gig_id: 'g1', rating, comment: 'Great work!' }).errors.rating, `rating ${rating}`);
    }
    assert.ok(validateReview({ gig_id: 'g1', rating: 5, comment: '   ' }).errors.comment);
    assert.deepEqual(validateReview({ gig_id: 'g1', rating: 5, comment: 'Great work!' }).errors, {});
  });

  test('profiles cannot set their own rating', () => {
    const { errors } = validateProfile({ average_rating: 5, review_count: 100 });
    assert.match(errors.average_rating, /calculated from reviews/);
    assert.ok(errors.review_count);
  });

  test('profile fields are validated and skills de-duplicated', () => {
    assert.ok(validateProfile({ semester: 13 }).errors.semester);
    assert.ok(validateProfile({ skills: [] }).errors.skills);
    const { value, errors } = validateProfile({ skills: ['React', 'react', ' Figma '] });
    assert.deepEqual(errors, {});
    assert.deepEqual(value.skills, ['React', 'Figma']);
  });
});

describe('search query parsing', () => {
  test('parses and normalises filters', () => {
    const { filters, errors } = parseGigQuery({
      q: ' react ', category: 'programming', payment_type: 'paid', status: 'in progress', min_budget: '1000', max_budget: '5000', sort: 'deadline',
    });
    assert.deepEqual(errors, {});
    assert.deepEqual(filters, {
      q: 'react', category: 'Programming', payment_type: 'Paid', status: 'In Progress', min_budget: 1000, max_budget: 5000, sort: 'deadline',
    });
  });

  test('reports invalid filters', () => {
    const { errors } = parseGigQuery({ category: 'Cooking', min_budget: '-1', sort: 'random' });
    assert.ok(errors.category && errors.min_budget && errors.sort);
    assert.ok(parseGigQuery({ min_budget: '5000', max_budget: '1000' }).errors.max_budget);
  });
});
