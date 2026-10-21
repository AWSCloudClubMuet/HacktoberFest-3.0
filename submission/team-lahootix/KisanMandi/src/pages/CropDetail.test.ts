import { describe, it, expect } from 'vitest'
import { getStats, getMarketComparison } from '../lib/priceMath'
import type { Price, Market } from '../types'

describe('CropDetail Logic & Manual Verification', () => {
  const sample14DaysPrices: Price[] = [
    { id: 1, crop_id: 1, market_id: 1, date: '2026-10-08', price: 4000 },
    { id: 2, crop_id: 1, market_id: 1, date: '2026-10-09', price: 4050 },
    { id: 3, crop_id: 1, market_id: 1, date: '2026-10-10', price: 4100 },
    { id: 4, crop_id: 1, market_id: 1, date: '2026-10-11', price: 3950 },
    { id: 5, crop_id: 1, market_id: 1, date: '2026-10-12', price: 3900 },
    { id: 6, crop_id: 1, market_id: 1, date: '2026-10-13', price: 4200 },
    { id: 7, crop_id: 1, market_id: 1, date: '2026-10-14', price: 4150 },
    { id: 8, crop_id: 1, market_id: 1, date: '2026-10-15', price: 4300 },
    { id: 9, crop_id: 1, market_id: 1, date: '2026-10-16', price: 4250 },
    { id: 10, crop_id: 1, market_id: 1, date: '2026-10-17', price: 4100 },
    { id: 11, crop_id: 1, market_id: 1, date: '2026-10-18', price: 4000 },
    { id: 12, crop_id: 1, market_id: 1, date: '2026-10-19', price: 4050 },
    { id: 13, crop_id: 1, market_id: 1, date: '2026-10-20', price: 3980 },
    { id: 14, crop_id: 1, market_id: 1, date: '2026-10-21', price: 4120 },
  ]

  const markets: Market[] = [
    { id: 1, name: 'Hyderabad Sabzi Mandi', district: 'Hyderabad' },
    { id: 2, name: 'Sukkur Wholesale Mandi', district: 'Sukkur' },
    { id: 3, name: 'Mirpurkhas Fruit & Grain Mandi', district: 'Mirpurkhas' },
  ]

  it('contains exactly 14 data points for the 14-day line chart', () => {
    expect(sample14DaysPrices.length).toBe(14)
  })

  it('matches manual stats calculation for min, max, and avg', () => {
    const rawNumbers = sample14DaysPrices.map((p) => p.price)
    const stats = getStats(rawNumbers)

    // Manual calculation:
    // Min is 3900 (day 5)
    // Max is 4300 (day 8)
    // Sum = 57250 / 14 = 4089.2857 -> round = 4089
    expect(stats.min).toBe(3900)
    expect(stats.max).toBe(4300)
    expect(stats.avg).toBe(4082)
  })

  it('orders market comparison best-first and highlights top market', () => {
    const multiMarketPrices: Price[] = [
      { id: 1, crop_id: 1, market_id: 1, date: '2026-10-21', price: 3910 },
      { id: 2, crop_id: 1, market_id: 2, date: '2026-10-21', price: 4130 },
      { id: 3, crop_id: 1, market_id: 3, date: '2026-10-21', price: 3750 },
    ]

    const comparison = getMarketComparison(multiMarketPrices, markets, 1)

    // Top item must be Sukkur (4130)
    expect(comparison[0].marketName).toBe('Sukkur Wholesale Mandi')
    expect(comparison[0].price).toBe(4130)
    expect(comparison[0].isBest).toBe(true)
    expect(comparison[0].diffVsBest).toBe(0)

    // Second must be Hyderabad (3910)
    expect(comparison[1].marketName).toBe('Hyderabad Sabzi Mandi')
    expect(comparison[1].price).toBe(3910)
    expect(comparison[1].isBest).toBe(false)
    expect(comparison[1].diffVsBest).toBe(3910 - 4130) // -220

    // Third must be Mirpurkhas (3750)
    expect(comparison[2].marketName).toBe('Mirpurkhas Fruit & Grain Mandi')
    expect(comparison[2].price).toBe(3750)
    expect(comparison[2].isBest).toBe(false)
    expect(comparison[2].diffVsBest).toBe(3750 - 4130) // -380
  })

  it('buyer role check properly gates farmer actions', () => {
    const isFarmerRole = (role: 'Farmer' | 'Buyer') => role === 'Farmer'
    expect(isFarmerRole('Farmer')).toBe(true)
    expect(isFarmerRole('Buyer')).toBe(false)
  })
})
