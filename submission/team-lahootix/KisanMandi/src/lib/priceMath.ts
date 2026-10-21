import type { Price, Market } from '../types'

/**
 * Filters prices for a given crop and optional market, sorted by date descending.
 */
export function getSortedPrices(
  prices: Price[],
  cropId: number,
  marketId?: number,
): Price[] {
  return prices
    .filter((p) => p.crop_id === cropId && (marketId === undefined || p.market_id === marketId))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Returns the latest available price record for a crop (and market).
 * "Today" is defined by the latest date present in data, NOT device clock.
 */
export function getLatestPrice(
  prices: Price[],
  cropId: number,
  marketId?: number,
): Price | undefined {
  const sorted = getSortedPrices(prices, cropId, marketId)
  return sorted[0]
}

/**
 * Returns the second most recent price record (yesterday) for a crop (and market).
 */
export function getPreviousPrice(
  prices: Price[],
  cropId: number,
  marketId?: number,
): Price | undefined {
  const sorted = getSortedPrices(prices, cropId, marketId)
  return sorted[1]
}

/**
 * Calculates daily price change amount and percentage.
 * amount = today - yesterday
 * pct = (amount / yesterday) * 100 (rounded to 1 decimal place)
 * Guards against missing yesterday or yesterday price = 0 -> returns null.
 */
export function getDailyChange(
  prices: Price[],
  cropId: number,
  marketId?: number,
): { amount: number; pct: number } | null {
  const today = getLatestPrice(prices, cropId, marketId)
  const yesterday = getPreviousPrice(prices, cropId, marketId)

  if (!today || !yesterday || yesterday.price === 0) {
    return null
  }

  const amount = today.price - yesterday.price
  const rawPct = (amount / yesterday.price) * 100
  const pct = Number(rawPct.toFixed(1))

  return { amount, pct }
}

/**
 * Calculates Min, Max, and Average over an array of numbers.
 */
export function getStats(series: number[]): { min: number; max: number; avg: number } {
  if (!series || series.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }

  let min = series[0]
  let max = series[0]
  let sum = 0

  for (const val of series) {
    if (val < min) min = val
    if (val > max) max = val
    sum += val
  }

  const avg = Math.round(sum / series.length)
  return { min, max, avg }
}

/**
 * Computes average of the latest price of a crop across all markets.
 */
export function getMarketAverage(prices: Price[], cropId: number): number {
  const cropPrices = prices.filter((p) => p.crop_id === cropId)
  const marketMap = new Map<number, Price>()

  // Find latest price for each market
  for (const p of cropPrices) {
    const existing = marketMap.get(p.market_id)
    if (!existing || p.date.localeCompare(existing.date) > 0) {
      marketMap.set(p.market_id, p)
    }
  }

  if (marketMap.size === 0) return 0

  const sum = Array.from(marketMap.values()).reduce((acc, curr) => acc + curr.price, 0)
  return Math.round(sum / marketMap.size)
}

/**
 * Helper to group prices by crop_id.
 */
export function groupPricesByCrop(prices: Price[]): Record<number, Price[]> {
  const grouped: Record<number, Price[]> = {}
  for (const price of prices) {
    if (!grouped[price.crop_id]) {
      grouped[price.crop_id] = []
    }
    grouped[price.crop_id].push(price)
  }
  return grouped
}

export interface MarketComparisonItem {
  marketId: number
  marketName: string
  district: string
  price: number | null
  diffVsBest: number // 0 or negative number (e.g. -150)
  isBest: boolean
  hasData: boolean
}

/**
 * Calculates market comparison for a crop across all markets:
 * - Sorted by best price (highest first)
 * - Highlights the top item
 * - Calculates diff vs best price
 * - Handles markets with no data
 */
export function getMarketComparison(
  prices: Price[],
  markets: Market[],
  cropId: number,
): MarketComparisonItem[] {
  const cropPrices = prices.filter((p) => p.crop_id === cropId)

  // Map each market to its latest price for this crop
  const items: {
    market: Market
    latestPrice: number | null
  }[] = markets.map((m) => {
    const marketCropPrices = cropPrices
      .filter((p) => p.market_id === m.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    const latest = marketCropPrices[0]
    return {
      market: m,
      latestPrice: latest ? latest.price : null,
    }
  })

  // Markets with data
  const withData = items.filter((item): item is { market: Market; latestPrice: number } => item.latestPrice !== null)
  const withoutData = items.filter((item) => item.latestPrice === null)

  // Sort withData descending (highest price first)
  withData.sort((a, b) => b.latestPrice - a.latestPrice)

  const bestPrice = withData.length > 0 ? withData[0].latestPrice : 0

  const result: MarketComparisonItem[] = []

  withData.forEach((item, index) => {
    result.push({
      marketId: item.market.id,
      marketName: item.market.name,
      district: item.market.district,
      price: item.latestPrice,
      diffVsBest: item.latestPrice - bestPrice,
      isBest: index === 0,
      hasData: true,
    })
  })

  withoutData.forEach((item) => {
    result.push({
      marketId: item.market.id,
      marketName: item.market.name,
      district: item.market.district,
      price: null,
      diffVsBest: 0,
      isBest: false,
      hasData: false,
    })
  })

  return result
}
