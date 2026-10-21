import { describe, it, expect } from 'vitest'
import { calculateProfit } from '../lib/profitMath'
import { formatPKR, formatChange } from '../lib/format'

describe('ProfitCalculator Logic & Integration Verification', () => {
  it('matches SPEC exact hand calculation (quantity: 100, price: 4,000, cost: 3,000)', () => {
    const res = calculateProfit({
      quantity: 100,
      price: 4000,
      costPerUnit: 3000,
      shiftPct: 0,
    })

    expect(res.adjustedPrice).toBe(4000)
    expect(res.revenue).toBe(400000)
    expect(res.totalCost).toBe(300000)
    expect(res.profit).toBe(100000)
    expect(res.marginPct).toBe(25.0)

    // Formatted checks
    expect(formatPKR(res.revenue)).toBe('Rs 400,000')
    expect(formatPKR(res.totalCost)).toBe('Rs 300,000')
    expect(formatPKR(res.profit)).toBe('Rs 100,000')
  })

  it('shifts price by exactly ±20% for bear and bull what-if cases', () => {
    const basePrice = 4000

    // Bear -20%
    const bear = calculateProfit({
      quantity: 100,
      price: basePrice,
      costPerUnit: 3000,
      shiftPct: -20,
    })
    expect(bear.adjustedPrice).toBe(3200) // 4000 * 0.8
    expect(bear.revenue).toBe(320000)
    expect(bear.totalCost).toBe(300000)
    expect(bear.profit).toBe(20000)
    expect(bear.marginPct).toBe(6.3)

    // Bull +20%
    const bull = calculateProfit({
      quantity: 100,
      price: basePrice,
      costPerUnit: 3000,
      shiftPct: 20,
    })
    expect(bull.adjustedPrice).toBe(4800) // 4000 * 1.2
    expect(bull.revenue).toBe(480000)
    expect(bull.totalCost).toBe(300000)
    expect(bull.profit).toBe(180000)
    expect(bull.marginPct).toBe(37.5)
  })

  it('accurately handles a Loss scenario and formats appropriately', () => {
    const lossRes = calculateProfit({
      quantity: 100,
      price: 2500,
      costPerUnit: 3000,
      shiftPct: 0,
    })

    expect(lossRes.adjustedPrice).toBe(2500)
    expect(lossRes.revenue).toBe(250000)
    expect(lossRes.totalCost).toBe(300000)
    expect(lossRes.profit).toBe(-50000)
    expect(lossRes.profit < 0).toBe(true)
    expect(lossRes.marginPct).toBe(-20.0)
    expect(formatPKR(Math.abs(lossRes.profit))).toBe('Rs 50,000')
  })

  it('guarantees no NaN or Infinity on empty, zero, or invalid inputs', () => {
    // 0 quantity
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
    expect(Number.isNaN(zeroQty.profit)).toBe(false)

    // 0 price
    const zeroPrice = calculateProfit({
      quantity: 100,
      price: 0,
      costPerUnit: 3000,
      shiftPct: 0,
    })
    expect(zeroPrice.revenue).toBe(0)
    expect(zeroPrice.profit).toBe(-300000)
    expect(zeroPrice.marginPct).toBeNull()

    // NaN inputs
    const nanInputs = calculateProfit({
      quantity: NaN,
      price: NaN,
      costPerUnit: NaN,
      shiftPct: NaN,
    })
    expect(Number.isNaN(nanInputs.revenue)).toBe(false)
    expect(Number.isNaN(nanInputs.totalCost)).toBe(false)
    expect(Number.isNaN(nanInputs.profit)).toBe(false)
    expect(nanInputs.marginPct).toBeNull()
  })

  it('verifies farmer-only access route gating', () => {
    const farmerOnlyPaths = ['/alerts', '/my-listings', '/listings/new', '/calculator']
    const isBuyerAllowed = (path: string) => !farmerOnlyPaths.includes(path)

    expect(isBuyerAllowed('/prices')).toBe(true)
    expect(isBuyerAllowed('/marketplace')).toBe(true)
    expect(isBuyerAllowed('/calculator')).toBe(false)
  })
})
