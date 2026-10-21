import { describe, it, expect } from 'vitest'
import { calculateProfit } from './profitMath'

describe('profitMath.ts', () => {
  it('matches exact hand calculation: qty 100, price 4,000, cost 3,000', () => {
    const result = calculateProfit({
      quantity: 100,
      price: 4000,
      costPerUnit: 3000,
      shiftPct: 0,
    })

    expect(result.adjustedPrice).toBe(4000)
    expect(result.revenue).toBe(400000)
    expect(result.totalCost).toBe(300000)
    expect(result.profit).toBe(100000)
    expect(result.marginPct).toBe(25.0)
  })

  it('accurately calculates what-if shifts (+20% and -20%)', () => {
    // Bull (+20%): 4,000 * 1.20 = 4,800
    const bull = calculateProfit({
      quantity: 100,
      price: 4000,
      costPerUnit: 3000,
      shiftPct: 20,
    })
    expect(bull.adjustedPrice).toBe(4800)
    expect(bull.revenue).toBe(480000)
    expect(bull.totalCost).toBe(300000)
    expect(bull.profit).toBe(180000)
    expect(bull.marginPct).toBe(37.5)

    // Bear (-20%): 4,000 * 0.80 = 3,200
    const bear = calculateProfit({
      quantity: 100,
      price: 4000,
      costPerUnit: 3000,
      shiftPct: -20,
    })
    expect(bear.adjustedPrice).toBe(3200)
    expect(bear.revenue).toBe(320000)
    expect(bear.totalCost).toBe(300000)
    expect(bear.profit).toBe(20000)
    expect(bear.marginPct).toBe(6.3)
  })

  it('correctly reports losses when cost exceeds selling price', () => {
    // qty 100, price 2,000, cost 3,000
    const loss = calculateProfit({
      quantity: 100,
      price: 2000,
      costPerUnit: 3000,
      shiftPct: 0,
    })
    expect(loss.revenue).toBe(200000)
    expect(loss.totalCost).toBe(300000)
    expect(loss.profit).toBe(-100000)
    expect(loss.marginPct).toBe(-50.0)
  })

  it('handles zero quantity without returning NaN or Infinity', () => {
    const zeroQty = calculateProfit({
      quantity: 0,
      price: 4000,
      costPerUnit: 3000,
      shiftPct: 0,
    })
    expect(zeroQty.revenue).toBe(0)
    expect(zeroQty.totalCost).toBe(0)
    expect(zeroQty.profit).toBe(0)
    expect(zeroQty.marginPct).toBeNull()
    expect(Number.isNaN(zeroQty.revenue)).toBe(false)
  })

  it('handles zero price / zero revenue with null marginPct', () => {
    const zeroPrice = calculateProfit({
      quantity: 50,
      price: 0,
      costPerUnit: 2000,
      shiftPct: 0,
    })
    expect(zeroPrice.revenue).toBe(0)
    expect(zeroPrice.marginPct).toBeNull()
    expect(Number.isNaN(zeroPrice.profit)).toBe(false)
  })

  it('handles invalid or NaN inputs gracefully', () => {
    const nanCheck = calculateProfit({
      quantity: NaN,
      price: NaN,
      costPerUnit: NaN,
      shiftPct: NaN,
    })
    expect(nanCheck.adjustedPrice).toBe(0)
    expect(nanCheck.revenue).toBe(0)
    expect(nanCheck.totalCost).toBe(0)
    expect(nanCheck.profit).toBe(0)
    expect(nanCheck.marginPct).toBeNull()
  })
})
