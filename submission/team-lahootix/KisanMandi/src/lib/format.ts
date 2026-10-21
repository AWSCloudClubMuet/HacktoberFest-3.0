import { format, parseISO } from 'date-fns'

/**
 * Formats a numeric amount in PKR currency style (e.g. "Rs 4,200")
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs 0'
  return `Rs ${Math.round(amount).toLocaleString('en-PK')}`
}

/**
 * Formats price with standard unit (/ maund)
 */
export function formatPriceWithUnit(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) return 'Rs 0 / maund'
  return `${formatPKR(price)} / maund`
}

/**
 * Formats signed daily change amount and percentage.
 * Example:
 * - Positive: "+Rs 120 (+3.1%)"
 * - Negative: "-Rs 80 (-2.0%)"
 * - Zero: "Rs 0 (0.0%)"
 * - Null / None: "–"
 */
export function formatChange(
  change: { amount: number; pct: number } | null | undefined,
): {
  text: string
  sign: 'positive' | 'negative' | 'neutral'
  arrow: string
} {
  if (!change) {
    return { text: '–', sign: 'neutral', arrow: '' }
  }

  const { amount, pct } = change

  if (amount > 0) {
    const formattedAmt = `+Rs ${Math.abs(amount).toLocaleString('en-PK')}`
    const formattedPct = `(+${pct.toFixed(1)}%)`
    return {
      text: `${formattedAmt} ${formattedPct}`,
      sign: 'positive',
      arrow: '▲',
    }
  }

  if (amount < 0) {
    const formattedAmt = `-Rs ${Math.abs(amount).toLocaleString('en-PK')}`
    const formattedPct = `(${pct.toFixed(1)}%)`
    return {
      text: `${formattedAmt} ${formattedPct}`,
      sign: 'negative',
      arrow: '▼',
    }
  }

  return {
    text: `Rs 0 (0.0%)`,
    sign: 'neutral',
    arrow: '–',
  }
}

/**
 * Formats ISO date (YYYY-MM-DD) into readable Pakistani/British format (e.g. "21 Oct 2026")
 */
export function formatDateDisplay(isoDate: string): string {
  try {
    const d = parseISO(isoDate)
    return format(d, 'dd MMM yyyy')
  } catch {
    return isoDate
  }
}

/**
 * Formats short date for charts (e.g. "21 Oct")
 */
export function formatChartDate(isoDate: string): string {
  try {
    const d = parseISO(isoDate)
    return format(d, 'dd MMM')
  } catch {
    return isoDate
  }
}

/**
 * Formats current update time for pull-to-refresh (e.g. "Updated 13:45")
 */
export function formatUpdatedTime(date: Date = new Date()): string {
  return `Updated ${format(date, 'HH:mm')}`
}
