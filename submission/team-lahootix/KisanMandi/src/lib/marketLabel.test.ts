import { describe, it, expect } from 'vitest'
import { getMarketLabel } from './marketLabel'

describe('marketLabel.ts', () => {
  const baseAvg = 1000

  describe('Boundary tests for Below / At / Above market', () => {
    it('returns "At" when diffPct is exactly -5%', () => {
      // 950 is exactly -5% of 1000
      const result = getMarketLabel(950, baseAvg)
      expect(result.label).toBe('At')
      expect(result.pct).toBe(-5)
    })

    it('returns "At" when diffPct is exactly +5%', () => {
      // 1050 is exactly +5% of 1000
      const result = getMarketLabel(1050, baseAvg)
      expect(result.label).toBe('At')
      expect(result.pct).toBe(5)
    })

    it('returns "Below" when diffPct is -5.01% (< -5%)', () => {
      // 949.9 gives (949.9 - 1000) / 1000 * 100 = -5.01%
      const result = getMarketLabel(949.9, baseAvg)
      expect(result.label).toBe('Below')
      expect(result.pct).toBe(-5.0)
    })

    it('returns "Above" when diffPct is +5.01% (> +5%)', () => {
      // 1050.1 gives (1050.1 - 1000) / 1000 * 100 = +5.01%
      const result = getMarketLabel(1050.1, baseAvg)
      expect(result.label).toBe('Above')
      expect(result.pct).toBe(5.0)
    })

    it('returns "At" when asking is equal to marketAvg (0% diff)', () => {
      const result = getMarketLabel(1000, baseAvg)
      expect(result.label).toBe('At')
      expect(result.pct).toBe(0)
    })

    it('returns "Below" for significantly lower asking price (-10%)', () => {
      const result = getMarketLabel(900, baseAvg)
      expect(result.label).toBe('Below')
      expect(result.pct).toBe(-10)
    })

    it('returns "Above" for significantly higher asking price (+12%)', () => {
      const result = getMarketLabel(1120, baseAvg)
      expect(result.label).toBe('Above')
      expect(result.pct).toBe(12)
    })
  })

  describe('Edge cases', () => {
    it('handles zero or negative marketAvg gracefully', () => {
      expect(getMarketLabel(100, 0).label).toBe('At')
      expect(getMarketLabel(100, -10).label).toBe('At')
    })
  })
})
