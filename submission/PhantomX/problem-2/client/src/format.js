export function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMoney(amount) {
  return `$${Number(amount).toLocaleString()}`;
}

export function closesIn(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes in 1 day';
  return `Closes in ${days} days`;
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}
