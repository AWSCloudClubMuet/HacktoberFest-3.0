export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function formatBudget(gig) {
  return gig.budget != null ? `PKR ${Number(gig.budget).toLocaleString('en-US')}` : null;
}

export function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function formatDate(yyyyMmDd, lang = 'en') {
  if (!yyyyMmDd) return '';
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  return d.toLocaleDateString(lang === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
