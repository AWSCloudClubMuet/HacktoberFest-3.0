// The domain vocabulary, shared by the API (server/) and the React app (src/).

export const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
export const GIG_TYPES = ['Offering', 'Requesting'];
export const PAYMENT_TYPES = ['Paid', 'SkillSwap', 'Free'];

export const GIG_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};
export const GIG_STATUSES = Object.values(GIG_STATUS);

export const APPLICATION_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};
export const APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

export const SORT_OPTIONS = ['newest', 'deadline', 'budget_desc', 'budget_asc'];

export const LIMITS = {
  title: { min: 5, max: 100 },
  description: { min: 20, max: 1000 },
  budget: { min: 100, max: 500000 },
  deadlineMaxDays: 365,
  applicationMessage: { min: 10, max: 500 },
  reviewComment: { min: 5, max: 500 },
  name: { min: 2, max: 60 },
  major: { min: 2, max: 80 },
  semester: { min: 1, max: 12 },
  bio: { max: 300 },
  skills: { min: 1, max: 12, itemMax: 30 },
};

export const DAY_MS = 24 * 60 * 60 * 1000;
