export type MarketPositionLabel = 'Below' | 'At' | 'Above'

export interface MarketLabelResult {
  label: MarketPositionLabel
  pct: number // raw diff percentage rounded to 1 decimal place
  formattedText: string
}

/**
 * Calculates whether an asking price is Below, At, or Above market average.
 *
 * Rules (SPEC.md section 8.3):
 * - marketAvg = average of the latest price of that crop across all markets.
 * - diffPct = (asking - marketAvg) / marketAvg * 100
 * - At market if -5 <= diffPct <= +5 (inclusive)
 * - Below market if diffPct < -5
 * - Above market if diffPct > +5
 */
export function getMarketLabel(
  askingPrice: number,
  marketAvg: number,
): MarketLabelResult {
  if (marketAvg <= 0 || askingPrice <= 0) {
    return {
      label: 'At',
      pct: 0,
      formattedText: 'At market 0.0%',
    }
  }

  const rawDiffPct = ((askingPrice - marketAvg) / marketAvg) * 100
  const pct = Number(rawDiffPct.toFixed(1))

  let label: MarketPositionLabel = 'At'
  if (rawDiffPct < -5) {
    label = 'Below'
  } else if (rawDiffPct > 5) {
    label = 'Above'
  }

  const sign = rawDiffPct > 0 ? '+' : ''
  const formattedText = `${label} market ${sign}${pct.toFixed(1)}%`

  return {
    label,
    pct,
    formattedText,
  }
}
