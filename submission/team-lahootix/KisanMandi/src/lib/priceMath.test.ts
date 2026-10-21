import { describe, it, expect } from 'vitest'
import {
  getLatestPrice,
  getPreviousPrice,
  getDailyChange,
  getStats,
  getMarketAverage,
  groupPricesByCrop,
  getMarketComparison,
} from './priceMath'
import type { Price, Market } from '../types'

describe('priceMath.ts', () => {
  const mockPrices: Price[] = [
    { id: 1, crop_id: 1, market_id: 1, date: '2026-10-19', price: 3950 },
    { id: 2, crop_id: 1, market_id: 1, date: '2026-10-20', price: 4000 },
    { id: 3, crop_id: 1, market_id: 1, date: '2026-10-21', price: 4100 },
    { id: 4, crop_id: 1, market_id: 2, date: '2026-10-20', price: 3900 },
    { id: 5, crop_id: 1, market_id: 2, date: '2026-10-21', price: 4300 },
    { id: 6, crop_id: 1, market_id: 3, date: '2026-10-21', price: 3850 },
    { id: 7, crop_id: 2, market_id: 1, date: '2026-10-21', price: 5200 },
  ]

  const mockMarkets: Market[] = [
    { id: 1, name: 'Hyderabad Sabzi Mandi', district: 'Hyderabad' },
    { id: 2, name: 'Sukkur Wholesale Mandi', district: 'Sukkur' },
    { id: 3, name: 'Mirpurkhas Fruit & Grain Mandi', district: 'Mirpurkhas' },
  ]

  describe('getLatestPrice', () => {
    it('returns the most recent price record', () => {
      const latest = getLatestPrice(mockPrices, 1, 1)
      expect(latest?.date).toBe('2026-10-21')
      expect(latest?.price).toBe(4100)
    })

    it('returns undefined if no prices exist for that crop', () => {
      expect(getLatestPrice(mockPrices, 99, 1)).toBeUndefined()
    })
  })

  describe('getPreviousPrice', () => {
    it('returns the second most recent price record', () => {
      const prev = getPreviousPrice(mockPrices, 1, 1)
      expect(prev?.date).toBe('2026-10-20')
      expect(prev?.price).toBe(4000)
    })

    it('returns undefined if only one day of price data exists', () => {
      expect(getPreviousPrice(mockPrices, 2, 1)).toBeUndefined()
    })
  })

  describe('getDailyChange', () => {
    it('calculates positive daily change and percentage correctly', () => {
      const change = getDailyChange(mockPrices, 1, 1)
      expect(change).not.toBeNull()
      expect(change?.amount).toBe(100)
      expect(change?.pct).toBe(2.5)
    })

    it('calculates negative daily change correctly', () => {
      const pricesWithNegative: Price[] = [
        { id: 20, crop_id: 1, market_id: 2, date: '2026-10-20', price: 3900 },
        { id: 21, crop_id: 1, market_id: 2, date: '2026-10-21', price: 3850 },
      ]
      const change = getDailyChange(pricesWithNegative, 1, 2)
      expect(change).not.toBeNull()
      expect(change?.amount).toBe(-50)
      expect(change?.pct).toBe(-1.3)
    })

    it('returns null when only 1 day of data is available', () => {
      expect(getDailyChange(mockPrices, 2, 1)).toBeNull()
    })

    it('guards against divide-by-zero if yesterday price is 0', () => {
      const zeroPrices: Price[] = [
        { id: 10, crop_id: 3, market_id: 1, date: '2026-10-20', price: 0 },
        { id: 11, crop_id: 3, market_id: 1, date: '2026-10-21', price: 100 },
      ]
      expect(getDailyChange(zeroPrices, 3, 1)).toBeNull()
    })
  })

  describe('getStats', () => {
    it('calculates min, max, and avg', () => {
      const stats = getStats([100, 200, 300, 400])
      expect(stats.min).toBe(100)
      expect(stats.max).toBe(400)
      expect(stats.avg).toBe(250)
    })

    it('handles a 14-day sequence accurately', () => {
      const series = [4000, 4050, 4100, 3950, 3900, 4200, 4150, 4300, 4250, 4100, 4000, 4050, 3980, 4120]
      const stats = getStats(series)
      expect(stats.min).toBe(3900)
      expect(stats.max).toBe(4300)
      expect(stats.avg).toBe(4082)
    })

    it('handles empty series gracefully', () => {
      const stats = getStats([])
      expect(stats.min).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.avg).toBe(0)
    })
  })

  describe('getMarketComparison', () => {
    it('sorts markets by highest price first and identifies best place to sell', () => {
      const comparison = getMarketComparison(mockPrices, mockMarkets, 1)

      expect(comparison.length).toBe(3)
      // Market 2 has 4300 (highest)
      expect(comparison[0].marketId).toBe(2)
      expect(comparison[0].price).toBe(4300)
      expect(comparison[0].isBest).toBe(true)
      expect(comparison[0].diffVsBest).toBe(0)

      // Market 1 has 4100 (diff: 4100 - 4300 = -200)
      expect(comparison[1].marketId).toBe(1)
      expect(comparison[1].price).toBe(4100)
      expect(comparison[1].isBest).toBe(false)
      expect(comparison[1].diffVsBest).toBe(-200)

      // Market 3 has 3850 (diff: 3850 - 4300 = -450)
      expect(comparison[2].marketId).toBe(3)
      expect(comparison[2].price).toBe(3850)
      expect(comparison[2].diffVsBest).toBe(-450)
    })

    it('handles markets with no data and puts them at the end', () => {
      // Crop 2 only exists in Market 1
      const comparison = getMarketComparison(mockPrices, mockMarkets, 2)
      expect(comparison[0].marketId).toBe(1)
      expect(comparison[0].price).toBe(5200)
      expect(comparison[0].isBest).toBe(true)

      expect(comparison[1].hasData).toBe(false)
      expect(comparison[1].price).toBeNull()
      expect(comparison[2].hasData).toBe(false)
    })
  })

  describe('getMarketAverage', () => {
    it('averages the latest price of a crop across all markets', () => {
      // Crop 1: M1=4100, M2=4300, M3=3850. Sum = 12250, Avg = 12250 / 3 = 4083
      const avg = getMarketAverage(mockPrices, 1)
      expect(avg).toBe(4083)
    })
  })
})
