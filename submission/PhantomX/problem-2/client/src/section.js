export const SECTION_KEY = 'campus-section';

export const SECTIONS = {
  offer: {
    id: 'offer',
    type: 'Offering',
    label: 'Offer a service',
    short: 'offers',
    headline: 'Find a student with the skill you need',
    subtitle: 'Browse skills students are offering, then request the one that fits.',
    by: 'Offered by',
    action: 'Request this service',
    post: 'Post an offer',
  },
  request: {
    id: 'request',
    type: 'Requesting',
    label: 'Request a service',
    short: 'requests',
    headline: 'Help a fellow student and earn',
    subtitle: 'See what classmates need, then offer your help.',
    by: 'Requested by',
    action: 'Offer your help',
    post: 'Post a request',
  },
};

export const STATUSES = ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'];

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget', label: 'Budget' },
  { value: 'deadline', label: 'Deadline' },
];

export function readSection() {
  try {
    return localStorage.getItem(SECTION_KEY) === 'request' ? 'request' : 'offer';
  } catch {
    return 'offer';
  }
}

export function writeSection(section) {
  const safe = section === 'request' ? 'request' : 'offer';
  try {
    localStorage.setItem(SECTION_KEY, safe);
  } catch {
    /* private mode */
  }
  return safe;
}

export function sectionFromPath(path) {
  if (path === '/request') return 'request';
  if (path === '/offer') return 'offer';
  return null;
}

export function emptyFilters() {
  return {
    q: '',
    category: '',
    payment_type: '',
    min: '',
    max: '',
    status: 'Open',
    sort: 'newest',
  };
}

export function parseSearch(search) {
  const params = new URLSearchParams(search || '');
  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    payment_type: params.get('payment_type') || '',
    min: params.get('min') || '',
    max: params.get('max') || '',
    status: params.get('status') || '',
    sort: params.get('sort') || '',
  };
}

export function isResultsView(filters) {
  return Boolean(
    filters.q || filters.category || filters.payment_type || filters.min || filters.max || filters.status || filters.sort,
  );
}

export function toQuery(filters) {
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'payment_type', 'min', 'max', 'status', 'sort']) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function presentGigs(gigs, filters) {
  let rows = gigs.slice();
  if (filters.status) rows = rows.filter((gig) => gig.status === filters.status);
  else if (!isResultsView(filters)) rows = rows.filter((gig) => gig.status !== 'Expired' && gig.status !== 'Cancelled');
  else rows = rows.filter((gig) => gig.status !== 'Expired' && gig.status !== 'Cancelled');

  const sort = filters.sort || 'newest';
  if (sort === 'budget') {
    rows.sort((a, b) => {
      const left = a.budget == null ? -1 : Number(a.budget);
      const right = b.budget == null ? -1 : Number(b.budget);
      return right - left;
    });
  } else if (sort === 'deadline') {
    rows.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return rows;
}
