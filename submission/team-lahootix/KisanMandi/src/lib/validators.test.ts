import { describe, it, expect } from 'vitest'
import {
  normalizePhone,
  toWhatsAppNumber,
  isDateNotPast,
  userSchema,
  SINDH_DISTRICTS,
} from './validators'

describe('validators.ts', () => {
  describe('normalizePhone', () => {
    it('accepts valid 03XXXXXXXXX numbers', () => {
      expect(normalizePhone('03001230001')).toBe('03001230001')
      expect(normalizePhone('03459876543')).toBe('03459876543')
    })

    it('normalizes +923XXXXXXXXX format to 03XXXXXXXXX', () => {
      expect(normalizePhone('+923001230001')).toBe('03001230001')
      expect(normalizePhone('+923123456789')).toBe('03123456789')
    })

    it('normalizes 923XXXXXXXXX without plus', () => {
      expect(normalizePhone('923001230001')).toBe('03001230001')
    })

    it('handles spaces and hyphens gracefully', () => {
      expect(normalizePhone('0300-1230001')).toBe('03001230001')
      expect(normalizePhone('+92 300 1230001')).toBe('03001230001')
    })

    it('rejects invalid phone numbers', () => {
      expect(normalizePhone('0213123456')).toBeNull() // Landline
      expect(normalizePhone('0300123')).toBeNull() // Too short
      expect(normalizePhone('0300123456789')).toBeNull() // Too long
      expect(normalizePhone('abcdefghijk')).toBeNull() // Non-numeric
      expect(normalizePhone('')).toBeNull()
      expect(normalizePhone(null)).toBeNull()
    })
  })

  describe('toWhatsAppNumber', () => {
    it('converts local Pakistani format to WhatsApp international number', () => {
      expect(toWhatsAppNumber('03001230001')).toBe('923001230001')
      expect(toWhatsAppNumber('+923001230001')).toBe('923001230001')
      expect(toWhatsAppNumber('0300-123-0001')).toBe('923001230001')
    })
  })

  describe('isDateNotPast', () => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    it('returns true for today', () => {
      expect(isDateNotPast(todayStr)).toBe(true)
    })

    it('returns true for future dates', () => {
      expect(isDateNotPast('2099-12-31')).toBe(true)
    })

    it('returns false for past dates', () => {
      expect(isDateNotPast('2020-01-01')).toBe(false)
    })

    it('returns false for invalid date strings', () => {
      expect(isDateNotPast('')).toBe(false)
      expect(isDateNotPast('invalid-date')).toBe(false)
    })
  })

  describe('SINDH_DISTRICTS', () => {
    it('contains primary Sindh districts', () => {
      expect(SINDH_DISTRICTS).toContain('Hyderabad')
      expect(SINDH_DISTRICTS).toContain('Sukkur')
      expect(SINDH_DISTRICTS).toContain('Mirpurkhas')
      expect(SINDH_DISTRICTS).toContain('Karachi')
    })
  })

  describe('userSchema validation', () => {
    it('validates correct user data', () => {
      const valid = userSchema.safeParse({
        name: 'Ali Raza Memon',
        phone: '03001230001',
        district: 'Hyderabad',
        role: 'Farmer',
      })
      expect(valid.success).toBe(true)
    })

    it('rejects short name or invalid phone', () => {
      const invalid = userSchema.safeParse({
        name: 'A',
        phone: '123',
        district: 'Hyderabad',
        role: 'Farmer',
      })
      expect(invalid.success).toBe(false)
    })
  })
})
