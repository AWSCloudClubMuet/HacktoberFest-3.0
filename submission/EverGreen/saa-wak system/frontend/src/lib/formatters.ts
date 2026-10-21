/**
 * Formats a number as PKR currency
 */
export function formatPKR(amount: number, showDecimals = false): string {
  if (isNaN(amount)) return 'Rs. 0';
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Formats signed PKR change (e.g., +Rs. 150 or -Rs. 50)
 */
export function formatSignedPKR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rs. 0';
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatPKR(amount)}`;
}

/**
 * Formats signed percentage (e.g. +3.5%)
 */
export function formatPercentage(percent: number | null): string {
  if (percent === null || isNaN(percent)) return '—';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to friendly format (e.g. 21 Oct 2026)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a short date for charts (e.g. "18 Oct")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx] || ''}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
