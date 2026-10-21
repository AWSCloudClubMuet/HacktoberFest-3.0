// Input validation shared by the API (authoritative) and the React forms (instant feedback).
// Every validator returns { value, errors }: `value` is the cleaned input and `errors` maps
// a field name to a human-readable message. An empty `errors` object means the input is valid.

import {
  CATEGORIES, GIG_TYPES, PAYMENT_TYPES, GIG_STATUSES, SORT_OPTIONS, LIMITS, DAY_MS,
} from './constants.js';

const squash = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');

/** Match a value against an allowed list case-insensitively ("skill swap" -> "SkillSwap"). */
export function canonical(value, allowed) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return allowed.find((option) => squash(option) === squash(value));
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function text(value, label, { min = 0, max, required = true } = {}) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return required ? { error: `${label} is required.` } : { value: '' };
  }
  if (typeof value !== 'string') return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed.length < min) return { error: `${label} must be at least ${min} characters.` };
  if (max && trimmed.length > max) return { error: `${label} must be at most ${max} characters.` };
  return { value: trimmed };
}

function wholeNumber(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value === 'string' && /^\s*\d+\s*$/.test(value)) return Number(value);
  return NaN;
}

const isBlank = (value) => value === undefined || value === null || value === '';

/** "2026-11-05" (date only) means the end of that day; anything else must be a full date-time. */
export function parseDeadline(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T23:59:59.999Z` : value;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Validates a complete gig (a new one, or an existing gig merged with an edit).
 * `checkDeadline` is false when an edit leaves the deadline untouched, so editing the
 * title of a gig doesn't fail just because its original deadline is near.
 */
export function validateGig(input, { now = Date.now(), checkDeadline = true } = {}) {
  const errors = {};
  const value = {};

  const title = text(input.title, 'Title', LIMITS.title);
  if (title.error) errors.title = title.error; else value.title = title.value;

  const description = text(input.description, 'Description', LIMITS.description);
  if (description.error) errors.description = description.error; else value.description = description.value;

  value.type = canonical(input.type, GIG_TYPES);
  if (!value.type) errors.type = `Choose a gig type: ${GIG_TYPES.join(' or ')}.`;

  value.category = canonical(input.category, CATEGORIES);
  if (!value.category) errors.category = `Choose a category: ${CATEGORIES.join(', ')}.`;

  value.payment_type = canonical(input.payment_type, PAYMENT_TYPES);
  if (!value.payment_type) errors.payment_type = 'Choose a payment type: Paid, Skill Swap or Free.';

  if (value.payment_type === 'Paid') {
    const budget = wholeNumber(input.budget);
    if (isBlank(input.budget)) errors.budget = 'Paid gigs need a budget.';
    else if (Number.isNaN(budget)) errors.budget = 'Budget must be a whole number of rupees.';
    else if (budget < LIMITS.budget.min || budget > LIMITS.budget.max) {
      errors.budget = `Budget must be between Rs ${LIMITS.budget.min.toLocaleString('en-US')} and Rs ${LIMITS.budget.max.toLocaleString('en-US')}.`;
    } else value.budget = budget;
  } else if (value.payment_type) {
    if (!isBlank(input.budget)) errors.budget = 'Only Paid gigs have a budget. Leave it empty for Skill Swap or Free gigs.';
    else value.budget = null;
  }

  const deadline = parseDeadline(input.deadline);
  if (isBlank(input.deadline)) errors.deadline = 'Deadline is required.';
  else if (!deadline) errors.deadline = 'Deadline must be a valid date.';
  else if (checkDeadline && deadline.getTime() <= now) errors.deadline = 'Deadline must be in the future.';
  else if (checkDeadline && deadline.getTime() > now + LIMITS.deadlineMaxDays * DAY_MS) {
    errors.deadline = 'Deadline must be within the next 12 months.';
  } else value.deadline = deadline.toISOString();

  return { value, errors };
}

export function validateApplication(input) {
  const errors = {};
  const value = {};
  if (typeof input.gig_id !== 'string' || !input.gig_id.trim()) errors.gig_id = 'gig_id is required.';
  else value.gig_id = input.gig_id.trim();
  const message = text(input.message, 'Message', LIMITS.applicationMessage);
  if (message.error) errors.message = message.error; else value.message = message.value;
  return { value, errors };
}

export function validateReview(input) {
  const errors = {};
  const value = {};
  if (typeof input.gig_id !== 'string' || !input.gig_id.trim()) errors.gig_id = 'gig_id is required.';
  else value.gig_id = input.gig_id.trim();
  const rating = wholeNumber(input.rating);
  if (isBlank(input.rating)) errors.rating = 'Choose a rating from 1 to 5 stars.';
  else if (Number.isNaN(rating) || rating < 1 || rating > 5) errors.rating = 'Rating must be a whole number from 1 to 5.';
  else value.rating = rating;
  const comment = text(input.comment, 'Comment', LIMITS.reviewComment);
  if (comment.error) errors.comment = comment.error; else value.comment = comment.value;
  return { value, errors };
}

/** Validates a partial profile edit. Only the fields present in `input` are checked. */
export function validateProfile(input) {
  const errors = {};
  const value = {};
  for (const field of ['average_rating', 'rating', 'review_count']) {
    if (field in input) errors[field] = 'Ratings are calculated from reviews and cannot be edited.';
  }
  if ('name' in input) {
    const name = text(input.name, 'Name', LIMITS.name);
    if (name.error) errors.name = name.error; else value.name = name.value;
  }
  if ('major' in input) {
    const major = text(input.major, 'Major', LIMITS.major);
    if (major.error) errors.major = major.error; else value.major = major.value;
  }
  if ('semester' in input) {
    const semester = wholeNumber(input.semester);
    if (Number.isNaN(semester) || semester < LIMITS.semester.min || semester > LIMITS.semester.max) {
      errors.semester = `Semester must be a whole number from ${LIMITS.semester.min} to ${LIMITS.semester.max}.`;
    } else value.semester = semester;
  }
  if ('bio' in input) {
    const bio = text(input.bio, 'Bio', { ...LIMITS.bio, required: false });
    if (bio.error) errors.bio = bio.error; else value.bio = bio.value;
  }
  if ('skills' in input) {
    const { min, max, itemMax } = LIMITS.skills;
    if (!Array.isArray(input.skills) || input.skills.some((s) => typeof s !== 'string')) {
      errors.skills = 'Skills must be a list of text values.';
    } else {
      const seen = new Set();
      const skills = input.skills.map((s) => s.trim()).filter((s) => {
        const key = s.toLowerCase();
        if (!s || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (skills.length < min) errors.skills = 'Add at least one skill.';
      else if (skills.length > max) errors.skills = `List at most ${max} skills.`;
      else if (skills.some((s) => s.length > itemMax)) errors.skills = `Each skill must be at most ${itemMax} characters.`;
      else value.skills = skills;
    }
  }
  return { value, errors };
}

/** Validates GET /gigs query parameters and turns them into a typed filter object. */
export function parseGigQuery(query = {}) {
  const errors = {};
  const filters = {};
  const single = (key) => (Array.isArray(query[key]) ? query[key][0] : query[key]);

  const q = single('q');
  if (typeof q === 'string' && q.trim()) filters.q = q.trim();

  const lists = { category: CATEGORIES, type: GIG_TYPES, payment_type: PAYMENT_TYPES, status: GIG_STATUSES };
  for (const [key, allowed] of Object.entries(lists)) {
    const raw = single(key);
    if (raw === undefined || raw === '') continue;
    const match = canonical(raw, allowed);
    if (match) filters[key] = match;
    else errors[key] = `${key} must be one of: ${allowed.join(', ')}.`;
  }

  for (const key of ['min_budget', 'max_budget']) {
    const raw = single(key);
    if (raw === undefined || raw === '') continue;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) errors[key] = `${key} must be a non-negative number.`;
    else filters[key] = amount;
  }
  if (filters.min_budget !== undefined && filters.max_budget !== undefined && filters.min_budget > filters.max_budget) {
    errors.max_budget = 'max_budget must be greater than or equal to min_budget.';
  }

  const userId = single('user_id');
  if (typeof userId === 'string' && userId) filters.user_id = userId;

  const sort = single('sort');
  if (sort !== undefined && sort !== '') {
    if (SORT_OPTIONS.includes(sort)) filters.sort = sort;
    else errors.sort = `sort must be one of: ${SORT_OPTIONS.join(', ')}.`;
  }

  return { filters, errors };
}
