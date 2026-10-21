export const SECTION_KEY = 'campus-section';

export const SECTIONS = {
  offer: {
    id: 'offer',
    browseType: 'Requesting',
    postType: 'Offering',
    label: 'Offer a service',
    short: 'requests',
    noun: 'requests',
    headline: 'Requests from students',
    subtitle: 'Classmates posted these needs. Offer your help and get selected.',
    by: 'Requested by',
    action: 'Offer your help',
    post: 'Post an offer',
    empty: 'No open requests from other students yet.',
  },
  request: {
    id: 'request',
    browseType: 'Offering',
    postType: 'Requesting',
    label: 'Request a service',
    short: 'offers',
    noun: 'services',
    headline: 'Services offered by students',
    subtitle: 'Find a classmate who already has the skill, then request it.',
    by: 'Offered by',
    action: 'Request this service',
    post: 'Post a request',
    empty: 'No open services from other students yet.',
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
    group: '',
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
    group: params.get('group') || '',
  };
}

export function isResultsView(filters) {
  return Boolean(
    filters.q || filters.category || filters.payment_type || filters.min || filters.max || filters.status || filters.sort || filters.group,
  );
}

export function toQuery(filters) {
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'payment_type', 'min', 'max', 'status', 'sort', 'group']) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function presentGigs(gigs, filters) {
  let rows = gigs.slice();
  if (filters.group === 'unpaid') rows = rows.filter((gig) => gig.payment_type !== 'Paid');
  if (filters.group === 'closing') rows = rows.filter((gig) => gig.status === 'Open');
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
