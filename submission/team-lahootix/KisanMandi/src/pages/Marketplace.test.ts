import { describe, it, expect } from 'vitest'
import { getMarketLabel } from '../lib/marketLabel'
import { listingSchema } from '../lib/validators'
import fs from 'fs'
import path from 'path'

describe('Marketplace & MarketLabel Logic', () => {
  describe('Market Label Boundary Tests', () => {
    const avg = 1000

    it('returns "At" when diffPct is exactly -5% and +5%', () => {
      expect(getMarketLabel(950, avg).label).toBe('At')
      expect(getMarketLabel(1050, avg).label).toBe('At')
    })

    it('returns "Below" when diffPct is -5.01%', () => {
      expect(getMarketLabel(949.9, avg).label).toBe('Below')
    })

    it('returns "Above" when diffPct is +5.01%', () => {
      expect(getMarketLabel(1050.1, avg).label).toBe('Above')
    })
  })

  describe('Seeded Listings Market Labels', () => {
    it('verifies that Below, At, and Above market labels all appear in seeded listings', () => {
      const dbPath = path.resolve(__dirname, '../../server/db.json')
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

      // Calculate market average per crop on today's date
      const cropAvgMap: Record<number, number> = {}
      db.crops.forEach((c: { id: number }) => {
        const cropPrices = db.prices
          .filter((p: { crop_id: number }) => p.crop_id === c.id)
          .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
        // Take latest price from each market
        const marketMap = new Map<number, number>()
        cropPrices.forEach((p: { market_id: number; price: number }) => {
          if (!marketMap.has(p.market_id)) marketMap.set(p.market_id, p.price)
        })
        const sum = Array.from(marketMap.values()).reduce((a, b) => a + b, 0)
        cropAvgMap[c.id] = Math.round(sum / marketMap.size)
      })

      const labels = new Set<string>()
      db.listings.forEach((l: { crop_id: number; asking_price: number }) => {
        const avg = cropAvgMap[l.crop_id]
        const res = getMarketLabel(l.asking_price, avg)
        labels.add(res.label)
      })

      expect(labels.has('Below')).toBe(true)
      expect(labels.has('At')).toBe(true)
      expect(labels.has('Above')).toBe(true)
    })
  })

  describe('Listing Form Zod Validation', () => {
    const validData = {
      crop_id: 1,
      quantity: 50,
      asking_price: 4000,
      district: 'Hyderabad',
      grade: 'A',
      available_from: '2099-12-31',
      contact_phone: '03001230001',
    }

    it('passes with valid inputs', () => {
      const parsed = listingSchema.safeParse(validData)
      expect(parsed.success).toBe(true)
    })

    it('rejects quantity <= 0', () => {
      const res0 = listingSchema.safeParse({ ...validData, quantity: 0 })
      const resNeg = listingSchema.safeParse({ ...validData, quantity: -5 })
      expect(res0.success).toBe(false)
      expect(resNeg.success).toBe(false)
    })

    it('rejects price <= 0', () => {
      const res0 = listingSchema.safeParse({ ...validData, asking_price: 0 })
      const resNeg = listingSchema.safeParse({ ...validData, asking_price: -100 })
      expect(res0.success).toBe(false)
      expect(resNeg.success).toBe(false)
    })

    it('rejects invalid phone numbers', () => {
      const res = listingSchema.safeParse({ ...validData, contact_phone: '123' })
      expect(res.success).toBe(false)
    })
  })
})
