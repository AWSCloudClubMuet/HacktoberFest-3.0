import { describe, it, expect } from 'vitest'
import { isTriggered, getAlertStatus } from './alertEval'
import type { Alert } from '../types'

describe('alertEval.ts', () => {
  const baseAlert: Alert = {
    id: 1,
    user_id: 1,
    crop_id: 1,
    market_id: 1,
    condition: 'Above',
    target_price: 4000,
    active_status: true,
  }

  describe('Above condition', () => {
    it('triggers when latest price > target_price', () => {
      expect(isTriggered(baseAlert, 4100)).toBe(true)
    })

    it('triggers when latest price == target_price (equality case)', () => {
      expect(isTriggered(baseAlert, 4000)).toBe(true)
    })

    it('does not trigger when latest price < target_price', () => {
      expect(isTriggered(baseAlert, 3950)).toBe(false)
    })
  })

  describe('Below condition', () => {
    const belowAlert: Alert = {
      ...baseAlert,
      condition: 'Below',
      target_price: 3500,
    }

    it('triggers when latest price < target_price', () => {
      expect(isTriggered(belowAlert, 3400)).toBe(true)
    })

    it('triggers when latest price == target_price (equality case)', () => {
      expect(isTriggered(belowAlert, 3500)).toBe(true)
    })

    it('does not trigger when latest price > target_price', () => {
      expect(isTriggered(belowAlert, 3600)).toBe(false)
    })
  })

  describe('Inactive alerts', () => {
    it('never triggers when active_status is false, even if Above condition is met', () => {
      const inactiveAlert: Alert = {
        ...baseAlert,
        active_status: false,
      }
      expect(isTriggered(inactiveAlert, 5000)).toBe(false)
    })

    it('never triggers when active_status is false, even if Below condition is met', () => {
      const inactiveBelowAlert: Alert = {
        ...baseAlert,
        condition: 'Below',
        target_price: 3500,
        active_status: false,
      }
      expect(isTriggered(inactiveBelowAlert, 2000)).toBe(false)
    })
  })

  describe('Edge cases (null or undefined price)', () => {
    it('returns false when latest price is null or undefined', () => {
      expect(isTriggered(baseAlert, null)).toBe(false)
      expect(isTriggered(baseAlert, undefined)).toBe(false)
    })
  })

  describe('getAlertStatus', () => {
    it('returns Inactive when active_status is false', () => {
      const inactive: Alert = { ...baseAlert, active_status: false }
      expect(getAlertStatus(inactive, 4500)).toBe('Inactive')
    })

    it('returns Triggered when active and condition is met', () => {
      expect(getAlertStatus(baseAlert, 4500)).toBe('Triggered')
    })

    it('returns Waiting when active but condition is not yet met', () => {
      expect(getAlertStatus(baseAlert, 3500)).toBe('Waiting')
    })
  })
})
