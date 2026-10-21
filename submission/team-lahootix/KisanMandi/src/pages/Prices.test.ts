import { describe, it, expect } from 'vitest'
import { getLatestPrice, getDailyChange, getMarketAverage } from '../lib/priceMath'
import { formatPKR, formatPriceWithUnit, formatChange } from '../lib/format'
import type { Price, Crop } from '../types'

describe('Prices Screen Logic & Integration', () => {
  const crops: Crop[] = [
    { id: 1, name: 'Wheat', category: 'Grains' },
    { id: 2, name: 'Rice (IRRI-6)', category: 'Grains' },
    { id: 3, name: 'Cotton (Phutti)', category: 'Cash Crops' },
    { id: 4, name: 'Onion', category: 'Vegetables' },
    { id: 5, name: 'Tomato', category: 'Vegetables' },
    { id: 6, name: 'Potato', category: 'Vegetables' },
    { id: 7, name: 'Sindhri Mango', category: 'Fruits' },
    { id: 8, name: 'Banana', category: 'Fruits' },
  ]

  const prices: Price[] = [
    { id: 1, crop_id: 1, market_id: 1, date: '2026-10-20', price: 3950 },
    { id: 2, crop_id: 1, market_id: 1, date: '2026-10-21', price: 3910 },
    { id: 3, crop_id: 1, market_id: 2, date: '2026-10-20', price: 4050 },
    { id: 4, crop_id: 1, market_id: 2, date: '2026-10-21', price: 4130 },
    { id: 5, crop_id: 4, market_id: 1, date: '2026-10-20', price: 3100 },
    { id: 6, crop_id: 4, market_id: 1, date: '2026-10-21', price: 3050 },
    { id: 7, crop_id: 7, market_id: 1, date: '2026-10-20', price: 6300 },
    { id: 8, crop_id: 7, market_id: 1, date: '2026-10-21', price: 6500 },
  ]

  it('filters crops by search query (case-insensitive)', () => {
    const search = 'on'
    const filtered = crops.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    expect(filtered.map((c) => c.name)).toEqual(['Cotton (Phutti)', 'Onion'])
  })

  it('filters crops by category', () => {
    const category = 'Fruits'
    const filtered = crops.filter((c) => c.category === category)
    expect(filtered.map((c) => c.name)).toEqual(['Sindhri Mango', 'Banana'])
  })

  it('combines search and category filters correctly', () => {
    const search = 'man'
    const category: string = 'Fruits'
    const filtered = crops.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) &&
        (category === 'All' || c.category === category),
    )
    expect(filtered.map((c) => c.name)).toEqual(['Sindhri Mango'])
  })

  it('updates price correctly when market changes', () => {
    const wheatMarket1 = getLatestPrice(prices, 1, 1)
    const wheatMarket2 = getLatestPrice(prices, 1, 2)
    expect(wheatMarket1?.price).toBe(3910)
    expect(wheatMarket2?.price).toBe(4130)
  })

  it('formats prices with standard unit / maund', () => {
    expect(formatPriceWithUnit(3910)).toBe('Rs 3,910 / maund')
    expect(formatPriceWithUnit(8300)).toBe('Rs 8,300 / maund')
  })

  it('computes daily change amount and percentage with correct signs and arrow indicators', () => {
    // Wheat: 3910 - 3950 = -40 (-1.0%)
    const wheatChange = getDailyChange(prices, 1, 1)
    const wheatFormatted = formatChange(wheatChange)
    expect(wheatFormatted.sign).toBe('negative')
    expect(wheatFormatted.arrow).toBe('▼')
    expect(wheatFormatted.text).toBe('-Rs 40 (-1.0%)')

    // Mango: 6500 - 6300 = +200 (+3.2%)
    const mangoChange = getDailyChange(prices, 7, 1)
    const mangoFormatted = formatChange(mangoChange)
    expect(mangoFormatted.sign).toBe('positive')
    expect(mangoFormatted.arrow).toBe('▲')
    expect(mangoFormatted.text).toBe('+Rs 200 (+3.2%)')
  })
})
